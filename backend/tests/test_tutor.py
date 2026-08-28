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
    resp = generate_circuit_explanation(circuit, "What state does this create?")
    assert resp.status == "clean"
    assert "Bell State" in resp.explanation
    assert resp.circuit_summary["num_qubits"] == 2
