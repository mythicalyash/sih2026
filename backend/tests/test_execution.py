import pytest
import math
from backend.schemas import CircuitIR, GateIR
from backend.engine import run_circuit_qiskit

def test_execution_ground_state():
    ir = CircuitIR(num_qubits=2, gates=[])
    res = run_circuit_qiskit(ir, shots=500, include_statevector=True)
    assert res.num_qubits == 2
    assert res.probabilities["00"] == 1.0
    assert res.probabilities["01"] == 0.0
    assert res.probabilities["10"] == 0.0
    assert res.probabilities["11"] == 0.0

def test_execution_x_gate():
    # X on qubit 0 in 2-qubit system -> state |01> (since q0 is LSB)
    ir = CircuitIR(num_qubits=2, gates=[GateIR(name="x", qubits=[0])])
    res = run_circuit_qiskit(ir, shots=500, include_statevector=True)
    assert res.probabilities["01"] == 1.0
    assert res.probabilities["00"] == 0.0

def test_execution_hadamard_superposition():
    ir = CircuitIR(num_qubits=1, gates=[GateIR(name="h", qubits=[0])])
    res = run_circuit_qiskit(ir, shots=1000, include_statevector=True)
    assert math.isclose(res.probabilities["0"], 0.5, abs_tol=1e-4)
    assert math.isclose(res.probabilities["1"], 0.5, abs_tol=1e-4)
    assert res.counts["0"] + res.counts["1"] == 1000

def test_execution_bell_state():
    # H on q0, CX from q0 to q1 -> (|00> + |11>) / sqrt(2)
    ir = CircuitIR(
        num_qubits=2,
        gates=[
            GateIR(name="h", qubits=[0]),
            GateIR(name="cx", qubits=[0, 1]),
        ]
    )
    res = run_circuit_qiskit(ir, shots=1000, include_statevector=True)
    assert math.isclose(res.probabilities["00"], 0.5, abs_tol=1e-4)
    assert math.isclose(res.probabilities["11"], 0.5, abs_tol=1e-4)
    assert res.probabilities["01"] == 0.0
    assert res.probabilities["10"] == 0.0
    assert "00" in res.counts
    assert "11" in res.counts
