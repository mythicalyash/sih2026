import os
import json
import logging
from typing import Optional, List, Tuple, Dict, Any
from pathlib import Path
from google import genai
from google.genai import types

from backend.schemas import CircuitIR
from backend.converter import ir_to_qasm

logger = logging.getLogger("qubit_lab.gemini")

# Model configuration
DEFAULT_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
FALLBACK_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-2.5-pro",
    "gemini-1.5-pro",
]

# In-memory runtime API key override
_runtime_api_key: Optional[str] = None


def get_api_key() -> Optional[str]:
    """Retrieve the Gemini API key from runtime memory, environment, or .env file."""
    global _runtime_api_key
    if _runtime_api_key:
        return _runtime_api_key

    # Check environment variable
    key = os.environ.get("GEMINI_API_KEY")
    if key and key.strip():
        return key.strip()

    # Check .env file in workspace
    for env_path in [Path(".env"), Path("backend/.env"), Path("../.env")]:
        if env_path.is_file():
            try:
                for line in env_path.read_text().splitlines():
                    line = line.strip()
                    if line.startswith("GEMINI_API_KEY=") or line.startswith("GOOGLE_API_KEY="):
                        val = line.split("=", 1)[1].strip().strip('"').strip("'")
                        if val:
                            return val
            except Exception:
                pass

    return None


def set_gemini_api_key(key: str) -> None:
    """Dynamically set the Gemini API key at runtime."""
    global _runtime_api_key
    _runtime_api_key = key.strip()
    os.environ["GEMINI_API_KEY"] = _runtime_api_key
    # Also save to .env
    try:
        env_file = Path(".env")
        lines = []
        if env_file.exists():
            lines = [l for l in env_file.read_text().splitlines() if not l.startswith("GEMINI_API_KEY=")]
        lines.append(f"GEMINI_API_KEY={_runtime_api_key}")
        env_file.write_text("\n".join(lines) + "\n")
    except Exception as e:
        logger.warning(f"Could not persist API key to .env: {e}")


def get_gemini_client() -> Optional[genai.Client]:
    """Return an initialized Google GenAI client if an API key is available."""
    key = get_api_key()
    if not key:
        return None
    try:
        return genai.Client(api_key=key)
    except Exception as e:
        logger.error(f"Failed to create Google GenAI client: {e}")
        return None


def is_gemini_active() -> Dict[str, Any]:
    """Check status of Gemini AI service."""
    key = get_api_key()
    has_key = bool(key and len(key) > 5)
    masked_key = f"{key[:4]}...{key[-4:]}" if has_key and len(key) >= 8 else None
    return {
        "active": has_key,
        "model": DEFAULT_MODEL,
        "has_api_key": has_key,
        "masked_key": masked_key,
    }


def _call_gemini_with_fallback(system_instruction: str, prompt: str) -> Optional[str]:
    """Attempt generation with primary model, falling back if model not found."""
    client = get_gemini_client()
    if not client:
        return None

    models_to_try = [DEFAULT_MODEL] + [m for m in FALLBACK_MODELS if m != DEFAULT_MODEL]

    for model_name in models_to_try:
        try:
            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.3,
                max_output_tokens=800,
            )
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config,
            )
            if response and response.text:
                return response.text.strip()
        except Exception as e:
            logger.warning(f"Gemini generation with {model_name} failed: {e}")
            continue

    return None


# ==============================================================================
# Socratic Problem Guidance with Gemini
# ==============================================================================

SOCRATIC_TUTOR_SYSTEM = """You are the Qubit.lab AI Socratic Tutor, an expert, enthusiastic quantum computing educator.
Your goal is to guide students to understand quantum mechanics and quantum circuit construction.
Important pedagogical guidelines:
1. Speak in a warm, encouraging, concise Socratic style (2-4 sentences max).
2. Do NOT give away the complete solution directly on Hint 1 or early queries.
3. Guide the student with thoughtful questions and clear conceptual hints.
4. Use plain clean text or Unicode quantum notation: |0⟩, |1⟩, |+⟩, |-⟩, 0, 1, H gate, CNOT.
5. NEVER use LaTeX math delimiters like $...$, \\rangle, \\beta, or \\alpha. Write plain |0⟩ and |1⟩ and 50% instead of LaTeX strings.
6. Ground your advice in the user's specific circuit state.
"""

def generate_gemini_problem_hint(
    problem_id: str,
    problem_title: str,
    problem_goal: str,
    problem_concept: str,
    circuit: CircuitIR,
    hint_level: int,
    deterministic_fallback: str,
) -> str:
    """Generate an adaptive, circuit-aware Socratic hint using Gemini Flash-Lite."""
    qasm_code = ir_to_qasm(circuit)
    gates_summary = [f"{g.name.upper()} on q{g.qubits}" for g in (circuit.gates or [])]
    gates_str = ", ".join(gates_summary) if gates_summary else "Empty circuit (no gates placed yet)"
    
    prompt = f"""Problem: {problem_title} ({problem_id})
Goal / Requirements: {problem_goal}
Key Concept: {problem_concept}

Student's Current Circuit & Progress So Far:
- Placed Gates: {gates_str}
- Number of Qubits: {circuit.num_qubits}
- OpenQASM 3.0:
```qasm
{qasm_code}
```

Hint Level Requested: {hint_level}
- Level 1: Gentle Socratic conceptual nudge acknowledging what they have placed so far and pointing toward the next intuition.
- Level 2: Architectural and gate direction (which qubit wire or gate type is needed next).
- Level 3: Concrete, actionable circuit guidance for the missing operation.

Instructions:
1. Directly acknowledge what the student has done so far on their circuit ({gates_str}).
2. Provide a 2-3 sentence Socratic hint tailored to their EXACT current circuit state and the requested hint level.
3. Encourage self-discovery without spoiling the entire puzzle."""

    result = _call_gemini_with_fallback(SOCRATIC_TUTOR_SYSTEM, prompt)
    return result if result else deterministic_fallback


def review_gemini_problem_circuit(
    problem_id: str,
    problem_title: str,
    problem_goal: str,
    circuit: CircuitIR,
    fallback_positives: List[str],
    fallback_guidance: List[str],
) -> Tuple[str, List[str], List[str]]:
    """Review student's circuit against the challenge goal with Gemini Flash-Lite."""
    qasm_code = ir_to_qasm(circuit)
    gates_summary = [f"{g.name.upper()} on q{g.qubits}" for g in (circuit.gates or [])]
    gates_str = ", ".join(gates_summary) if gates_summary else "No gates placed yet"
    
    prompt = f"""Challenge: {problem_title} ({problem_id})
Target Goal: {problem_goal}

Student's Current Circuit & Gate Placements:
- Placed Gates: {gates_str}
- Number of Qubits: {circuit.num_qubits}
- OpenQASM 3.0:
```qasm
{qasm_code}
```

Please perform a thorough quantum circuit code review:
1. Identify specifically what the student has done correctly so far (e.g. correct gate choice, right wire, proper initialization).
2. Identify specifically what is missing, in the wrong order, on the wrong qubit wire, or needs adjustment to meet the goal.

Respond strictly in JSON format:
{{
  "status": "in_progress" | "ready_to_check" | "incorrect",
  "positives": ["Specific positive observation 1", "Specific positive observation 2"],
  "guidance": ["Specific actionable guidance 1", "Specific actionable guidance 2"]
}}"""

    system_inst = "You are an automated quantum circuit code reviewer. Respond strictly in valid JSON with keys 'status', 'positives', and 'guidance'."
    result = _call_gemini_with_fallback(system_inst, prompt)
    
    if result:
        try:
            clean_json = result.strip()
            if clean_json.startswith("```"):
                clean_json = clean_json.split("\n", 1)[1]
                if clean_json.endswith("```"):
                    clean_json = clean_json.rsplit("\n", 1)[0]
            data = json.loads(clean_json)
            return (
                data.get("status", "in_progress"),
                data.get("positives", fallback_positives),
                data.get("guidance", fallback_guidance),
            )
        except Exception as e:
            logger.warning(f"Failed to parse Gemini circuit review JSON: {e}")

    return ("in_progress", fallback_positives, fallback_guidance)


def explain_gemini_problem_concept(
    problem_id: str,
    problem_title: str,
    concept_name: str,
    fallback_explanation: str,
    circuit: Optional[CircuitIR] = None,
) -> str:
    """Provide a circuit-aware, code-aware explanation of the quantum concept with Gemini Flash-Lite."""
    circuit_context = ""
    if circuit and circuit.gates:
        qasm_code = ir_to_qasm(circuit)
        gates_summary = [f"{g.name.upper()} on q{g.qubits}" for g in circuit.gates]
        circuit_context = f"""
Student's Current Circuit:
- Placed Gates: {', '.join(gates_summary)}
- OpenQASM 3.0:
```qasm
{qasm_code}
```
Directly reference how this concept applies to the student's current circuit layout above.
"""
    else:
        circuit_context = "The student currently has an empty circuit starting from ground state |0⟩."

    prompt = f"""Explain the quantum computing concept '{concept_name}' in the context of the challenge '{problem_title}'.

{circuit_context}

Make the explanation intuitive, concise, and educational (2-3 short paragraphs):
1. Physical and mathematical intuition (e.g. Bloch sphere rotation, superposition, or entanglement correlation).
2. How the specific quantum gates (e.g. H, X, CNOT) physically implement this transformation on the qubit wires.
3. How what they are building on the canvas directly realizes this principle."""

    result = _call_gemini_with_fallback(SOCRATIC_TUTOR_SYSTEM, prompt)
    return result if result else fallback_explanation


def ask_gemini_socratic_tutor(
    circuit: CircuitIR,
    question: str,
    problem_context: Optional[Dict[str, Any]] = None,
    fallback_response: str = "Let's inspect your quantum circuit together.",
) -> str:
    """Answer student questions during challenge solving using Gemini Flash-Lite."""
    qasm_code = ir_to_qasm(circuit)
    
    ctx_str = ""
    if problem_context:
        ctx_str = f"""Current Challenge: {problem_context.get('title', 'Quantum Problem')}
Goal: {problem_context.get('goal', '')}
Topic: {problem_context.get('topic', '')}
"""

    prompt = f"""{ctx_str}
Current Circuit (OpenQASM):
```qasm
{qasm_code}
```

Student Question: "{question}"

Please provide a helpful, encouraging, Socratic response (2-4 sentences). Answer their question directly while linking it back to the circuit on their screen and guiding them toward self-discovery."""

    result = _call_gemini_with_fallback(SOCRATIC_TUTOR_SYSTEM, prompt)
    return result if result else fallback_response


def explain_gemini_solution_feedback(
    problem_id: str,
    problem_title: str,
    problem_goal: str,
    circuit: CircuitIR,
    probabilities: Dict[str, float],
    fallback_explanation: str,
) -> str:
    """Generate personalized educational explanation for the student's verified solution."""
    qasm_code = ir_to_qasm(circuit)
    probs_str = ", ".join([f"|{s}⟩: {p*100:.1f}%" for s, p in probabilities.items()])
    
    prompt = f"""The student successfully solved the challenge '{problem_title}'!
Challenge Goal: {problem_goal}

Student's Verified Circuit (OpenQASM):
```qasm
{qasm_code}
```
Simulation Measurement Probabilities: {probs_str}

Please provide a concise, enthusiastic, educational 'Why It Works' breakdown (2-3 paragraphs):
1. Acknowledge the specific gates they used (e.g. Hadamard on q[0], CNOT connecting q[0] and q[1]).
2. Explain the physical state evolution step-by-step.
3. Connect it directly to the simulation probability results they observed.
Keep the tone encouraging, clear, and pedagogically sound."""

    result = _call_gemini_with_fallback(SOCRATIC_TUTOR_SYSTEM, prompt)
    return result if result else fallback_explanation
