import pytest
import numpy as np
from backend.schemas import CircuitIR, GateIR
from backend.engine import (
    run_circuit,
    run_circuit_qiskit,
    run_circuit_pennylane,
    run_circuit_qsim,
    run_circuit_cirq,
    run_circuit_qbraid,
    get_available_backends
)
from backend.comparator import compare_circuits


def test_get_available_backends():
    backends = get_available_backends()
    ids = [b.id for b in backends]
    assert "qiskit_aer" in ids
    assert "pennylane" in ids
    assert "qsim" in ids
    assert "cirq" in ids
    assert "qbraid" in ids


@pytest.mark.parametrize("backend_id", ["qiskit_aer", "pennylane", "qsim", "cirq", "qbraid"])
def test_all_backends_bell_state(backend_id):
    circuit = CircuitIR(
        num_qubits=2,
        gates=[
            GateIR(name="h", qubits=[0]),
            GateIR(name="cx", qubits=[0, 1])
        ]
    )
    res = run_circuit(circuit, backend=backend_id, shots=1000, include_statevector=True)
    assert res.num_qubits == 2
    assert res.statevector is not None
    assert len(res.statevector) == 4

    # Check |00> and |11> probabilities around ~0.5
    assert pytest.approx(res.probabilities.get("00", 0.0), abs=1e-3) == 0.5
    assert pytest.approx(res.probabilities.get("11", 0.0), abs=1e-3) == 0.5
    assert pytest.approx(res.probabilities.get("01", 0.0), abs=1e-3) == 0.0
    assert pytest.approx(res.probabilities.get("10", 0.0), abs=1e-3) == 0.0

    # Check shot counts sum to 1000 and contain only '00' and '11'
    total_shots = sum(res.counts.values())
    assert total_shots == 1000
    assert "00" in res.counts
    assert "11" in res.counts


@pytest.mark.parametrize("backend_id", ["qiskit_aer", "pennylane", "qsim", "cirq", "qbraid"])
def test_all_backends_ghz_state(backend_id):
    circuit = CircuitIR(
        num_qubits=3,
        gates=[
            GateIR(name="h", qubits=[0]),
            GateIR(name="cx", qubits=[0, 1]),
            GateIR(name="cx", qubits=[1, 2]),
        ]
    )
    res = run_circuit(circuit, backend=backend_id, shots=1000, include_statevector=True)
    assert res.num_qubits == 3
    assert pytest.approx(res.probabilities.get("000", 0.0), abs=1e-3) == 0.5
    assert pytest.approx(res.probabilities.get("111", 0.0), abs=1e-3) == 0.5


def test_compare_all_four_backends():
    circuit = CircuitIR(
        num_qubits=2,
        gates=[
            GateIR(name="h", qubits=[0]),
            GateIR(name="rx", qubits=[1], params=[np.pi / 2]),
            GateIR(name="cx", qubits=[0, 1]),
        ]
    )
    comp = compare_circuits(
        circuit=circuit,
        tolerance=1e-4,
        shots=1024,
        backends=["qiskit_aer", "pennylane", "qsim", "cirq", "qbraid"]
    )
    assert comp.match is True
    assert comp.max_diff < 1e-4
    assert comp.fidelity >= 0.999
    assert len(comp.results) >= 4
