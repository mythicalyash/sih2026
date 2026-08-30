import pytest
from backend.schemas import CircuitIR, GateIR
from backend.gemini_service import (
    is_gemini_active,
    set_gemini_api_key,
    get_api_key,
    generate_gemini_problem_hint,
    review_gemini_problem_circuit,
    explain_gemini_problem_concept,
    ask_gemini_socratic_tutor,
)

def test_gemini_status_and_key_setting():
    status = is_gemini_active()
    assert "active" in status
    assert "model" in status
    assert "gemini" in status["model"]

def test_gemini_fallback_when_no_key():
    circuit = CircuitIR(num_qubits=2, gates=[GateIR(name="h", qubits=[0])])
    
    # Test hint fallback
    hint = generate_gemini_problem_hint(
        problem_id="superposition",
        problem_title="Create a Superposition",
        problem_goal="Apply H gate",
        problem_concept="Superposition",
        circuit=circuit,
        hint_level=1,
        deterministic_fallback="Try placing a Hadamard gate on qubit 0.",
    )
    assert len(hint) > 5

    # Test review fallback
    status, positives, guidance = review_gemini_problem_circuit(
        problem_id="superposition",
        problem_title="Create a Superposition",
        problem_goal="Apply H gate",
        circuit=circuit,
        fallback_positives=["Hadamard gate placed"],
        fallback_guidance=["Now run the circuit"],
    )
    assert len(positives) > 0
    assert len(guidance) > 0

    # Test concept explanation fallback
    concept = explain_gemini_problem_concept(
        problem_id="superposition",
        problem_title="Create a Superposition",
        concept_name="Superposition",
        fallback_explanation="Superposition is a linear combination of |0> and |1>.",
    )
    assert len(concept) > 5

    # Test tutor question fallback
    answer = ask_gemini_socratic_tutor(
        circuit=circuit,
        question="Why did we use Hadamard?",
        fallback_response="Hadamard creates an equal superposition.",
    )
    assert len(answer) > 5
