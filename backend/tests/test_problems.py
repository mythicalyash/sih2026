import pytest
from backend.schemas import CircuitIR, GateIR
from backend.problems import (
    PROBLEMS_REGISTRY,
    check_problem_solution,
    generate_problem_hint,
    review_problem_circuit,
)


def test_problem_registry_complete():
    assert len(PROBLEMS_REGISTRY) == 6
    expected_ids = ["superposition", "flip_qubit", "bell_state", "ghz_state", "quantum_coin", "break_entanglement"]
    for pid in expected_ids:
        assert pid in PROBLEMS_REGISTRY
        assert "title" in PROBLEMS_REGISTRY[pid]
        assert "hints" in PROBLEMS_REGISTRY[pid]
        assert len(PROBLEMS_REGISTRY[pid]["hints"]) >= 3


def test_superposition_problem():
    # Wrong: empty circuit
    ir_empty = CircuitIR(num_qubits=1, gates=[])
    passed, feedback, _, _ = check_problem_solution("superposition", ir_empty)
    assert not passed

    # Correct: H gate on q0
    ir_valid = CircuitIR(num_qubits=1, gates=[GateIR(name="h", qubits=[0])])
    passed, feedback, ai_exp, _ = check_problem_solution("superposition", ir_valid)
    assert passed
    assert "superposition" in feedback.lower() or "success" in feedback.lower()


def test_flip_qubit_problem():
    # Correct: X gate on q0
    ir_valid = CircuitIR(num_qubits=1, gates=[GateIR(name="x", qubits=[0])])
    passed, _, _, _ = check_problem_solution("flip_qubit", ir_valid)
    assert passed

    # Wrong: H gate on q0 (gives 50/50, not |1>)
    ir_wrong = CircuitIR(num_qubits=1, gates=[GateIR(name="h", qubits=[0])])
    passed, _, _, _ = check_problem_solution("flip_qubit", ir_wrong)
    assert not passed


def test_bell_state_problem():
    # Correct: H on q0, CX on q0->q1
    ir_bell = CircuitIR(
        num_qubits=2,
        gates=[
            GateIR(name="h", qubits=[0]),
            GateIR(name="cx", qubits=[0, 1])
        ]
    )
    passed, feedback, ai_exp, metrics = check_problem_solution("bell_state", ir_bell)
    assert passed
    assert "bell state" in feedback.lower() or "bell" in ai_exp.lower()

    # Wrong: only H on q0 without CX
    ir_half = CircuitIR(num_qubits=2, gates=[GateIR(name="h", qubits=[0])])
    passed, feedback, _, _ = check_problem_solution("bell_state", ir_half)
    assert not passed


def test_ghz_state_problem():
    ir_ghz = CircuitIR(
        num_qubits=3,
        gates=[
            GateIR(name="h", qubits=[0]),
            GateIR(name="cx", qubits=[0, 1]),
            GateIR(name="cx", qubits=[1, 2]),
        ]
    )
    passed, _, _, _ = check_problem_solution("ghz_state", ir_ghz)
    assert passed


def test_quantum_coin_problem():
    # Correct: H on q0 with explicit measurement
    ir_coin = CircuitIR(
        num_qubits=1,
        gates=[
            GateIR(name="h", qubits=[0]),
            GateIR(name="measure", qubits=[0]),
        ]
    )
    passed, _, _, _ = check_problem_solution("quantum_coin", ir_coin)
    assert passed


def test_progressive_hints():
    h1 = generate_problem_hint("bell_state", CircuitIR(num_qubits=2, gates=[]), hint_level=1)
    h2 = generate_problem_hint("bell_state", CircuitIR(num_qubits=2, gates=[]), hint_level=2)
    h3 = generate_problem_hint("bell_state", CircuitIR(num_qubits=2, gates=[]), hint_level=3)
    
    assert len(h1) > 0
    assert len(h2) > 0
    assert len(h3) > 0
    assert h1 != h2
    assert "CNOT" in h3 or "CX" in h3


def test_circuit_review():
    ir_bell = CircuitIR(
        num_qubits=2,
        gates=[
            GateIR(name="h", qubits=[0]),
            GateIR(name="cx", qubits=[0, 1])
        ]
    )
    status, positives, guidance = review_problem_circuit("bell_state", ir_bell)
    assert len(positives) >= 2
