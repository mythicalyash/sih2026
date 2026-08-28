from typing import List, Dict, Any, Optional
from backend.schemas import CircuitIR, TutorResponse, DiagnosticIssue
from backend.converter import normalize_gate_name


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


def generate_circuit_explanation(circuit: CircuitIR, question: Optional[str] = "") -> TutorResponse:
    """Generate an intelligent diagnostic report and quantum explanation for the circuit."""
    issues = analyze_circuit_diagnostics(circuit)
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
        detected_patterns.append("Bell State (|Φ⁺⟩ = (|00⟩ + |11⟩)/√2) preparation detected.")
    
    if all(name == "h" for name in gate_names[:circuit.num_qubits]) and len(gate_names) >= circuit.num_qubits:
        detected_patterns.append("Uniform quantum superposition across all basis states initialized.")

    if any(name in ["cx", "cz", "ccx"] for name in gate_names):
        detected_patterns.append("Quantum entanglement / multi-qubit phase kickback interactions present.")

    # Suggestions
    suggestions: List[str] = []
    if not any(normalize_gate_name(g.name) == "measure" for g in circuit.gates):
        suggestions.append("Add 'Measure' gates at the end of the circuit to collect classical shot counts.")
    if summary["entangling_gates"] == 0 and len(circuit.gates) > 1:
        suggestions.append("Try adding a CNOT (CX) gate between qubits to generate quantum entanglement.")
    if "H" not in gate_counts:
        suggestions.append("Add a Hadamard (H) gate to create quantum superposition states.")

    # Assemble comprehensive educational narrative
    explanation_parts: List[str] = []
    
    if question and question.strip():
        explanation_parts.append(f"### Q&A on Circuit: '{question.strip()}'\n")

    if issues:
        explanation_parts.append("### Diagnostic Findings:")
        for iss in issues:
            badge = "[ERROR]" if iss.severity == "error" else ("[WARN]" if iss.severity == "warning" else "[INFO]")
            explanation_parts.append(f"- **{badge}** {iss.message}")
        explanation_parts.append("")

    explanation_parts.append("### Quantum Circuit Analysis:")
    explanation_parts.append(f"- **Circuit Width**: {circuit.num_qubits} qubits | **Total Gates**: {len(circuit.gates)}")
    explanation_parts.append(f"- **Gate Distribution**: {', '.join(f'{k}: {v}' for k, v in gate_counts.items()) if gate_counts else 'None'}")
    
    if detected_patterns:
        explanation_parts.append("\n### Recognized Patterns:")
        for pat in detected_patterns:
            explanation_parts.append(f"- {pat}")

    explanation_parts.append("\n### Physical Behavior & Evolution:")
    if not circuit.gates:
        explanation_parts.append("The qubits remain in their initialized ground state |0...0>.")
    else:
        explanation_parts.append(
            "The quantum state begins in the pure state |0⟩^{\\otimes n}. "
            "Single-qubit unitary operators rotate the state vector on each qubit's Bloch sphere. "
            "Multi-qubit operations (such as CNOT) entangle the subsystem states, enabling quantum parallelism and interference."
        )

    full_explanation = "\n".join(explanation_parts)

    return TutorResponse(
        status=status,
        issues=issues,
        explanation=full_explanation,
        circuit_summary=summary,
        suggestions=suggestions,
    )
