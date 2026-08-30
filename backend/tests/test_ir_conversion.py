import pytest
from backend.schemas import CircuitIR, GateIR
from backend.converter import ir_to_qiskit, qiskit_to_ir, normalize_gate_name

def test_gate_aliases():
    assert normalize_gate_name("CNOT") == "cx"
    assert normalize_gate_name("Hadamard") == "h"
    assert normalize_gate_name("Toffoli") == "ccx"
    assert normalize_gate_name("phase") == "p"

def test_ir_to_qiskit_and_back_single_qubit():
    gates = [
        GateIR(name="h", qubits=[0]),
        GateIR(name="x", qubits=[1]),
        GateIR(name="y", qubits=[0]),
        GateIR(name="z", qubits=[1]),
        GateIR(name="s", qubits=[0]),
        GateIR(name="t", qubits=[1]),
        GateIR(name="rx", qubits=[0], params=[1.570796]),
        GateIR(name="ry", qubits=[1], params=[0.785398]),
        GateIR(name="rz", qubits=[0], params=[3.141592]),
    ]
    ir = CircuitIR(num_qubits=2, gates=gates)
    
    qc = ir_to_qiskit(ir)
    assert qc.num_qubits == 2

    ir_roundtrip = qiskit_to_ir(qc)
    assert ir_roundtrip.num_qubits == 2
    assert len(ir_roundtrip.gates) == len(gates)
    assert ir_roundtrip.gates[0].name == "h"
    assert ir_roundtrip.gates[0].qubits == [0]

def test_ir_to_qiskit_and_back_multi_qubit():
    gates = [
        GateIR(name="cx", qubits=[0, 1]),
        GateIR(name="cz", qubits=[1, 2]),
        GateIR(name="swap", qubits=[0, 2]),
        GateIR(name="ccx", qubits=[0, 1, 2]),
    ]
    ir = CircuitIR(num_qubits=3, gates=gates)
    
    qc = ir_to_qiskit(ir)
    assert qc.num_qubits == 3

    ir_roundtrip = qiskit_to_ir(qc)
    assert len(ir_roundtrip.gates) == 4
    assert ir_roundtrip.gates[0].name == "cx"
    assert ir_roundtrip.gates[0].qubits == [0, 1]
    assert ir_roundtrip.gates[3].name == "ccx"
    assert ir_roundtrip.gates[3].qubits == [0, 1, 2]

def test_ir_invalid_qubit_index():
    ir = CircuitIR(
        num_qubits=2,
        gates=[GateIR(name="h", qubits=[5])]
    )
    with pytest.raises(ValueError, match="invalid qubit index 5"):
        ir_to_qiskit(ir)

def test_ir_measurements():
    ir = CircuitIR(
        num_qubits=2,
        gates=[
            GateIR(name="h", qubits=[0]),
            GateIR(name="cx", qubits=[0, 1]),
            GateIR(name="measure", qubits=[0]),
            GateIR(name="measure", qubits=[1]),
        ]
    )
    qc = ir_to_qiskit(ir)
    assert qc.num_clbits == 2
