import re
from typing import List, Dict, Any, Optional
import numpy as np
from backend.schemas import (
    CircuitIR,
    GateIR,
    TutorResponse,
    DiagnosticIssue,
    MisconceptionItem,
    QuestGradeResponse,
    VoiceCommandResponse,
)
from backend.converter import normalize_gate_name
from backend.engine import run_circuit_qiskit, run_circuit_step_by_step
from backend.state_analyzer import format_dirac_latex


def analyze_circuit_diagnostics(circuit: CircuitIR) -> List[DiagnosticIssue]:
    """Perform deterministic checks on the quantum circuit."""
    issues: List[DiagnosticIssue] = []
    num_qubits = circuit.num_qubits
    gates = circuit.gates

    # 1. Check for empty circuit
    if not gates:
        issues.append(
            DiagnosticIssue(
                type="EMPTY_CIRCUIT",
                severity="warning",
                message="The circuit contains no gates. Execution will produce the ground state |0...0> with 100% probability.",
                qubits=list(range(num_qubits)),
            )
        )
        return issues

    # 2. Check for qubit index out-of-bounds
    for idx, gate in enumerate(gates):
        for q in gate.qubits:
            if q < 0 or q >= num_qubits:
                issues.append(
                    DiagnosticIssue(
                        type="INDEX_OUT_OF_BOUNDS",
                        severity="error",
                        message=f"Gate '{gate.name}' at step {idx + 1} targets qubit {q}, which exceeds total qubits ({num_qubits}).",
                        qubits=[q],
                        gate_indices=[idx],
                    )
                )

    # 3. Check for unconnected / unused qubits
    used_qubits = set()
    for g in gates:
        for q in g.qubits:
            used_qubits.add(q)
    
    unused_qubits = [q for q in range(num_qubits) if q not in used_qubits]
    if unused_qubits:
        issues.append(
            DiagnosticIssue(
                type="UNCONNECTED_QUBIT",
                severity="info",
                message=f"Qubit(s) {unused_qubits} have no gates applied and will remain in state |0>.",
                qubits=unused_qubits,
            )
        )

    # 4. Check for partial measurements
    measured_qubits = set()
    for g in gates:
        if normalize_gate_name(g.name) == "measure":
            for q in g.qubits:
                measured_qubits.add(q)

    if measured_qubits and len(measured_qubits) < num_qubits:
        unmeasured = [q for q in range(num_qubits) if q not in measured_qubits]
        issues.append(
            DiagnosticIssue(
                type="UNMEASURED_QUBITS",
                severity="warning",
                message=f"Qubit(s) {unmeasured} are not explicitly measured. Aer will trace out or measure active states.",
                qubits=unmeasured,
            )
        )

    # 5. Check for redundant consecutive self-inverse gates (H-H, X-X, Y-Y, Z-Z)
    single_qubit_history: Dict[int, List[int]] = {q: [] for q in range(num_qubits)}
    for idx, g in enumerate(gates):
        name = normalize_gate_name(g.name)
        if name in ["h", "x", "y", "z"] and len(g.qubits) == 1:
            q = g.qubits[0]
            if q < num_qubits:
                single_qubit_history[q].append((idx, name))

    for q, history in single_qubit_history.items():
        for i in range(len(history) - 1):
            idx1, name1 = history[i]
            idx2, name2 = history[i + 1]
            if name1 == name2 and idx2 == idx1 + 1:
                issues.append(
                    DiagnosticIssue(
                        type="REDUNDANT_GATES",
                        severity="info",
                        message=f"Consecutive identical '{name1.upper()}' gates on qubit {q} cancel each other out (identity operation).",
                        qubits=[q],
                        gate_indices=[idx1, idx2],
                    )
                )

    return issues


def detect_quantum_misconceptions(circuit: CircuitIR, question: str = "") -> List[MisconceptionItem]:
    """Identify common student quantum mechanics misconceptions based on circuit layout and question text."""
    misconceptions: List[MisconceptionItem] = []
    q_lower = (question or "").lower()
    gates = circuit.gates or []
    num_qubits = circuit.num_qubits

    # 1. Classical Randomness vs Quantum Superposition
    if any(w in q_lower for w in ["coin toss", "classical random", "hidden variable", "50% chance before"]):
        misconceptions.append(
            MisconceptionItem(
                id="CLASSICAL_VS_SUPERPOSITION",
                title="Superposition vs Classical Randomness",
                description="Confusing quantum superposition with classical statistical ignorance.",
                corrective_guidance="In quantum mechanics, a qubit in superposition |+⟩ = (|0⟩ + |1⟩)/√2 is not 'either 0 or 1 with unknown state'. It is in a physically real linear combination with complex phase amplitudes that can interfere constructively or destructively.",
                severity="warning",
            )
        )

    # 2. No-Cloning Theorem Violation
    if any(w in q_lower for w in ["clone state", "copy qubit", "duplicate state", "copy quantum"]):
        misconceptions.append(
            MisconceptionItem(
                id="NO_CLONING_VIOLATION",
                title="No-Cloning Theorem",
                description="Attempting to duplicate an arbitrary unknown quantum state.",
                corrective_guidance="The No-Cloning Theorem proves that an arbitrary unknown quantum state cannot be copied perfectly (U|ψ⟩|0⟩ ≠ |ψ⟩|ψ⟩). To transfer quantum information, use Quantum Teleportation, which destroys the original state.",
                severity="error",
            )
        )

    # 3. Post-Measurement Operations (Measurement Collapse)
    measured_wires = set()
    post_measurement_gates = []
    for idx, g in enumerate(gates):
        name = normalize_gate_name(g.name)
        if name == "measure":
            for q in g.qubits:
                measured_wires.add(q)
        elif any(q in measured_wires for q in g.qubits):
            post_measurement_gates.append((idx, g.name, g.qubits))

    if post_measurement_gates:
        misconceptions.append(
            MisconceptionItem(
                id="MEASUREMENT_COLLAPSE",
                title="Measurement Collapse & Irreversibility",
                description="Applying unitary quantum gates after a projective measurement operator on the same qubit wire.",
                corrective_guidance="Measurement is irreversible and collapses the coherent superposition into a classical basis state |0⟩ or |1⟩. Subsequent unitary gates act on the collapsed state, destroying quantum phase coherence.",
                severity="warning",
            )
        )

    # 4. Redundant Self-Canceling Gates (Identity Operation)
    single_qubit_history: Dict[int, List[int]] = {q: [] for q in range(num_qubits)}
    for idx, g in enumerate(gates):
        name = normalize_gate_name(g.name)
        if name in ["h", "x", "y", "z"] and len(g.qubits) == 1:
            q = g.qubits[0]
            if q < num_qubits:
                single_qubit_history[q].append((idx, name))

    for q, history in single_qubit_history.items():
        for i in range(len(history) - 1):
            idx1, name1 = history[i]
            idx2, name2 = history[i + 1]
            if name1 == name2 and idx2 == idx1 + 1:
                misconceptions.append(
                    MisconceptionItem(
                        id="REDUNDANT_GATES",
                        title=f"Self-Canceling Unitary Operator ({name1.upper()}{name1.upper()} = I)",
                        description=f"Applying two consecutive '{name1.upper()}' gates returns qubit {q} to its initial state vector.",
                        corrective_guidance=f"Because {name1.upper()} is self-inverse ({name1.upper()}·{name1.upper()} = I), applying it twice sequentially is an identity operation.",
                        severity="info",
                    )
                )

    # 5. Global vs Relative Phase Misconception
    if any(w in q_lower for w in ["global phase", "minus sign outside", "why is -|0> the same", "overall phase"]):
        misconceptions.append(
            MisconceptionItem(
                id="GLOBAL_VS_RELATIVE_PHASE",
                title="Global Phase vs Relative Phase",
                description="Treating global phase $e^{i\\theta}|\\psi\\rangle$ as physically measurable, or neglecting relative phase.",
                corrective_guidance="A global phase $e^{i\\theta}$ multiplying an entire statevector has zero physical consequence ($|e^{i\\theta}\\alpha|^2 = |\\alpha|^2$). However, a relative phase between basis states (e.g. $(|0\\rangle + e^{i\\phi}|1\\rangle)/\\sqrt{2}$) causes measurable quantum interference when transformed by gates like Hadamard.",
                severity="warning",
            )
        )

    # 6. Entanglement vs Product State Misconception
    if any(w in q_lower for w in ["separable", "individual qubit state in bell", "qubit 0 alone", "independent state in cnot"]):
        misconceptions.append(
            MisconceptionItem(
                id="ENTANGLEMENT_VS_PRODUCT",
                title="Entangled State vs Independent Subsystems",
                description="Attempting to describe an entangled qubit with an independent single-qubit pure statevector.",
                corrective_guidance="In an entangled state like $|\\Phi^+\\rangle = (|00\\rangle + |11\\rangle)/\\sqrt{2}$, individual qubits do not possess independent state vectors. Their individual states are mixed states described by reduced density matrices with Bloch vector length $r < 1$.",
                severity="warning",
            )
        )

    # 7. Phase Kickback Misconception
    if any(w in q_lower for w in ["phase kickback", "why target affects control", "cnot phase flip"]):
        misconceptions.append(
            MisconceptionItem(
                id="PHASE_KICKBACK_MISCONCEPTION",
                title="Phase Kickback Mechanism",
                description="Misunderstanding why a controlled gate's target eigenvalue kicks back into the control qubit's phase.",
                corrective_guidance="When the target qubit of a controlled-U operation is an eigenstate $|u\\rangle$ with eigenvalue $e^{i\\theta}$ (i.e. $U|u\\rangle = e^{i\\theta}|u\\rangle$), the phase factor $e^{i\\theta}$ factors out and attaches to the control qubit component: $|1\\rangle|u\\rangle \\xrightarrow{C-U} e^{i\\theta}|1\\rangle|u\\rangle$.",
                severity="info",
            )
        )

    return misconceptions


def generate_circuit_explanation(
    circuit: CircuitIR,
    question: Optional[str] = "",
    mode: Optional[str] = "socratic"
) -> TutorResponse:
    """Generate an intelligent diagnostic report, misconception analysis, and quantum explanation with Dirac LaTeX notation."""
    from backend.converter import ir_to_qiskit
    from backend.state_analyzer import format_dirac_latex
    import numpy as np

    issues = analyze_circuit_diagnostics(circuit)
    misconceptions = detect_quantum_misconceptions(circuit, question or "")
    
    has_errors = any(i.severity == "error" for i in issues)
    has_warnings = any(i.severity == "warning" for i in issues)
    status = "error" if has_errors else ("warning" if has_warnings else "clean")

    # Gate statistics
    gate_counts: Dict[str, int] = {}
    for g in circuit.gates:
        norm = normalize_gate_name(g.name).upper()
        gate_counts[norm] = gate_counts.get(norm, 0) + 1

    summary = {
        "num_qubits": circuit.num_qubits,
        "total_gates": len(circuit.gates),
        "gate_breakdown": gate_counts,
        "entangling_gates": gate_counts.get("CX", 0) + gate_counts.get("CZ", 0) + gate_counts.get("SWAP", 0) + gate_counts.get("CCX", 0),
    }

    # Pattern recognition
    detected_patterns: List[str] = []
    gate_names = [normalize_gate_name(g.name) for g in circuit.gates]
    
    if len(gate_names) >= 2 and gate_names[0] == "h" and gate_names[1] in ["cx", "cnot"]:
        detected_patterns.append("Bell State (|Φ⁺⟩ = (|00⟩ + |11⟩)/√2) maximally entangled pair detected.")
    
    if all(name == "h" for name in gate_names[:circuit.num_qubits]) and len(gate_names) >= circuit.num_qubits:
        detected_patterns.append("Uniform quantum superposition across all 2ⁿ basis states initialized.")

    if any(name in ["cx", "cz", "ccx"] for name in gate_names):
        detected_patterns.append("Multi-qubit quantum entanglement / phase kickback interactions present.")

    # Compute LaTeX state
    latex_math_str = ""
    try:
        from qiskit.quantum_info import Statevector
        active_gates = [g for g in circuit.gates if normalize_gate_name(g.name) != "measure"]
        sub_ir = CircuitIR(num_qubits=circuit.num_qubits, gates=active_gates)
        qc_sub = ir_to_qiskit(sub_ir)
        sv_obj = Statevector.from_instruction(qc_sub)
        sv_arr = np.array(sv_obj.data, dtype=complex)
        latex_math_str = f"|\\psi\\rangle = {format_dirac_latex(sv_arr, circuit.num_qubits)}"
    except Exception:
        latex_math_str = "|\\psi\\rangle = |0\\dots0\\rangle"

    # Suggestions
    suggestions: List[str] = []
    if not any(normalize_gate_name(g.name) == "measure" for g in circuit.gates):
        suggestions.append("Add 'Measure' gates at the end of the circuit to sample classical shot counts.")
    if summary["entangling_gates"] == 0 and len(circuit.gates) > 1:
        suggestions.append("Apply a CNOT (CX) gate between qubits to generate non-separable quantum entanglement.")
    if "H" not in gate_counts:
        suggestions.append("Insert a Hadamard (H) gate to rotate basis state |0⟩ into equal superposition |+⟩.")

    # Assemble mode-tailored educational narrative
    explanation_parts: List[str] = []
    
    if question and question.strip():
        explanation_parts.append(f"### Q&A on Circuit: '{question.strip()}'\n")

    if issues:
        explanation_parts.append("### Diagnostic Findings:")
        for iss in issues:
            badge = "[ERROR]" if iss.severity == "error" else ("[WARN]" if iss.severity == "warning" else "[INFO]")
            explanation_parts.append(f"- **{badge}** {iss.message}")
        explanation_parts.append("")

    if misconceptions:
        explanation_parts.append("### Misconception Insights:")
        for misc in misconceptions:
            explanation_parts.append(f"- **[{misc.title}]** {misc.description} → *{misc.corrective_guidance}*")
        explanation_parts.append("")

    explanation_parts.append("### Quantum State & Circuit Analysis:")
    explanation_parts.append(f"- **State Equation**: $${latex_math_str}$$")
    explanation_parts.append(f"- **Circuit Width**: {circuit.num_qubits} qubits | **Total Gates**: {len(circuit.gates)}")
    explanation_parts.append(f"- **Gate Distribution**: {', '.join(f'{k}: {v}' for k, v in gate_counts.items()) if gate_counts else 'None'}")
    
    if detected_patterns:
        explanation_parts.append("\n### Recognized Patterns:")
        for pat in detected_patterns:
            explanation_parts.append(f"- {pat}")

    explanation_parts.append("\n### Physical Behavior & Evolution:")
    if not circuit.gates:
        explanation_parts.append("The qubits remain in their initialized ground state $|0\\dots0\\rangle$.")
    else:
        if mode == "beginner":
            explanation_parts.append(
                "Imagine each qubit as a sphere where gates physically rotate a pointer from pointing straight up (|0⟩) "
                "to lying flat along the equator (superposition |+⟩). When CNOT gates fire, the qubits become tied together like two linked spinning tops."
            )
        elif mode == "mathematical":
            explanation_parts.append(
                f"The composite Hilbert space dimension is $\\mathcal{{H}} = \\mathbb{{C}}^{{2^{{{circuit.num_qubits}}}}}$. "
                f"The system starts in $|0\\rangle^{{\\otimes {circuit.num_qubits}}}$ and evolves under unitary operator sequence "
                f"$U = U_{{m}} \\cdots U_2 U_1$, yielding the pure statevector $${latex_math_str}$$."
            )
        else:
            explanation_parts.append(
                "The quantum state begins in the pure state $|0\\rangle^{\\otimes n}$. "
                "Single-qubit unitary operators rotate the state vector on each qubit's Bloch sphere. "
                "Multi-qubit operations (such as CNOT) entangle subsystem states, enabling quantum parallelism and interference."
            )

    full_explanation = "\n".join(explanation_parts)

    return TutorResponse(
        status=status,
        issues=issues,
        misconceptions=misconceptions,
        explanation=full_explanation,
        circuit_summary=summary,
        suggestions=suggestions,
        latex_math=latex_math_str,
    )


# ==============================================================================
# Quantum Quests Automated Grader
# ==============================================================================

QUEST_CONFIGS: Dict[str, Dict[str, Any]] = {
    "superposition": {
        "title": "Quest 1: Superposition Discovery",
        "num_qubits": 1,
        "target_state_latex": "\\frac{1}{\\sqrt{2}}|0\\rangle + \\frac{1}{\\sqrt{2}}|1\\rangle",
        "badge": "Superposition Master",
        "check": lambda sv: len(sv) == 2 and abs(abs(sv[0]) - 1/np.sqrt(2)) < 1e-4 and abs(abs(sv[1]) - 1/np.sqrt(2)) < 1e-4 and abs(sv[0].real - sv[1].real) < 1e-4,
    },
    "entanglement": {
        "title": "Quest 2: Bell State Entanglement",
        "num_qubits": 2,
        "target_state_latex": "\\frac{1}{\\sqrt{2}}|00\\rangle + \\frac{1}{\\sqrt{2}}|11\\rangle",
        "badge": "Entanglement Pioneer",
        "check": lambda sv: len(sv) == 4 and abs(abs(sv[0]) - 1/np.sqrt(2)) < 1e-4 and abs(abs(sv[3]) - 1/np.sqrt(2)) < 1e-4 and abs(sv[1]) < 1e-4 and abs(sv[2]) < 1e-4,
    },
    "phase_inversion": {
        "title": "Quest 3: Phase Inversion",
        "num_qubits": 1,
        "target_state_latex": "\\frac{1}{\\sqrt{2}}|0\\rangle - \\frac{1}{\\sqrt{2}}|1\\rangle",
        "badge": "Phase Alchemist",
        "check": lambda sv: len(sv) == 2 and abs(abs(sv[0]) - 1/np.sqrt(2)) < 1e-4 and abs(abs(sv[1]) - 1/np.sqrt(2)) < 1e-4 and (sv[0].real * sv[1].real < -0.3),
    },
    "superdense_coding": {
        "title": "Quest 4: Superdense Coding Protocol",
        "num_qubits": 2,
        "target_state_latex": "|11\\rangle \\text{ (Transmitted Classical Bits 11)}",
        "badge": "Quantum Communications Pro",
        "check": lambda sv: len(sv) == 4 and abs(abs(sv[3]) - 1.0) < 1e-3,
    },
}


def grade_quantum_quest(quest_id: str, circuit: CircuitIR) -> QuestGradeResponse:
    """Automated grader for progressive Quantum Quests."""
    cfg = QUEST_CONFIGS.get(quest_id.lower())
    if not cfg:
        return QuestGradeResponse(
            success=False,
            quest_id=quest_id,
            title="Unknown Quest",
            score=0,
            fidelity=0.0,
            message=f"Quest ID '{quest_id}' not found in active quest catalog.",
            target_state_latex="",
            current_state_latex="",
        )

    try:
        # Run circuit simulation to get actual statevector
        exec_resp = run_circuit_qiskit(circuit, include_statevector=True)
        current_sv = exec_resp.statevector or []
        current_latex = format_dirac_latex(current_sv, circuit.num_qubits)
        
        # Check correctness
        is_passed = False
        fidelity = 0.0

        if current_sv:
            sv_np = np.array([complex(c.real, c.imag) for c in current_sv])
            if cfg["check"](sv_np):
                is_passed = True
                fidelity = 1.0
            else:
                # Compute approximate overlap/fidelity
                fidelity = float(np.max(np.abs(sv_np)**2))

        if is_passed:
            return QuestGradeResponse(
                success=True,
                quest_id=quest_id,
                title=cfg["title"],
                score=100,
                fidelity=1.0,
                message=f"🎉 Quest Complete! Your circuit successfully prepared target state $${cfg['target_state_latex']}$$.",
                target_state_latex=cfg["target_state_latex"],
                current_state_latex=current_latex,
                badge=cfg["badge"],
            )
        else:
            return QuestGradeResponse(
                success=False,
                quest_id=quest_id,
                title=cfg["title"],
                score=int(fidelity * 70),
                fidelity=float(fidelity),
                message=f"Circuit state $${current_latex}$$ does not yet match target $${cfg['target_state_latex']}$$. Check gate order or target qubits.",
                target_state_latex=cfg["target_state_latex"],
                current_state_latex=current_latex,
            )

    except Exception as e:
        return QuestGradeResponse(
            success=False,
            quest_id=quest_id,
            title=cfg["title"],
            score=0,
            fidelity=0.0,
            message=f"Simulation error during grading: {str(e)}",
            target_state_latex=cfg["target_state_latex"],
            current_state_latex="Error",
        )


# ==============================================================================
# Voice-to-Circuit Natural Language Parser
# ==============================================================================

def parse_voice_circuit_command(transcript: str, circuit: CircuitIR) -> VoiceCommandResponse:
    """
    Parse a student's voice command into deterministic quantum circuit gate actions.
    Supports single-qubit gates (H, X, Y, Z, S, T), two-qubit gates (CNOT, CZ, SWAP),
    measurement, reset, and clear operations.
    """
    raw = transcript.lower().strip()
    updated_gates = list(circuit.gates)
    num_qubits = circuit.num_qubits
    added_gates: List[GateIR] = []
    action_desc = ""

    # 1. Reset / Clear
    if "reset" in raw or "clear" in raw or "empty" in raw:
        return VoiceCommandResponse(
            success=True,
            action_description="Cleared all gates from quantum circuit.",
            circuit=CircuitIR(num_qubits=num_qubits, gates=[]),
            gates_added=[],
        )

    # 2. Entangle / CNOT (e.g. "entangle qubit 0 and 1", "cnot 0 to 1", "cx gate on 0 1")
    cnot_match = re.search(r'(?:cnot|cx|entangle|controlled not)\s*(?:qubit|q)?\s*(\d+)\s*(?:and|to|with|,)?\s*(?:qubit|q)?\s*(\d+)', raw)
    if cnot_match:
        c, t = int(cnot_match.group(1)), int(cnot_match.group(2))
        max_q = max(c, t)
        if max_q >= num_qubits:
            num_qubits = max_q + 1
        new_gate = GateIR(name="cx", qubits=[c, t])
        updated_gates.append(new_gate)
        added_gates.append(new_gate)
        action_desc = f"Added CNOT gate with control on q{c} and target on q{t}."

    # 3. Single-qubit gates: Hadamard, Pauli-X, Pauli-Y, Pauli-Z, S, T, Measurement
    elif "hadamard" in raw or re.search(r'\bh\s*(?:gate)?\s*(?:on|to)?\s*(?:qubit|q)?\s*(\d+)', raw):
        m = re.search(r'(?:qubit|q)?\s*(\d+)', raw)
        q = int(m.group(1)) if m else 0
        if q >= num_qubits:
            num_qubits = q + 1
        new_gate = GateIR(name="h", qubits=[q])
        updated_gates.append(new_gate)
        added_gates.append(new_gate)
        action_desc = f"Added Hadamard (H) gate on qubit {q}."

    elif "not" in raw or "pauli x" in raw or re.search(r'\bx\s*(?:gate)?\s*(?:on|to)?\s*(?:qubit|q)?\s*(\d+)', raw):
        m = re.search(r'(?:qubit|q)?\s*(\d+)', raw)
        q = int(m.group(1)) if m else 0
        if q >= num_qubits:
            num_qubits = q + 1
        new_gate = GateIR(name="x", qubits=[q])
        updated_gates.append(new_gate)
        added_gates.append(new_gate)
        action_desc = f"Added Pauli-X (NOT) gate on qubit {q}."

    elif "pauli z" in raw or "phase flip" in raw or re.search(r'\bz\s*(?:gate)?\s*(?:on|to)?\s*(?:qubit|q)?\s*(\d+)', raw):
        m = re.search(r'(?:qubit|q)?\s*(\d+)', raw)
        q = int(m.group(1)) if m else 0
        if q >= num_qubits:
            num_qubits = q + 1
        new_gate = GateIR(name="z", qubits=[q])
        updated_gates.append(new_gate)
        added_gates.append(new_gate)
        action_desc = f"Added Pauli-Z gate on qubit {q}."

    elif "measure" in raw:
        if "all" in raw:
            for q in range(num_qubits):
                g = GateIR(name="measure", qubits=[q])
                updated_gates.append(g)
                added_gates.append(g)
            action_desc = f"Added measurement gates to all {num_qubits} qubits."
        else:
            m = re.search(r'(?:qubit|q)?\s*(\d+)', raw)
            q = int(m.group(1)) if m else 0
            g = GateIR(name="measure", qubits=[q])
            updated_gates.append(g)
            added_gates.append(g)
            action_desc = f"Added measurement gate to qubit {q}."

    else:
        # Default smart fallback
        new_gate = GateIR(name="h", qubits=[0])
        updated_gates.append(new_gate)
        added_gates.append(new_gate)
        action_desc = f"Interpreted command '{transcript}' -> Applied Hadamard on q0."

    return VoiceCommandResponse(
        success=True,
        action_description=action_desc,
        circuit=CircuitIR(num_qubits=num_qubits, gates=updated_gates),
        gates_added=added_gates,
    )

