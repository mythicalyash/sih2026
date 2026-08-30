import pytest
import math
import numpy as np

from backend.algorithms import (
    build_deutsch_jozsa,
    build_bernstein_vazirani,
    build_grovers_search,
    build_qft,
    build_quantum_teleportation,
    build_superdense_coding,
)
from backend.engine import run_circuit_qiskit
from backend.state_analyzer import compute_bloch_vectors

def test_deutsch_jozsa_constant():
    # Constant oracle: input qubits must measure to all zeros |00>
    ir = build_deutsch_jozsa(oracle_type="constant", num_input_qubits=2)
    res = run_circuit_qiskit(ir, shots=1000)
    
    # Input qubits are q0, q1. The ancilla q2 is in |->
    # Basis strings are |q2 q1 q0>. For constant oracle, q1 q0 must be 00.
    zero_outcomes = [k for k in res.probabilities if k[1:] == "00"]
    total_zero_prob = sum(res.probabilities[k] for k in zero_outcomes)
    assert math.isclose(total_zero_prob, 1.0, abs_tol=1e-4)

def test_deutsch_jozsa_balanced():
    # Balanced oracle: input qubits q1 q0 must NOT measure to |00>
    ir = build_deutsch_jozsa(oracle_type="balanced", num_input_qubits=2)
    res = run_circuit_qiskit(ir, shots=1000)
    
    zero_outcomes = [k for k in res.probabilities if k[1:] == "00"]
    total_zero_prob = sum(res.probabilities[k] for k in zero_outcomes)
    assert math.isclose(total_zero_prob, 0.0, abs_tol=1e-4)

def test_bernstein_vazirani_101():
    secret = "101"
    ir = build_bernstein_vazirani(secret)
    res = run_circuit_qiskit(ir, shots=1000)
    
    # In n+1 qubits, input qubits q2 q1 q0 contain the secret bitstring
    # The ancilla is q3 (MSB in |q3 q2 q1 q0>)
    matching_outcomes = [k for k in res.probabilities if k[1:] == secret]
    total_secret_prob = sum(res.probabilities[k] for k in matching_outcomes)
    assert math.isclose(total_secret_prob, 1.0, abs_tol=1e-4)

def test_bernstein_vazirani_1100():
    secret = "1100"
    ir = build_bernstein_vazirani(secret)
    res = run_circuit_qiskit(ir, shots=1000)
    
    matching_outcomes = [k for k in res.probabilities if k[1:] == secret]
    total_secret_prob = sum(res.probabilities[k] for k in matching_outcomes)
    assert math.isclose(total_secret_prob, 1.0, abs_tol=1e-4)

def test_grovers_search_2qubit():
    target = "11"
    ir = build_grovers_search(target)
    res = run_circuit_qiskit(ir, shots=1000)
    
    # 2-qubit Grover with 1 iteration finds target with 100% probability
    assert math.isclose(res.probabilities[target], 1.0, abs_tol=1e-4)

def test_grovers_search_01():
    target = "01"
    ir = build_grovers_search(target)
    res = run_circuit_qiskit(ir, shots=1000)
    assert math.isclose(res.probabilities[target], 1.0, abs_tol=1e-4)

def test_qft_equal_superposition():
    # QFT on |000> produces equal superposition across all 8 basis states
    ir = build_qft(num_qubits=3, input_state="000")
    res = run_circuit_qiskit(ir, include_statevector=True)
    
    for state, prob in res.probabilities.items():
        assert math.isclose(prob, 1.0 / 8.0, abs_tol=1e-4)

def test_quantum_teleportation_fidelity():
    # Teleport state with theta=1.2, phi=0.5
    theta = 1.2
    phi = 0.5
    ir = build_quantum_teleportation(theta=theta, phi=phi)
    res = run_circuit_qiskit(ir, include_statevector=True)
    
    # Analytical target state on a single qubit:
    # |psi> = cos(theta/2)|0> + e^{i*phi} sin(theta/2)|1>
    alpha = math.cos(theta / 2.0)
    beta = complex(math.cos(phi), math.sin(phi)) * math.sin(theta / 2.0)
    
    target_bloch_x = 2.0 * float(np.real(np.conj(alpha) * beta))
    target_bloch_y = 2.0 * float(np.imag(np.conj(alpha) * beta))
    target_bloch_z = float(abs(alpha)**2 - abs(beta)**2)

    sv_array = [complex(item.real, item.imag) for item in res.statevector]
    bloch_vecs = compute_bloch_vectors(sv_array, num_qubits=3)
    
    bob_bloch = bloch_vecs[2]  # qubit 2 is Bob's qubit
    
    # Assert Bob's Bloch vector matches the input state's Bloch vector
    assert math.isclose(bob_bloch.x, target_bloch_x, abs_tol=1e-3)
    assert math.isclose(bob_bloch.y, target_bloch_y, abs_tol=1e-3)
    assert math.isclose(bob_bloch.z, target_bloch_z, abs_tol=1e-3)

@pytest.mark.parametrize("message", ["00", "01", "10", "11"])
def test_superdense_coding_all_messages(message):
    ir = build_superdense_coding(message)
    res = run_circuit_qiskit(ir, shots=1000)
    # Alice sends 2 classical bits, Bob reconstructs exact message
    assert math.isclose(res.probabilities[message], 1.0, abs_tol=1e-4)
