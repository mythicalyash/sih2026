import pytest
import math
import numpy as np
from backend.state_analyzer import (
    compute_bloch_vectors,
    statevector_to_amplitudes,
    statevector_to_probabilities,
)


def test_bloch_vector_ground_state():
    # |0> on single qubit -> Bloch vector (0, 0, 1)
    sv = np.array([1.0, 0.0], dtype=complex)
    vecs = compute_bloch_vectors(sv, num_qubits=1)
    assert len(vecs) == 1
    assert math.isclose(vecs[0].x, 0.0, abs_tol=1e-5)
    assert math.isclose(vecs[0].y, 0.0, abs_tol=1e-5)
    assert math.isclose(vecs[0].z, 1.0, abs_tol=1e-5)
    assert math.isclose(vecs[0].r, 1.0, abs_tol=1e-5)


def test_bloch_vector_excited_state():
    # |1> on single qubit -> Bloch vector (0, 0, -1)
    sv = np.array([0.0, 1.0], dtype=complex)
    vecs = compute_bloch_vectors(sv, num_qubits=1)
    assert math.isclose(vecs[0].x, 0.0, abs_tol=1e-5)
    assert math.isclose(vecs[0].y, 0.0, abs_tol=1e-5)
    assert math.isclose(vecs[0].z, -1.0, abs_tol=1e-5)


def test_bloch_vector_plus_state():
    # |+> = (|0> + |1>)/sqrt(2) -> Bloch vector (1, 0, 0)
    sv = np.array([1.0 / math.sqrt(2), 1.0 / math.sqrt(2)], dtype=complex)
    vecs = compute_bloch_vectors(sv, num_qubits=1)
    assert math.isclose(vecs[0].x, 1.0, abs_tol=1e-5)
    assert math.isclose(vecs[0].y, 0.0, abs_tol=1e-5)
    assert math.isclose(vecs[0].z, 0.0, abs_tol=1e-5)


def test_bloch_vector_maximally_entangled_bell_state():
    # Bell state (|00> + |11>)/sqrt(2) -> reduced density matrix for each qubit is I/2
    # Bloch vector has r = 0 (completely mixed subsystem)
    sv = np.array([1.0 / math.sqrt(2), 0.0, 0.0, 1.0 / math.sqrt(2)], dtype=complex)
    vecs = compute_bloch_vectors(sv, num_qubits=2)
    assert len(vecs) == 2
    for b in vecs:
        assert math.isclose(b.x, 0.0, abs_tol=1e-5)
        assert math.isclose(b.y, 0.0, abs_tol=1e-5)
        assert math.isclose(b.z, 0.0, abs_tol=1e-5)
        assert math.isclose(b.r, 0.0, abs_tol=1e-5)


def test_statevector_amplitudes():
    sv = np.array([0.5, 0.5, 0.5, 0.5], dtype=complex)
    amps = statevector_to_amplitudes(sv, num_qubits=2)
    assert len(amps) == 4
    for a in amps:
        assert math.isclose(a.magnitude, 0.5, abs_tol=1e-5)
