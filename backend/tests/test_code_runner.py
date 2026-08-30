import pytest
from backend.schemas import CircuitIR, GateIR, CodeExecuteRequest
from backend.converter import ir_to_qiskit_code, ir_to_cirq_code, ir_to_pennylane_code
from backend.code_runner import execute_python_code

def test_code_generators():
    circuit = CircuitIR(
        num_qubits=2,
        gates=[
            GateIR(name="h", qubits=[0]),
            GateIR(name="cx", qubits=[0, 1])
        ]
    )
    qk_code = ir_to_qiskit_code(circuit)
    assert "from qiskit import QuantumCircuit" in qk_code
    assert "qc.h(0)" in qk_code
    assert "qc.cx(0, 1)" in qk_code

    cirq_code = ir_to_cirq_code(circuit)
    assert "import cirq" in cirq_code
    assert "cirq.H(qubits[0])" in cirq_code
    assert "cirq.CNOT(qubits[0], qubits[1])" in cirq_code

    pl_code = ir_to_pennylane_code(circuit)
    assert "import pennylane as qml" in pl_code
    assert "qml.Hadamard(wires=0)" in pl_code
    assert "qml.CNOT(wires=[0, 1])" in pl_code

def test_local_python_quantum_execution():
    circuit = CircuitIR(
        num_qubits=2,
        gates=[
            GateIR(name="h", qubits=[0]),
            GateIR(name="cx", qubits=[0, 1])
        ]
    )
    qk_code = ir_to_qiskit_code(circuit) + "\nprint(qc)"
    req = CodeExecuteRequest(source_code=qk_code)
    res = execute_python_code(req)
    assert res.status["id"] == 3
    assert res.status["description"] == "Success"
    assert res.stdout is not None
    assert "q_0" in res.stdout
    assert "q_1" in res.stdout
    assert res.stderr is None or res.stderr == ""

def test_code_execution_with_error():
    req = CodeExecuteRequest(source_code="1 / 0")
    res = execute_python_code(req)
    assert res.status["id"] == 11
    assert "ZeroDivisionError" in (res.stderr or "")
