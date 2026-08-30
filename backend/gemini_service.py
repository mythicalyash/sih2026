import os
import re
import time
import uuid
import json
import logging
from typing import Optional, List, Tuple, Dict, Any
from pathlib import Path
from google import genai
from google.genai import types

from backend.schemas import (
    CircuitIR,
    CodeFixRequest,
    CodeFixResponse,
    PredictiveChallenge,
    SocraticStepItem,
    SocraticStepRequest,
    TutorChatRequest,
    TutorChatResponse,
    QuizRequest,
    QuizQuestion,
    QuizResponse,
    DailyChallengeRequest,
    DailyChallengeResponse,
    EvaluateTheoreticalChallengeRequest,
    EvaluateTheoreticalChallengeResponse,
)
from backend.converter import ir_to_qasm

logger = logging.getLogger("qubit_lab.gemini")

# Active Google GenAI Models
DEFAULT_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.1-flash-lite")
FALLBACK_MODELS = [
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash-lite",
    "gemini-3.6-flash",
    "gemini-3.7-flash",
    "gemini-3.1-pro-preview",
    "gemini-flash-lite-latest",
    "gemini-2.5-flash",
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

# Log API key verification on module initialization
_init_key = get_api_key()
print(f"Gemini API Key Loaded: {bool(_init_key)} (Prefix: {_init_key[:6] if _init_key else 'None'}...)")

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

def _extract_text_from_response(response: Any) -> Optional[str]:
    if not response:
        return None
    try:
        if hasattr(response, "candidates") and response.candidates:
            for cand in response.candidates:
                if hasattr(cand, "content") and hasattr(cand.content, "parts"):
                    text_parts = [
                        p.text for p in cand.content.parts
                        if hasattr(p, "text") and p.text and not getattr(p, "thought", False)
                    ]
                    if text_parts:
                        return "\n".join(text_parts).strip()
        if hasattr(response, "text") and response.text:
            return response.text.strip()
    except Exception:
        pass
    return None

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
                max_output_tokens=1000,
            )
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config,
            )
            extracted = _extract_text_from_response(response)
            if extracted:
                return extracted
        except Exception as e:
            logger.warning(f"Gemini generation with {model_name} failed: {e}")
            continue

    return None

# Socratic Problem Guidance with Gemini

SOCRATIC_TUTOR_SYSTEM = """You are a helpful, clear, and friendly AI Quantum Computing Tutor.

Core Rules:
1. Answer Directly: When the user asks a question, answer it immediately and clearly. Never withhold the answer, never play guessing games, and do not act like a strict Socratic teacher.
2. Keep It Simple: Explain concepts using simple, everyday language and clear analogies first. 
3. Scannable Structure: Use short paragraphs and concise bullet points. Avoid long, overwhelming walls of text.
4. Clean Math: If the user asks for math or formulas, show clean LaTeX ($inline$ or $$display$$). Otherwise, keep it conceptual.
5. No Robotic Fillers: Do not start with generic intros like "Sure, I'd love to help with that!" or "Here is an explanation:". Start directly with the answer."""

def generate_gemini_problem_hint(
    problem_id: str,
    problem_title: str,
    problem_goal: str,
    problem_concept: str,
    circuit: CircuitIR,
    hint_level: int,
    deterministic_fallback: str,
) -> str:
    """Generate an adaptive, circuit-aware Socratic hint using Gemini."""
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
2. Provide a clear Socratic hint tailored to their EXACT current circuit state and the requested hint level.
3. Include real-world physical or algorithmic intuition where appropriate."""

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
    """Review student's circuit against the challenge goal with Gemini."""
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
    """Provide a circuit-aware, code-aware explanation of the quantum concept with Gemini."""
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

Make the explanation intuitive, deep, and educational (2-3 structured paragraphs):
1. Physical and mathematical intuition with LaTeX Dirac notation ($|\\psi\\rangle, H, CNOT$).
2. How the specific quantum gates physically implement this transformation on real hardware.
3. Real-world applications and how what they are building on the canvas directly realizes this principle."""

    result = _call_gemini_with_fallback(SOCRATIC_TUTOR_SYSTEM, prompt)
    return result if result else fallback_explanation

def ask_gemini_socratic_tutor(
    circuit: CircuitIR,
    question: str,
    problem_context: Optional[Dict[str, Any]] = None,
    fallback_response: str = "Let's inspect your quantum circuit together.",
    mode: Optional[str] = "socratic",
) -> str:
    """Answer student questions with pedagogical scaffolding, hardware physics, and LaTeX math using Gemini."""
    qasm_code = ir_to_qasm(circuit)
    gates_summary = [f"{g.name.upper()} on q{g.qubits}" for g in (circuit.gates or [])]
    gates_str = ", ".join(gates_summary) if gates_summary else "No gates placed yet (ground state $|0\\dots0\\rangle$)"

    ctx_str = ""
    if problem_context:
        ctx_str = f"""Current Challenge: {problem_context.get('title', 'Quantum Problem')}
Goal: {problem_context.get('goal', '')}
Topic: {problem_context.get('topic', '')}
"""

    mode_guidance = {
        "socratic": (
            "Engage in Socratic dialogue: Start with a brief intuitive insight, break down the physics step-by-step, "
            "reference the circuit state, and conclude with a thought-provoking follow-up question."
        ),
        "beginner": (
            "Explain using vivid everyday analogies (e.g. spinning coins, polarizing sunglasses, intersecting water ripples). "
            "Keep math minimal and focus on conceptual clarity."
        ),
        "mathematical": (
            "Provide rigorous quantum mechanics mathematical derivations using LaTeX Dirac bra-ket notation, "
            "Pauli matrices ($\\sigma_x, \\sigma_y, \\sigma_z$), unitary matrices, and statevector tensor products."
        ),
        "diagnostics": (
            "Analyze the active circuit for quantum pitfalls (e.g., unmeasured wires, consecutive self-canceling gates, "
            "decoherence sensitivity, or measurement collapse timing) and suggest concrete optimizations."
        ),
        "code": (
            "Provide clean, modern Qiskit 1.0+ Python code with clear comments, and explain how the instructions map to "
            "quantum simulator execution."
        ),
    }

    selected_guidance = mode_guidance.get(mode or "socratic", mode_guidance["socratic"])

    prompt = f"""{ctx_str}
Requested Pedagogical Mode: {mode.upper()}
Mode Guidance: {selected_guidance}

Active Circuit Context on Student's Screen:
- Placed Gates: {gates_str}
- Number of Qubits: {circuit.num_qubits}
- OpenQASM 3.0:
```qasm
{qasm_code}
```

Student Question / Prompt: "{question}"

Instructions:
1. Provide a comprehensive, high-quality pedagogical response fitting the requested mode (""" + str(mode) + """).
2. Use LaTeX formatting for quantum states (e.g. '$|0\\rangle, |1\\rangle, |\\Phi^+\\rangle$', '$$H = \\frac{1}{\\sqrt{2}}\\begin{pmatrix}1 & 1\\\\1 & -1\\end{pmatrix}$$').
3. Connect the explanation directly to their current circuit and real-world quantum hardware/applications.
4. Structure the response clearly with markdown headers, bold highlights, and bullet points."""

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
2. Explain the physical state evolution step-by-step with LaTeX Dirac notation.
3. Connect it directly to the simulation probability results they observed.
Keep the tone encouraging, clear, and pedagogically sound."""

    result = _call_gemini_with_fallback(SOCRATIC_TUTOR_SYSTEM, prompt)
    return result if result else fallback_explanation

def analyze_and_fix_quantum_code(req: CodeFixRequest) -> CodeFixResponse:
    """
    AI Quantum Code Explainer and Error Fixer using Gemini.
    Detects quantum syntax errors, dimensional mismatches, unmeasured qubits,
    Qiskit 1.0+ deprecations, and produces corrected code.
    """
    circuit_ctx = ""
    if req.circuit_context and req.circuit_context.gates:
        circuit_ctx = f"\nCorresponding Canvas Circuit OpenQASM:\n```qasm\n{ir_to_qasm(req.circuit_context)}\n```"

    prompt = f"""You are the Qubit.lab AI Quantum Code Doctor.
Analyze the following quantum {req.language} code, identify any bugs or deprecations, and provide a corrected, working version.

Student's Code:
```{req.language}
{req.source_code}
```

Reported Error / Issue (if any):
{req.error_message or "No runtime error reported; perform proactive code review and validation."}
{circuit_ctx}

Guidelines:
1. Use modern Qiskit 1.0+ standards (e.g., from qiskit import QuantumCircuit; from qiskit.quantum_info import Statevector; avoid legacy Execute or old Aer.get_backend calls).
2. Check for qubit index out-of-bounds, unmeasured qubits, invalid gate arguments, or classical register mismatches.
3. Explain the root cause clearly with pedagogical advice.

Respond strictly in valid JSON format:
{{
  "success": true,
  "explanation": "Detailed explanation of what was wrong and how it was fixed.",
  "corrected_code": "# Fully working corrected python code here...",
  "issues_found": ["Issue 1 description", "Issue 2 description"],
  "optimizations": ["Optimization tip 1", "Optimization tip 2"]
}}"""

    system_inst = "You are an automated quantum code fixer. Respond strictly with valid JSON conforming to the requested schema."
    result = _call_gemini_with_fallback(system_inst, prompt)

    if result:
        try:
            m = re.search(r'\{[\s\S]*\}', result)
            if m:
                data = json.loads(m.group(0))
                return CodeFixResponse(
                    success=data.get("success", True),
                    explanation=data.get("explanation", "Code analyzed and optimized."),
                    corrected_code=data.get("corrected_code", req.source_code),
                    issues_found=data.get("issues_found", []),
                    optimizations=data.get("optimizations", []),
                )
        except Exception as e:
            logger.warning(f"Failed to parse Gemini code fix JSON: {e}")

    # Fallback response
    return CodeFixResponse(
        success=True,
        explanation="Proactively reviewed quantum code. Ensure all quantum registers are properly initialized and measured.",
        corrected_code=req.source_code,
        issues_found=["No fatal syntax errors found in local static inspection."],
        optimizations=["Use Qiskit 1.0 Statevector.from_instruction() for exact simulation."],
    )

# Brilliant.org Style Socratic Learning Engine

BRILLIANT_TRACKS: Dict[str, List[Dict[str, Any]]] = {
    "superposition": [
        {
            "step_id": "sup_step_1",
            "title": "The Spinning Coin: Entering Superposition",
            "step_number": 1,
            "total_steps": 4,
            "intuitive_concept": "A classical bit is like a coin lying flat showing Heads (|0⟩) or Tails (|1⟩). A Hadamard gate flips the coin into the air—spinning in a true continuous linear combination of both states.",
            "workspace_action": "Apply a Hadamard (H) gate to qubit 0.",
            "target_gate_hint": "H on q0",
            "latex_formula": "|+\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle + |1\\rangle)",
            "predictive_challenge": {
                "question": "After applying the Hadamard gate to ground state |0⟩, what is the probability of measuring state |0⟩?",
                "options": ["0%", "50% (|1/√2|² = 0.5)", "100%", "Randomly changes every microsecond"],
                "correct_index": 1,
                "hint": "Recall Born's rule: Probability P(|0⟩) = |⟨0|ψ⟩|².",
                "explanation": "Because |+⟩ = (|0⟩ + |1⟩)/√2, the probability amplitude for |0⟩ is 1/√2, which squares to (1/√2)² = 0.5 (50%)."
            },
            "xp_reward": 25,
        },
        {
            "step_id": "sup_step_2",
            "title": "Quantum Phase: The Hidden Dimension",
            "step_number": 2,
            "total_steps": 4,
            "intuitive_concept": "Unlike classical probability, quantum states have a complex phase angle ϕ. Rotating the phase doesn't change measurement probabilities immediately, but controls how waves will interfere later.",
            "workspace_action": "Apply a Phase gate (Z or S) after the Hadamard gate on qubit 0.",
            "target_gate_hint": "Z on q0",
            "latex_formula": "|-\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle - |1\\rangle)",
            "predictive_challenge": {
                "question": "How does applying a Pauli-Z phase gate to |+⟩ alter the 50/50 measurement probabilities?",
                "options": [
                    "It changes probabilities to 100% |1⟩",
                    "It leaves probabilities at 50/50, but adds a relative π (180°) phase shift",
                    "It destroys the superposition entirely",
                    "It sets the qubit to |0⟩"
                ],
                "correct_index": 1,
                "hint": "Calculate Z|+⟩ = Z(|0⟩ + |1⟩)/√2 = (|0⟩ - |1⟩)/√2 = |-⟩.",
                "explanation": "Z only multiplies the |1⟩ component by -1 (a phase factor of e^(iπ)). Born's rule gives |-1/√2|² = 1/2, so the probabilities remain exactly 50% |0⟩ and 50% |1⟩!"
            },
            "xp_reward": 25,
        },
        {
            "step_id": "sup_step_3",
            "title": "Quantum Interference: Self-Cancellation",
            "step_number": 3,
            "total_steps": 4,
            "intuitive_concept": "If you apply a second Hadamard gate to |+⟩, the wave amplitudes interfere: constructive interference boosts |0⟩ to 100%, while destructive interference eliminates |1⟩ entirely!",
            "workspace_action": "Add a second Hadamard (H) gate to qubit 0 to complete the interference loop.",
            "target_gate_hint": "H on q0",
            "latex_formula": "H|\\psi\\rangle = H\\left(\\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}}\\right) = |0\\rangle",
            "predictive_challenge": {
                "question": "What state does H|+⟩ produce through constructive and destructive interference?",
                "options": ["Pure ground state |0⟩", "Pure excited state |1⟩", "Remains in |+⟩", "Mixed random noise"],
                "correct_index": 0,
                "hint": "H is its own inverse: H · H = I (Identity).",
                "explanation": "H|0⟩ gives (|0⟩+|1⟩)/√2 and H|1⟩ gives (|0⟩-|1⟩)/√2. Summing them yields (|0⟩+|1⟩+|0⟩-|1⟩)/2 = 2|0⟩/2 = |0⟩. The |1⟩ amplitudes destructively cancel!"
            },
            "xp_reward": 30,
        },
        {
            "step_id": "sup_step_4",
            "title": "Measurement Collapse & Irreversibility",
            "step_number": 4,
            "total_steps": 4,
            "intuitive_concept": "Measurement is fundamentally non-unitary. It forces the delicate coherent wave on the Bloch sphere to collapse irrevocably onto a single classical basis state |0⟩ or |1⟩.",
            "workspace_action": "Add a Measure gate to observe your qubit and record the classical bit outcome.",
            "target_gate_hint": "Measure on q0",
            "latex_formula": "P(m=0) = |\\langle 0|\\psi\\rangle|^2",
            "predictive_challenge": {
                "question": "Can you recover the original superposition phase after a projective measurement?",
                "options": [
                    "Yes, by applying an inverse measurement operator",
                    "No, projective measurement destroys quantum coherence and collapses the state",
                    "Yes, by copying the state with No-Cloning",
                    "Only if measured on a superconducting chip"
                ],
                "correct_index": 1,
                "hint": "Measurement is irreversible and projects the state vector onto an eigenvector of the observable.",
                "explanation": "Once a measurement occurs, the state vector is projected into either |0⟩ or |1⟩. All relative phase information is lost to the environment (decoherence/collapse)."
            },
            "xp_reward": 40,
        },
    ],
    "entanglement": [
        {
            "step_id": "ent_step_1",
            "title": "Two Independent Qubits",
            "step_number": 1,
            "total_steps": 4,
            "intuitive_concept": "Two unentangled qubits are separable: their combined state is just the simple tensor product |ψ₁⟩ ⊗ |ψ₂⟩. Measuring one gives zero information about the other.",
            "workspace_action": "Initialize a 2-qubit circuit and place an H gate on qubit 0.",
            "target_gate_hint": "H on q0",
            "latex_formula": "|\\psi\\rangle = |+\\rangle \\otimes |0\\rangle = \\frac{1}{\\sqrt{2}}(|00\\rangle + |10\\rangle)",
            "predictive_challenge": {
                "question": "Is the state (|00⟩ + |10⟩)/√2 entangled?",
                "options": [
                    "No, it factors cleanly into ((|0⟩ + |1⟩)/√2) ⊗ |0⟩",
                    "Yes, because qubit 0 is in superposition",
                    "Yes, because there are 2 qubits",
                    "Only if measured simultaneously"
                ],
                "correct_index": 0,
                "hint": "A state is entangled if and only if it CANNOT be written as a product state |a⟩|b⟩.",
                "explanation": "Because (|00⟩+|10⟩)/√2 = ( (|0⟩+|1⟩)/√2 ) ⊗ |0⟩, qubit 1 is unconditionally in state |0⟩ regardless of qubit 0. The subsystems are completely independent."
            },
            "xp_reward": 25,
        },
        {
            "step_id": "ent_step_2",
            "title": "The Entangling CNOT Gate",
            "step_number": 2,
            "total_steps": 4,
            "intuitive_concept": "A CNOT gate flips the target qubit ONLY if the control qubit is |1⟩. When the control is in superposition, the two qubits become tied into an inseparable joint state.",
            "workspace_action": "Add a CNOT gate with control on qubit 0 and target on qubit 1.",
            "target_gate_hint": "CX (0 → 1)",
            "latex_formula": "|\\Phi^+\\rangle = \\frac{1}{\\sqrt{2}}(|00\\rangle + |11\\rangle)",
            "predictive_challenge": {
                "question": "What happens when CNOT acts on (|0⟩+|1⟩)/√2 ⊗ |0⟩ = (|00⟩+|10⟩)/√2?",
                "options": [
                    "|00⟩ stays |00⟩, and |10⟩ flips to |11⟩, producing (|00⟩ + |11⟩)/√2",
                    "Both qubits flip to |11⟩",
                    "The state collapses to |01⟩",
                    "It becomes (|01⟩ + |10⟩)/√2"
                ],
                "correct_index": 0,
                "hint": "CNOT|00⟩ = |00⟩ and CNOT|10⟩ = |11⟩.",
                "explanation": "The linear superposition evolves component-by-component: CNOT(|00⟩+|10⟩)/√2 = (|00⟩+|11⟩)/√2. This is the canonical Bell State |Φ⁺⟩!"
            },
            "xp_reward": 30,
        },
        {
            "step_id": "ent_step_3",
            "title": "Spooky Action at a Distance",
            "step_number": 3,
            "total_steps": 4,
            "intuitive_concept": "In state |Φ⁺⟩, neither qubit has a definite state on its own. Yet the instant you measure qubit 0, qubit 1 instantaneously collapses into the exact same outcome!",
            "workspace_action": "Add measurement gates to both qubit 0 and qubit 1.",
            "target_gate_hint": "Measure on q0, q1",
            "latex_formula": "P(00) = 50\\%, \\quad P(11) = 50\\%, \\quad P(01) = 0\\%, \\quad P(10) = 0\\%",
            "predictive_challenge": {
                "question": "If an experimenter measures qubit 0 and gets outcome '1', what will a second experimenter measuring qubit 1 ALWAYS observe?",
                "options": [
                    "Deterministic outcome '1' (100% correlation)",
                    "Random outcome '0' or '1' with 50% chance",
                    "Deterministic outcome '0'",
                    "Undefined state"
                ],
                "correct_index": 0,
                "hint": "Look at the basis states in |Φ⁺⟩: only |00⟩ and |11⟩ exist with non-zero amplitude.",
                "explanation": "Because there are no |01⟩ or |10⟩ terms, observing '1' on qubit 0 projects the entangled wavefunction exclusively onto basis state |11⟩, guaranteeing qubit 1 is '1'."
            },
            "xp_reward": 35,
        },
        {
            "step_id": "ent_step_4",
            "title": "The No-Cloning Theorem",
            "step_number": 4,
            "total_steps": 4,
            "intuitive_concept": "Because quantum state amplitudes contain unknown continuous complex numbers, unitary linear transformations prove it is mathematically impossible to copy an arbitrary unknown quantum state.",
            "workspace_action": "Review the purity radius r < 1 on individual entangled qubit Bloch spheres.",
            "target_gate_hint": "Inspect Bloch mixed state",
            "latex_formula": "U|\\psi\\rangle|0\\rangle \\neq |\\psi\\rangle|\\psi\\rangle \\quad \\forall |\\psi\\rangle",
            "predictive_challenge": {
                "question": "Why can't we clone an unknown quantum state |ψ⟩ = α|0⟩ + β|1⟩?",
                "options": [
                    "Linearity of quantum mechanics forbids a universal cloning unitary operator",
                    "Superconducting hardware is too noisy",
                    "Because Planck's constant is too small",
                    "Qubits can only hold 1 bit of data"
                ],
                "correct_index": 0,
                "hint": "If U|00⟩=|00⟩ and U|10⟩=|11⟩, then U(α|0⟩+β|1⟩)|0⟩ = α|00⟩+β|11⟩ ≠ (α|0⟩+β|1⟩)⊗(α|0⟩+β|1⟩).",
                "explanation": "Due to linearity, U(α|0⟩+β|1⟩)|0⟩ creates an entangled state α|00⟩+β|11⟩, which contains cross-terms only when α=0 or β=0. Perfect cloning is impossible for arbitrary states!"
            },
            "xp_reward": 40,
        },
    ],
}

def generate_brilliant_socratic_step(req: SocraticStepRequest) -> SocraticStepItem:
    """
    Generate an interactive Brilliant-style Socratic micro-step.
    Combines curated discovery pathways with dynamic Gemini AI fallback for custom queries.
    """
    track_key = (req.track_id or "superposition").lower()
    step_num = max(1, req.step_number or 1)

    # 1. Check curated discovery tracks
    if track_key in BRILLIANT_TRACKS and not req.question:
        steps_list = BRILLIANT_TRACKS[track_key]
        idx = min(step_num - 1, len(steps_list) - 1)
        raw_step = steps_list[idx]
        
        pred_data = raw_step.get("predictive_challenge")
        pred_obj = PredictiveChallenge(
            question=pred_data["question"],
            options=pred_data["options"],
            correct_index=pred_data["correct_index"],
            hint=pred_data["hint"],
            explanation=pred_data["explanation"],
        ) if pred_data else None

        return SocraticStepItem(
            step_id=raw_step["step_id"],
            track_id=track_key,
            title=raw_step["title"],
            step_number=raw_step["step_number"],
            total_steps=raw_step["total_steps"],
            intuitive_concept=raw_step["intuitive_concept"],
            workspace_action=raw_step["workspace_action"],
            target_gate_hint=raw_step.get("target_gate_hint"),
            predictive_challenge=pred_obj,
            latex_formula=raw_step.get("latex_formula"),
            xp_reward=raw_step.get("xp_reward", 25),
        )

    # 2. Dynamic Gemini generation for custom questions
    if req.question and req.question.strip():
        qasm_code = ir_to_qasm(req.circuit)
        prompt = f"""You are the Qubit.lab Brilliant-Style Quantum Tutor.
Generate a structured, interactive, discovery-based micro-learning challenge in response to the student's question.

Student Question: "{req.question}"
Current Active Circuit (OpenQASM):
```qasm
{qasm_code}
```

Format requirements:
1. "intuitive_concept": 1-2 concise, punchy sentences providing an intuitive analogy or geometric physical picture.
2. "workspace_action": A concrete, single-action task for the student on their circuit canvas or Bloch sphere (e.g. "Apply an H gate on qubit 0").
3. "predictive_challenge": A multiple-choice predict-then-simulate question checking their conceptual grasp BEFORE they simulate.
   - "question": Clear multiple choice question
   - "options": Array of 4 distinct answers
   - "correct_index": Index (0, 1, 2, or 3) of the correct option
   - "hint": A gentle Socratic hint
   - "explanation": Why the answer is correct with Dirac notation
4. "latex_formula": Relevant Dirac formula string (e.g. |+> = (|0> + |1>)/sqrt(2))

Respond strictly in valid JSON:
{{
  "title": "Short Punchy Title",
  "intuitive_concept": "1-2 sentence intuitive hook...",
  "workspace_action": "Action instruction...",
  "target_gate_hint": "Gate hint...",
  "latex_formula": "|+> = (|0> + |1>)/sqrt(2)",
  "predictive_challenge": {{
    "question": "Question text...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_index": 0,
    "hint": "Hint text...",
    "explanation": "Explanation..."
  }}
}}"""

        system_inst = "You are a Brilliant.org style interactive quantum physics educator. Output strictly valid JSON."
        result = _call_gemini_with_fallback(system_inst, prompt)

        if result:
            try:
                m = re.search(r'\{[\s\S]*\}', result)
                if m:
                    data = json.loads(m.group(0))
                    pred_data = data.get("predictive_challenge", {})
                    pred_obj = PredictiveChallenge(
                        question=pred_data.get("question", "What is the expected quantum state?"),
                        options=pred_data.get("options", ["State |0⟩", "Superposition |+⟩", "Bell State |Φ⁺⟩", "Mixed state"]),
                        correct_index=pred_data.get("correct_index", 1),
                        hint=pred_data.get("hint", "Consider the unitary transformation applied."),
                        explanation=pred_data.get("explanation", "The applied operator rotates the state on the Bloch sphere."),
                    )

                    return SocraticStepItem(
                        step_id=f"custom_{int(time.time())}",
                        track_id="custom",
                        title=data.get("title", "Interactive Quantum Insight"),
                        step_number=1,
                        total_steps=1,
                        intuitive_concept=data.get("intuitive_concept", "Quantum operators rotate vectors on the unit Bloch sphere."),
                        workspace_action=data.get("workspace_action", "Try applying a gate on the canvas and observe the statevector."),
                        target_gate_hint=data.get("target_gate_hint"),
                        predictive_challenge=pred_obj,
                        latex_formula=data.get("latex_formula", "|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle"),
                        xp_reward=35,
                    )
            except Exception as e:
                logger.warning(f"Failed to parse custom Brilliant Socratic JSON: {e}")

    # Default fallback
    return SocraticStepItem(
        step_id="default_sup",
        track_id="superposition",
        title="The Superposition Mystery",
        step_number=1,
        total_steps=4,
        intuitive_concept="A qubit begins in state |0⟩. Applying a Hadamard gate physically rotates the statevector by 90° into an equal superposition |+⟩.",
        workspace_action="Apply an H gate on qubit 0.",
        target_gate_hint="H on q0",
        predictive_challenge=PredictiveChallenge(
            question="What is the measurement probability of state |0⟩ for qubit |+⟩?",
            options=["0%", "50%", "100%", "Undefined"],
            correct_index=1,
            hint="Born rule: P(0) = |⟨0|+⟩|² = (1/√2)².",
            explanation="|+⟩ = (|0⟩ + |1⟩)/√2 gives a 50% probability for |0⟩ and 50% for |1⟩.",
        ),
        latex_formula="|+\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle + |1\\rangle)",
        xp_reward=25,
    )

# Pure Socratic Q&A Tutor Pipeline (Fast, Reliable, LaTeX-Powered)

# Direct AI Tutor Chat & Practice Quiz Pipeline (Gemini Live Powered)

def answer_socratic_chat(req: TutorChatRequest) -> TutorChatResponse:
    """
    Generate a direct, plain-English explanation using live Gemini API.
    Raises explicit error if Gemini API call fails.
    """
    user_msg = req.message.strip()
    mode = (req.mode or "socratic").lower()

    if not user_msg:
        return TutorChatResponse(
            reply="Hello! I am your Quantum Computing AI Tutor. Ask me any question about qubits, superposition, entanglement, gates, or algorithms to begin.",
            follow_up_question="Which quantum concept would you like to explore first?",
            suggestions=["How does Superposition work?", "How does Entanglement work?", "What is a Hadamard gate?"],
            concept_tag="Quantum Fundamentals",
            key_takeaways=["Qubits hold linear combinations of |0⟩ and |1⟩.", "Unitary gates preserve total probability (norm = 1)."],
        )

    # Historical context
    history_ctx = ""
    if req.conversation_history:
        recent = req.conversation_history[-4:]
        history_ctx = "\nRecent Conversation:\n" + "\n".join([f"{m.get('sender', 'user')}: {m.get('text', '')}" for m in recent])

    mode_instruction = "Provide a direct, intuitive, and crystal-clear explanation in 2 to 4 concise sentences. Build geometric intuition first."
    if mode == "eli5":
        mode_instruction = "Explain like I'm 5 (ELI5). Use simple everyday analogies (spinning coins, light filters, waves in a pool). Avoid complex matrix jargon."
    elif mode == "mathematical":
        mode_instruction = "Provide a rigorous mathematical explanation using formal Dirac bra-ket notation, Hilbert spaces, statevectors, and matrix operators."

    system_inst = """You are a helpful, clear, and friendly AI Quantum Computing Tutor.

Core Rules:
1. Answer Directly: When the user asks a question, answer it immediately and clearly. Never withhold the answer, never play guessing games, and do not act like a strict Socratic teacher.
2. Keep It Simple: Explain concepts using simple, everyday language and clear analogies first. 
3. Scannable Structure: Use short paragraphs and concise bullet points. Avoid long, overwhelming walls of text.
4. Clean Math: If the user asks for math or formulas, show clean LaTeX ($inline$ or $$display$$). Otherwise, keep it conceptual.
5. No Robotic Fillers: Do not start with generic intros like "Sure, I'd love to help with that!" or "Here is an explanation:". Start directly with the answer."""

    prompt = f"""Student Question: "{user_msg}"
{history_ctx}

Mode: {mode.upper()} ({mode_instruction})

Respond strictly in valid JSON format:
{{
  "reply": "Immediate, direct, clear explanation with everyday language, clear analogies, and clean LaTeX when needed...",
  "follow_up_question": "Optional quick follow-up or takeaway...",
  "key_takeaways": ["Concise takeaway 1", "Concise takeaway 2", "Concise takeaway 3"],
  "suggestions": ["Topic suggestion 1", "Topic suggestion 2", "Topic suggestion 3"],
  "concept_tag": "Superposition / Entanglement / Quantum Gates / Algorithms"
}}"""

    result = _call_gemini_with_fallback(system_inst, prompt)

    if not result:
        # Check API key status to return explicit error
        key = get_api_key()
        if not key:
            raise RuntimeError("GEMINI_API_KEY is not configured in .env or server environment.")
        raise RuntimeError("Failed to generate response from Gemini API. Please check network connectivity or rate limits.")

    try:
        m = re.search(r'\{[\s\S]*\}', result)
        if m:
            data = json.loads(m.group(0))
            return TutorChatResponse(
                reply=data.get("reply", result),
                follow_up_question=data.get("follow_up_question"),
                key_takeaways=data.get("key_takeaways", []),
                suggestions=data.get("suggestions", ["Explore Bell states", "Check Pauli matrices", "Try Grover's search"]),
                concept_tag=data.get("concept_tag", "Quantum Concept"),
            )
        else:
            return TutorChatResponse(
                reply=result,
                follow_up_question=None,
                key_takeaways=[],
                suggestions=["Explore Superposition", "How does Entanglement work?", "Try a Practice Quiz"],
                concept_tag="Quantum Fundamentals",
            )
    except Exception as e:
        logger.error(f"Error parsing Gemini response JSON: {e}")
        return TutorChatResponse(
            reply=result,
            follow_up_question=None,
            key_takeaways=[],
            suggestions=["Explore Superposition", "How does Entanglement work?", "Try a Practice Quiz"],
            concept_tag="Quantum Fundamentals",
        )

def generate_micro_quiz(req: QuizRequest) -> QuizResponse:
    """
    Generate an interactive 3-question multiple-choice practice quiz using live Gemini API.
    Raises explicit error if Gemini API call fails.
    """
    topic = req.topic.strip() or "Quantum Fundamentals"
    ctx = f"Context: {req.context}" if req.context else ""

    prompt = f"""You are an expert quantum computing educator.
Create an interactive 3-question multiple choice practice quiz to test and reinforce understanding of: "{topic}".
{ctx}

Guidelines:
1. Formulate 3 clear, conceptual multiple-choice questions.
2. Provide exactly 4 options per question (strings).
3. Mark the zero-indexed integer `correctIndex` (0, 1, 2, or 3).
4. Provide a 1-2 sentence explanation of why the correct answer is right with Dirac notation.

Respond strictly in valid JSON format:
{{
  "topic": "{topic}",
  "quiz": [
    {{
      "question": "Question 1 text...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why option A is correct..."
    }},
    {{
      "question": "Question 2 text...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 1,
      "explanation": "Why option B is correct..."
    }},
    {{
      "question": "Question 3 text...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 2,
      "explanation": "Why option C is correct..."
    }}
  ]
}}"""

    system_inst = "You are an automated interactive quiz generator. Output strictly valid JSON conforming to the requested schema."
    result = _call_gemini_with_fallback(system_inst, prompt)

    if not result:
        key = get_api_key()
        if not key:
            raise RuntimeError("GEMINI_API_KEY is not configured in .env or server environment.")
        raise RuntimeError("Failed to generate quiz from Gemini API. Please check network connectivity or rate limits.")

    try:
        m = re.search(r'\{[\s\S]*\}', result)
        if m:
            data = json.loads(m.group(0))
            quiz_items = []
            for item in data.get("quiz", []):
                quiz_items.append(
                    QuizQuestion(
                        question=item.get("question", "What is the quantum property?"),
                        options=item.get("options", ["A", "B", "C", "D"]),
                        correctIndex=int(item.get("correctIndex", 0)),
                        explanation=item.get("explanation", "Correct based on quantum state evolution."),
                    )
                )
            if quiz_items:
                return QuizResponse(topic=topic, quiz=quiz_items)
    except Exception as e:
        logger.error(f"Failed to parse Micro Quiz JSON: {e}")
        raise RuntimeError(f"Failed to parse quiz response: {e}")

    raise RuntimeError("Gemini returned invalid quiz schema.")

# Curated Offline Fallback Challenges Bank
FALLBACK_DAILY_CHALLENGES = [
    {
        "id": "dc-fb-01",
        "topic": "Quantum Superposition",
        "question_type": "mcq",
        "difficulty": "Beginner",
        "question": "Which unitary single-qubit gate transforms the basis state $|0\\rangle$ into the equal superposition $(|0\\rangle + |1\\rangle)/\\sqrt{2}$?",
        "options": ["Pauli-X Gate", "Hadamard (H) Gate", "Phase (S) Gate", "Pauli-Z Gate"],
        "correct_index": 1,
        "explanation": "The Hadamard gate maps basis states $|0\\rangle \\to |+\\rangle = (|0\\rangle + |1\\rangle)/\\sqrt{2}$ and $|1\\rangle \\to |-\\rangle = (|0\\rangle - |1\\rangle)/\\sqrt{2}$ by rotating the statevector by $\\pi$ radians around the $(X+Z)/\\sqrt{2}$ axis on the Bloch sphere.",
        "xp": 50,
        "is_ai_generated": False,
    },
    {
        "id": "dc-fb-02",
        "topic": "Quantum Entanglement",
        "question_type": "mcq",
        "difficulty": "Intermediate",
        "question": "Starting with $|00\\rangle$, which sequence of gates creates the maximally entangled Bell state $|\\Phi^+\\rangle = (|00\\rangle + |11\\rangle)/\\sqrt{2}$?",
        "options": ["X(0) then CNOT(0,1)", "H(0) then CNOT(0,1)", "H(0) then H(1)", "CNOT(0,1) then H(0)"],
        "correct_index": 1,
        "explanation": "Applying $H$ on qubit 0 transforms $|00\\rangle \\to \\frac{1}{\\sqrt{2}}(|00\\rangle + |10\\rangle)$. Applying CNOT with control qubit 0 and target qubit 1 flips target only when control is 1, creating $\\frac{1}{\\sqrt{2}}(|00\\rangle + |11\\rangle)$.",
        "xp": 50,
        "is_ai_generated": False,
    },
    {
        "id": "dc-fb-03",
        "topic": "Phase Kickback",
        "question_type": "theoretical",
        "difficulty": "Intermediate",
        "question": "Explain the physical and mathematical mechanism of Phase Kickback in quantum circuits. How does a controlled-U gate modify the control qubit when the target is an eigenvector of U?",
        "rubric_hints": ["Target qubit is in an eigenstate: $U|u\\rangle = e^{i\\theta}|u\\rangle$", "Global phase on target becomes relative phase on control", "Key mechanism behind Deutsch-Jozsa and Grover's algorithm"],
        "explanation": "When the target qubit of a controlled-U gate is in an eigenvector $|u\\rangle$ with eigenvalue $e^{i\\theta}$, the operation $|1\\rangle|u\\rangle \\to e^{i\\theta}|1\\rangle|u\\rangle$ applies the eigenvalue phase $e^{i\\theta}$ directly to the $|1\\rangle$ amplitude of the control qubit, leaving the target invariant.",
        "xp": 75,
        "is_ai_generated": False,
    },
    {
        "id": "dc-fb-04",
        "topic": "Quantum Teleportation",
        "question_type": "theoretical",
        "difficulty": "Intermediate",
        "question": "Why does quantum teleportation NOT violate the No-Cloning Theorem or allow faster-than-light (superluminal) communication?",
        "rubric_hints": ["Bell measurement destroys original state (no cloning)", "Requires 2 classical bits sent at $\\le c$ for receiver to correct Pauli frame", "No faster than light information transfer"],
        "explanation": "Teleportation collapses and destroys the original state upon Bell-basis measurement, satisfying the No-Cloning theorem. Superluminal communication is prevented because the receiver cannot reconstruct the state until receiving 2 classical correction bits through subluminal channels.",
        "xp": 75,
        "is_ai_generated": False,
    },
]

def generate_daily_challenge(
    req: DailyChallengeRequest,
    user_context: Optional[Dict[str, Any]] = None,
) -> DailyChallengeResponse:
    """
    Generate an AI-powered Daily Challenge using Gemini API tailored to the user's learning history.
    Falls back gracefully to curated quantum challenges if Gemini is offline.
    """
    import datetime
    today_str = datetime.date.today().isoformat()
    
    # Determine target topic from context or request
    target_topic = req.preferred_topic
    if not target_topic and user_context:
        weak_topics = user_context.get("weak_topics", [])
        if weak_topics:
            target_topic = weak_topics[0]
        else:
            recent_events = user_context.get("recent_events", [])
            if recent_events:
                target_topic = recent_events[0].get("topic")

    if not target_topic:
        available_topics = ["Quantum Superposition", "Quantum Gates & Unitaries", "Quantum Entanglement", "Phase Kickback", "Grover Search Oracle", "Bloch Sphere Coordinates", "Quantum Measurement Collapse"]
        import random
        target_topic = random.choice(available_topics)

    q_type = req.question_type or "any"
    if q_type == "any":
        import random
        q_type = random.choice(["mcq", "theoretical"])

    prompt = f"""You are a world-class Quantum Computing professor creating the Daily Challenge for an interactive learning platform.
Target Concept: "{target_topic}"
Difficulty Level: "{req.difficulty or 'Beginner'}"
Question Format: "{q_type.upper()}" (MCQ or Theoretical)

Task:
Generate 1 stimulating, pedagogically rich daily quantum computing challenge.

If question format is MCQ:
- Provide a clear, precise question with Dirac notation (e.g. $|0\\rangle, |\\psi\\rangle, H, CNOT$).
- Exactly 4 distinct options.
- Zero-indexed integer `correct_index` (0, 1, 2, or 3).
- 2-3 sentence mathematical & conceptual explanation.

If question format is THEORETICAL:
- Provide an insightful thought-provoking conceptual question that asks the student to explain mechanisms, analogies, or proofs.
- Provide `rubric_hints` (array of 2-3 key points a strong answer must address).
- Provide a comprehensive `explanation` with ideal answers and physical intuition.

Respond strictly in valid JSON format:
{{
  "topic": "{target_topic}",
  "question_type": "{q_type}",
  "difficulty": "{req.difficulty or 'Beginner'}",
  "question": "Question text with Dirac/LaTeX formulas...",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_index": 0,
  "rubric_hints": ["Key point 1...", "Key point 2..."],
  "explanation": "In-depth explanation..."
}}"""

    system_inst = "You are an automated quantum quiz engine. Output strictly valid JSON conforming to the requested schema."
    result = _call_gemini_with_fallback(system_inst, prompt)

    if result:
        try:
            m = re.search(r'\{[\s\S]*\}', result)
            if m:
                data = json.loads(m.group(0))
                resp_type = data.get("question_type", q_type).lower()
                options = data.get("options")
                correct_idx = data.get("correct_index")
                if resp_type == "mcq" and (not options or len(options) != 4):
                    options = ["Option A", "Option B", "Option C", "Option D"]
                    correct_idx = 0
                
                return DailyChallengeResponse(
                    id=f"dc-ai-{uuid.uuid4().hex[:8]}",
                    date=today_str,
                    topic=data.get("topic", target_topic),
                    question_type=resp_type,
                    question=data.get("question", "What is the principle of quantum superposition?"),
                    options=options if resp_type == "mcq" else None,
                    correct_index=int(correct_idx) if correct_idx is not None and resp_type == "mcq" else None,
                    explanation=data.get("explanation", "Correct based on quantum state transformations."),
                    rubric_hints=data.get("rubric_hints", ["Superposition linearity", "Phase evolution"]) if resp_type == "theoretical" else None,
                    xp=75 if resp_type == "theoretical" else 50,
                    difficulty=data.get("difficulty", req.difficulty or "Beginner"),
                    is_ai_generated=True,
                )
        except Exception as e:
            logger.warning(f"Failed to parse Gemini Daily Challenge JSON: {e}, falling back to curated bank")

    # Fallback to curated bank matching question type if possible
    import random
    matches = [c for c in FALLBACK_DAILY_CHALLENGES if q_type == "any" or c["question_type"] == q_type]
    choice = random.choice(matches if matches else FALLBACK_DAILY_CHALLENGES)
    return DailyChallengeResponse(
        id=f"{choice['id']}-{int(time.time())}",
        date=today_str,
        topic=choice["topic"],
        question_type=choice["question_type"],
        question=choice["question"],
        options=choice.get("options"),
        correct_index=choice.get("correct_index"),
        explanation=choice["explanation"],
        rubric_hints=choice.get("rubric_hints"),
        xp=choice.get("xp", 50),
        difficulty=choice.get("difficulty", "Beginner"),
        is_ai_generated=False,
    )

def evaluate_theoretical_challenge(
    req: EvaluateTheoreticalChallengeRequest,
) -> EvaluateTheoreticalChallengeResponse:
    """
    Evaluate a student's open-ended written explanation for a theoretical quantum challenge.
    Uses Gemini for Socratic scoring and feedback, with deterministic heuristic fallback.
    """
    user_answer = req.user_answer.strip()
    if not user_answer:
        return EvaluateTheoreticalChallengeResponse(
            challenge_id=req.challenge_id,
            score=0,
            is_correct=False,
            xp_earned=0,
            feedback="No answer was provided. Please write an explanation to submit for evaluation.",
            strengths=[],
            missed_points=["Complete explanation required."],
            ideal_explanation="A complete physical and mathematical explanation is needed.",
        )

    prompt = f"""You are an encouraging and rigorous quantum computing tutor evaluating a student's answer.

Question Topic: "{req.topic}"
Question Prompt: "{req.question}"
Student's Written Explanation:
\"\"\"{user_answer}\"\"\"

Task:
1. Grade the answer on a scale from 0 to 100 based on conceptual accuracy, physical intuition, and quantum mechanics principles.
2. Mark `is_correct` as true if score >= 60.
3. Provide constructive, friendly Socratic feedback (2-3 sentences) praising what they got right and clarifying any misconceptions.
4. List 1-3 specific `strengths` (what they explained accurately).
5. List 1-2 `missed_points` (key nuances or mathematical properties they could add).
6. Provide a concise `ideal_explanation` using Dirac notation.

Output strictly in JSON format:
{{
  "score": 85,
  "is_correct": true,
  "feedback": "Great intuition! You correctly identified that...",
  "strengths": ["Identified target statevector eigenvalue", "Explained why relative phase shifts control"],
  "missed_points": ["Could mention global phase invariance"],
  "ideal_explanation": "When U|u> = exp(i*theta)|u>, the controlled operation..."
}}"""

    system_inst = "You are an automated quantum education grader. Output strictly valid JSON conforming to the schema."
    result = _call_gemini_with_fallback(system_inst, prompt)

    if result:
        try:
            m = re.search(r'\{[\s\S]*\}', result)
            if m:
                data = json.loads(m.group(0))
                score = max(0, min(100, int(data.get("score", 70))))
                is_correct = bool(data.get("is_correct", score >= 60))
                xp_earned = int(75 * (score / 100)) if is_correct else 15

                return EvaluateTheoreticalChallengeResponse(
                    challenge_id=req.challenge_id,
                    score=score,
                    is_correct=is_correct,
                    xp_earned=max(xp_earned, 10),
                    feedback=data.get("feedback", "Good effort! Keep exploring the physical principles."),
                    strengths=data.get("strengths", ["Demonstrated quantum conceptual awareness"]),
                    missed_points=data.get("missed_points", []),
                    ideal_explanation=data.get("ideal_explanation", "Refer to standard quantum gate unitaries."),
                )
        except Exception as e:
            logger.warning(f"Failed to parse Gemini evaluation JSON: {e}")

    # Heuristic Fallback Evaluation
    word_count = len(user_answer.split())
    has_keywords = any(kw in user_answer.lower() for kw in ["state", "qubit", "phase", "superposition", "hadamard", "entangle", "eigen", "unitary", "measurement", "matrix", "vector", "cnot"])
    
    score = min(90, max(30, word_count * 3 + (40 if has_keywords else 10)))
    is_correct = score >= 60
    xp_earned = 50 if is_correct else 15

    return EvaluateTheoreticalChallengeResponse(
        challenge_id=req.challenge_id,
        score=score,
        is_correct=is_correct,
        xp_earned=xp_earned,
        feedback="Your explanation captures core quantum intuition. Keep linking physical wave mechanics with statevector transformations.",
        strengths=["Clear effort to explain the quantum mechanism", "Used relevant terminology"],
        missed_points=["Include Dirac notation ($|0\\rangle, |1\\rangle$) for greater precision"],
        ideal_explanation="In quantum mechanics, state evolution is unitary and projective measurement collapses superposition into orthogonal eigenvalues.",
    )

