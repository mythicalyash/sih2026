import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.schemas import DailyChallengeRequest, EvaluateTheoreticalChallengeRequest
from backend.gemini_service import generate_daily_challenge, evaluate_theoretical_challenge

client = TestClient(app)

def test_generate_daily_challenge_mcq():
    req = DailyChallengeRequest(question_type="mcq", preferred_topic="Quantum Superposition")
    resp = generate_daily_challenge(req)
    assert resp.question_type == "mcq"
    assert resp.options is not None
    assert len(resp.options) == 4
    assert resp.correct_index is not None
    assert 0 <= resp.correct_index <= 3
    assert resp.explanation
    assert resp.xp == 50

def test_generate_daily_challenge_theoretical():
    req = DailyChallengeRequest(question_type="theoretical", preferred_topic="Phase Kickback")
    resp = generate_daily_challenge(req)
    assert resp.question_type == "theoretical"
    assert resp.question
    assert resp.explanation
    assert resp.xp == 75

def test_evaluate_theoretical_challenge():
    req = EvaluateTheoreticalChallengeRequest(
        challenge_id="test-ch-01",
        question="Explain how Hadamard creates equal superposition.",
        topic="Quantum Superposition",
        user_answer="Hadamard gate maps basis state |0> to (|0> + |1>)/sqrt(2) with equal probability amplitudes.",
    )
    resp = evaluate_theoretical_challenge(req)
    assert resp.score >= 50
    assert resp.is_correct is True
    assert resp.xp_earned > 0
    assert resp.feedback

def test_evaluate_theoretical_empty_answer():
    req = EvaluateTheoreticalChallengeRequest(
        challenge_id="test-ch-02",
        question="Explain entanglement.",
        topic="Entanglement",
        user_answer="",
    )
    resp = evaluate_theoretical_challenge(req)
    assert resp.score == 0
    assert resp.is_correct is False
    assert resp.xp_earned == 0

def test_api_daily_challenge_endpoints():
    # Test GET /api/daily-challenge/today
    res = client.get("/api/daily-challenge/today?question_type=mcq")
    assert res.status_code == 200
    data = res.json()
    assert "id" in data
    assert "topic" in data
    assert data["question_type"] == "mcq"
    assert len(data["options"]) == 4

    # Test POST /api/daily-challenge/generate
    gen_res = client.post("/api/daily-challenge/generate", json={"question_type": "theoretical", "preferred_topic": "Quantum Teleportation"})
    assert gen_res.status_code == 200
    gen_data = gen_res.json()
    assert gen_data["question_type"] == "theoretical"

    # Test POST /api/daily-challenge/evaluate
    eval_res = client.post("/api/daily-challenge/evaluate", json={
        "challenge_id": gen_data["id"],
        "question": gen_data["question"],
        "topic": gen_data["topic"],
        "user_answer": "Teleportation uses a Bell pair and 2 classical bits to transfer a quantum state.",
        "user_id": "arjun",
    })
    assert eval_res.status_code == 200
    eval_data = eval_res.json()
    assert "score" in eval_data
    assert "feedback" in eval_data
