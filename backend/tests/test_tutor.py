import pytest
from backend.schemas import CircuitIR, GateIR
from backend.tutor import analyze_circuit_diagnostics, generate_circuit_explanation

def test_tutor_empty_circuit():
    circuit = CircuitIR(num_qubits=2, gates=[])
    issues = analyze_circuit_diagnostics(circuit)
    assert any(i.type == "EMPTY_CIRCUIT" for i in issues)

def test_tutor_index_out_of_bounds():
    circuit = CircuitIR(
        num_qubits=2,
        gates=[GateIR(name="h", qubits=[3])]
    )
    issues = analyze_circuit_diagnostics(circuit)
    assert any(i.type == "INDEX_OUT_OF_BOUNDS" for i in issues)

def test_tutor_unconnected_qubit():
    circuit = CircuitIR(
        num_qubits=3,
        gates=[GateIR(name="x", qubits=[0])]
    )
    issues = analyze_circuit_diagnostics(circuit)
    assert any(i.type == "UNCONNECTED_QUBIT" for i in issues)

def test_tutor_redundant_gates():
    circuit = CircuitIR(
        num_qubits=2,
        gates=[
            GateIR(name="h", qubits=[0]),
            GateIR(name="h", qubits=[0]),
        ]
    )
    issues = analyze_circuit_diagnostics(circuit)
    assert any(i.type == "REDUNDANT_GATES" for i in issues)

def test_tutor_explanation_generation():
    circuit = CircuitIR(
        num_qubits=2,
        gates=[
            GateIR(name="h", qubits=[0]),
            GateIR(name="cx", qubits=[0, 1]),
        ]
    )
    resp = generate_circuit_explanation(circuit, "What state does this create?", mode="mathematical")
    assert resp.status == "clean"
    assert "Bell State" in resp.explanation
    assert resp.circuit_summary["num_qubits"] == 2
    assert resp.latex_math is not None
    assert "\\Phi^+" in resp.latex_math or "\\frac{1}{\\sqrt{2}}" in resp.latex_math

def test_tutor_misconception_detection():
    from backend.tutor import detect_quantum_misconceptions

    circuit = CircuitIR(num_qubits=2, gates=[GateIR(name="h", qubits=[0])])
    
    # 1. Superposition vs coin toss
    misc1 = detect_quantum_misconceptions(circuit, "Isn't a qubit just like a coin toss before looking?")
    assert any(m.id == "CLASSICAL_VS_SUPERPOSITION" for m in misc1)

    # 2. No cloning theorem
    misc2 = detect_quantum_misconceptions(circuit, "Can I copy qubit 0 to qubit 1?")
    assert any(m.id == "NO_CLONING_VIOLATION" for m in misc2)

    # 3. Global phase
    misc3 = detect_quantum_misconceptions(circuit, "Does a global phase change the probabilities?")
    assert any(m.id == "GLOBAL_VS_RELATIVE_PHASE" for m in misc3)

    # 4. Entanglement vs product
    misc4 = detect_quantum_misconceptions(circuit, "What is qubit 0 alone in a bell state?")
    assert any(m.id == "ENTANGLEMENT_VS_PRODUCT" for m in misc4)

def test_step_by_step_evolution():
    from backend.engine import run_circuit_step_by_step
    
    circuit = CircuitIR(
        num_qubits=2,
        gates=[
            GateIR(name="h", qubits=[0]),
            GateIR(name="cx", qubits=[0, 1]),
        ]
    )
    resp = run_circuit_step_by_step(circuit)
    assert resp.num_qubits == 2
    assert resp.total_steps == 3
    assert resp.steps[0].gate_name == "init"
    assert resp.steps[1].gate_name == "h"
    assert resp.steps[2].gate_name == "cx"
    assert len(resp.steps[0].bloch_vectors) == 2
    assert resp.steps[1].bloch_vectors[0].x > 0.9  # H rotates |0> to equator (+X axis)

def test_quest_grading():
    from backend.tutor import grade_quantum_quest

    # Test Superposition Quest
    c1 = CircuitIR(num_qubits=1, gates=[GateIR(name="h", qubits=[0])])
    res1 = grade_quantum_quest("superposition", c1)
    assert res1.success is True
    assert res1.score == 100
    assert res1.badge == "Superposition Master"

    # Test Entanglement Quest
    c2 = CircuitIR(num_qubits=2, gates=[GateIR(name="h", qubits=[0]), GateIR(name="cx", qubits=[0, 1])])
    res2 = grade_quantum_quest("entanglement", c2)
    assert res2.success is True
    assert res2.score == 100
    assert res2.badge == "Entanglement Pioneer"

def test_voice_command_parsing():
    from backend.tutor import parse_voice_circuit_command

    c = CircuitIR(num_qubits=2, gates=[])
    
    # 1. Single qubit gate
    v1 = parse_voice_circuit_command("add hadamard on qubit 0", c)
    assert v1.success is True
    assert len(v1.circuit.gates) == 1
    assert v1.circuit.gates[0].name == "h"

    # 2. Two-qubit gate
    v2 = parse_voice_circuit_command("entangle qubit 0 and qubit 1", v1.circuit)
    assert v2.success is True
    assert len(v2.circuit.gates) == 2
    assert v2.circuit.gates[1].name == "cx"

    # 3. Clear circuit
    v3 = parse_voice_circuit_command("reset circuit", v2.circuit)
    assert v3.success is True
    assert len(v3.circuit.gates) == 0

