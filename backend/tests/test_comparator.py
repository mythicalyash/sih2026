import pytest
from backend.schemas import CircuitIR, GateIR
from backend.comparator import compare_circuits

def test_compare_bell_state():
    ir = CircuitIR(
        num_qubits=2,
        gates=[
            GateIR(name="h", qubits=[0]),
            GateIR(name="cx", qubits=[0, 1]),
        ]
    )
    comp = compare_circuits(ir, tolerance=1e-4, shots=1000)
    assert comp.match is True
    assert comp.max_diff < 1e-4
    assert comp.fidelity >= 0.999

def test_compare_rotations():
    ir = CircuitIR(
        num_qubits=2,
        gates=[
            GateIR(name="rx", qubits=[0], params=[1.2]),
            GateIR(name="ry", qubits=[1], params=[0.8]),
            GateIR(name="cz", qubits=[0, 1]),
        ]
    )
    comp = compare_circuits(ir, tolerance=1e-4, shots=1000)
    assert comp.match is True
    assert comp.max_diff < 1e-4
    assert comp.fidelity >= 0.999

def test_compare_ghz_state():
    ir = CircuitIR(
        num_qubits=3,
        gates=[
            GateIR(name="h", qubits=[0]),
            GateIR(name="cx", qubits=[0, 1]),
            GateIR(name="cx", qubits=[1, 2]),
        ]
    )
    comp = compare_circuits(ir, tolerance=1e-4, shots=1000)
    assert comp.match is True
    assert comp.max_diff < 1e-4
    assert comp.fidelity >= 0.999
