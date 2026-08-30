import math
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware

import logging

from backend.schemas import (
    GateIR,
    CircuitIR,
    ExecutionRequest,
    ExecutionResponse,
    ComparisonRequest,
    ComparisonResponse,
    BackendInfo,
    BackendsListResponse,
    BlochResponse,
    ProbabilitiesResponse,
    AmplitudesResponse,
    StepEvolutionItem,
    StepEvolutionResponse,
    TutorRequest,
    TutorResponse,
    TutorChatRequest,
    TutorChatResponse,
    QuizRequest,
    QuizResponse,
    CodeFixRequest,
    CodeFixResponse,
    PredictiveChallenge,
    SocraticStepItem,
    SocraticStepRequest,
    VoiceCommandRequest,
    VoiceCommandResponse,
    QuestGradeRequest,
    QuestGradeResponse,
    QuirkImportRequest,
    QuirkImportResponse,
    CodeExecuteRequest,
    CodeExecuteResponse,
    AlgorithmSummary,
    ProblemDefinition,
    ProblemHintRequest,
    ProblemHintResponse,
    ProblemReviewRequest,
    ProblemReviewResponse,
    ProblemExplainRequest,
    ProblemExplainResponse,
    ProblemCheckRequest,
    ProblemCheckResponse,
    ChatSessionSummary,
    ChatSessionDetail,
    ChatMessageRecord,
    CreateSessionRequest,
    SaveMessageRequest,
    UpdateSessionTitleRequest,
)
from backend.converter import (
    ir_to_qiskit,
    ir_to_qasm,
    ir_to_cirq,
    ir_to_qiskit_code,
    ir_to_cirq_code,
    ir_to_pennylane_code,
)
from backend.tutor import (
    analyze_circuit_diagnostics,
    detect_quantum_misconceptions,
    generate_circuit_explanation,
    grade_quantum_quest,
    parse_voice_circuit_command,
)
from backend.engine import (
    run_circuit,
    run_circuit_qiskit,
    run_circuit_step_by_step,
    get_available_backends,
)
from backend.comparator import compare_circuits
from backend.code_runner import execute_python_code
from backend.state_analyzer import (
    compute_bloch_vectors,
    statevector_to_probabilities,
    statevector_to_amplitudes,
    format_dirac_latex,
)
from backend.algorithms import ALGORITHMS_REGISTRY
from backend.quirk_importer import quirk_to_ir
from backend.tutor import generate_circuit_explanation
from backend.problems import (
    PROBLEMS_REGISTRY,
    generate_problem_hint,
    review_problem_circuit,
    check_problem_solution,
)
from backend.gemini_service import (
    is_gemini_active,
    set_gemini_api_key,
    generate_gemini_problem_hint,
    review_gemini_problem_circuit,
    explain_gemini_problem_concept,
    ask_gemini_socratic_tutor,
    explain_gemini_solution_feedback,
    analyze_and_fix_quantum_code,
    generate_brilliant_socratic_step,
    answer_socratic_chat,
    generate_micro_quiz,
)
from backend.chat_store import (
    init_db as init_chat_db,
    create_session,
    list_sessions,
    get_session,
    get_session_messages,
    save_message,
    update_session_title,
    delete_session,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("quantum.engine")

# Initialize chat history database
init_chat_db()
logger.info("✅ Chat history SQLite database initialized.")

app = FastAPI(
    title="Quantum Computing Education Platform API",
    description="Backend API for Quantum Circuit Execution, Multi-Backend Cross-Verification, Algorithm Library, and AI Tutor.",
    version="1.0.0",
)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "quantum-backend"}


@app.get("/backends", response_model=BackendsListResponse)
def list_backends():
    """List all available quantum simulation engines (Qiskit Aer, PennyLane, qBraid, qsim, Cirq)."""
    backends = get_available_backends()
    return BackendsListResponse(backends=backends, default="qiskit_aer")


@app.post("/execute", response_model=ExecutionResponse)
def execute_circuit(req: ExecutionRequest):
    """
    Execute a Quantum Circuit IR on a specified backend (qiskit_aer, pennylane, qsim, qbraid, cirq).
    Returns statevector amplitudes, shot counts, basis probabilities, and execution metrics.
    """
    backend_choice = req.backend or "qiskit_aer"
    logger.info(f"🚀 [SIMULATION START] Backend: {backend_choice} | Qubits: {req.circuit.num_qubits} | Gates: {len(req.circuit.gates)} | Shots: {req.shots}")
    try:
        res = run_circuit(
            circuit=req.circuit,
            backend=backend_choice,
            shots=req.shots,
            include_statevector=req.include_statevector,
        )
        logger.info(f"✅ [SIMULATION COMPLETE] {backend_choice} executed in {res.execution_time_ms}ms | Measured {len(res.counts)} distinct states")
        return res
    except Exception as e:
        logger.error(f"❌ [SIMULATION ERROR] ({backend_choice}): {str(e)}")
        raise HTTPException(status_code=400, detail=f"Execution error ({req.backend}): {str(e)}")


@app.post("/execute/compare", response_model=ComparisonResponse)
def compare_circuit_execution(req: ComparisonRequest):
    """
    Execute circuit across multiple quantum engines (Qiskit Aer, PennyLane, qsim, qBraid, Cirq),
    and verify mathematical equivalence and state fidelity.
    """
    logger.info(f"🔬 [CROSS-ENGINE COMPARE] Verifying across {len(req.backends or [])} backends...")
    try:
        res = compare_circuits(
            circuit=req.circuit,
            tolerance=req.tolerance,
            shots=req.shots,
            backends=req.backends,
        )
        logger.info(f"🎯 [CROSS-ENGINE VERIFIED] Match: {res.match} | Max Diff: {res.max_statevector_diff:.6f} | Fidelity: {res.fidelity:.6f}")
        return res
    except Exception as e:
        logger.error(f"❌ [COMPARE ERROR]: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Comparison error: {str(e)}")


@app.post("/state/bloch", response_model=BlochResponse)
def get_bloch_vectors_post(circuit: CircuitIR):
    """
    Compute single-qubit Bloch vector components (x, y, z, purity, angles)
    for each qubit via partial trace of the statevector.
    """
    try:
        res = run_circuit_qiskit(circuit, include_statevector=True)
        if not res.statevector:
            raise ValueError("Could not compute statevector.")
        
        dim = 2 ** circuit.num_qubits
        sv_array = [complex(item.real, item.imag) for item in res.statevector]
        bloch_vecs = compute_bloch_vectors(sv_array, circuit.num_qubits)
        return BlochResponse(num_qubits=circuit.num_qubits, bloch_vectors=bloch_vecs)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Bloch computation error: {str(e)}")


@app.get("/state/bloch", response_model=BlochResponse)
def get_bloch_vectors_get(preset: Optional[str] = Query(None)):
    """GET version for Bloch vectors of a preset algorithm or ground state."""
    if preset and preset in ALGORITHMS_REGISTRY:
        circuit = ALGORITHMS_REGISTRY[preset]["builder"]()
    else:
        circuit = CircuitIR(num_qubits=2, gates=[])
    return get_bloch_vectors_post(circuit)


@app.post("/state/probabilities", response_model=ProbabilitiesResponse)
def get_probabilities_post(circuit: CircuitIR):
    """Compute exact measurement probability distribution for all basis states."""
    try:
        res = run_circuit_qiskit(circuit, include_statevector=True)
        return ProbabilitiesResponse(
            num_qubits=circuit.num_qubits,
            probabilities=res.probabilities,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Probabilities computation error: {str(e)}")


@app.get("/state/probabilities", response_model=ProbabilitiesResponse)
def get_probabilities_get(preset: Optional[str] = Query(None)):
    if preset and preset in ALGORITHMS_REGISTRY:
        circuit = ALGORITHMS_REGISTRY[preset]["builder"]()
    else:
        circuit = CircuitIR(num_qubits=2, gates=[])
    return get_probabilities_post(circuit)


@app.post("/state/amplitudes", response_model=AmplitudesResponse)
def get_amplitudes_post(circuit: CircuitIR):
    """Compute raw statevector amplitudes (real, imag, magnitude, phase)."""
    try:
        res = run_circuit_qiskit(circuit, include_statevector=True)
        return AmplitudesResponse(
            num_qubits=circuit.num_qubits,
            amplitudes=res.statevector or [],
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Amplitudes computation error: {str(e)}")


@app.get("/state/amplitudes", response_model=AmplitudesResponse)
def get_amplitudes_get(preset: Optional[str] = Query(None)):
    if preset and preset in ALGORITHMS_REGISTRY:
        circuit = ALGORITHMS_REGISTRY[preset]["builder"]()
    else:
        circuit = CircuitIR(num_qubits=2, gates=[])
    return get_amplitudes_post(circuit)


@app.get("/algorithms", response_model=List[AlgorithmSummary])
def list_algorithms():
    """List all available pre-built quantum algorithms in the library."""
    results: List[AlgorithmSummary] = []
    for key, info in ALGORITHMS_REGISTRY.items():
        circuit = info["builder"]()
        results.append(
            AlgorithmSummary(
                name=key,
                display_name=info["display_name"],
                description=info["description"],
                default_params=info["default_params"],
                circuit=circuit,
            )
        )
    return results


@app.get("/algorithms/{name}", response_model=AlgorithmSummary)
def get_algorithm(name: str):
    """Get IR and description for a specific quantum algorithm."""
    if name not in ALGORITHMS_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Algorithm '{name}' not found. Available: {list(ALGORITHMS_REGISTRY.keys())}")
    
    info = ALGORITHMS_REGISTRY[name]
    circuit = info["builder"]()
    return AlgorithmSummary(
        name=name,
        display_name=info["display_name"],
        description=info["description"],
        default_params=info["default_params"],
        circuit=circuit,
    )


@app.post("/import/quirk", response_model=QuirkImportResponse)
def import_quirk_circuit(req: QuirkImportRequest):
    """Import a circuit from Quirk JSON or Quirk URL hash."""
    try:
        data = req.quirk_url if req.quirk_url else req.quirk_json
        if not data:
            raise ValueError("Must provide either 'quirk_url' or 'quirk_json'.")
        
        circuit, warnings = quirk_to_ir(data)
        return QuirkImportResponse(
            circuit=circuit,
            imported_gates_count=len(circuit.gates),
            warnings=warnings,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Quirk import failed: {str(e)}")


@app.post("/state/step-by-step", response_model=StepEvolutionResponse)
def get_step_by_step_evolution(circuit: CircuitIR):
    """
    Simulate state evolution step-by-step after each gate in the circuit.
    Returns statevector, measurement probabilities, Bloch vectors per qubit wire,
    and LaTeX Dirac notation for every execution step.
    """
    try:
        return run_circuit_step_by_step(circuit)
    except Exception as e:
        logger.error(f"Step-by-step simulation error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Step evolution error: {str(e)}")


@app.post("/tutor/explain", response_model=TutorResponse)
def tutor_explain_circuit(req: TutorRequest):
    """
    Perform deterministic diagnostics (unmeasured qubits, empty circuit, index mismatch,
    redundant gates) and provide Socratic Gemini AI tutor educational analysis with LaTeX math.
    """
    try:
        diag_resp = generate_circuit_explanation(req.circuit, req.question, req.mode)
        
        # If student asked a question and Gemini is active, get rich Socratic AI response
        if req.question and req.question.strip():
            gemini_answer = ask_gemini_socratic_tutor(
                circuit=req.circuit,
                question=req.question.strip(),
                fallback_response=diag_resp.explanation,
                mode=req.mode or "socratic",
            )
            diag_resp.explanation = gemini_answer

        return diag_resp
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Tutor analysis failed: {str(e)}")


@app.post("/api/chat", response_model=TutorChatResponse)
@app.post("/tutor/chat", response_model=TutorChatResponse)
def tutor_socratic_chat_endpoint(req: TutorChatRequest):
    """
    Pure Socratic Q&A Tutor Chat Endpoint.
    Returns 2-4 sentence intuitive explanation with LaTeX math,
    checkpoint follow-up question, key takeaways, and 3 suggested exploration chips.
    """
    try:
        return answer_socratic_chat(req)
    except Exception as e:
        logger.error(f"Socratic chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Socratic chat generation error: {str(e)}")


@app.post("/api/tutor/quiz", response_model=QuizResponse)
@app.post("/tutor/quiz", response_model=QuizResponse)
def tutor_micro_quiz_endpoint(req: QuizRequest):
    """
    AI 'Check Your Understanding' Micro-Quiz Generator.
    Returns 2-3 interactive multiple-choice questions with options,
    correct index, and pedagogical explanations.
    """
    try:
        return generate_micro_quiz(req)
    except Exception as e:
        logger.error(f"Micro quiz generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Micro quiz error: {str(e)}")


@app.post("/tutor/socratic-step", response_model=SocraticStepItem)
def get_socratic_step_endpoint(req: SocraticStepRequest):
    """
    Generate an interactive Brilliant-style Socratic micro-step challenge.
    Includes intuitive concept hook, workspace action, and predictive challenge.
    """
    try:
        return generate_brilliant_socratic_step(req)
    except Exception as e:
        logger.error(f"Socratic step error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Socratic step generation failed: {str(e)}")


@app.post("/tutor/grade-quest", response_model=QuestGradeResponse)
def tutor_grade_quest_endpoint(req: QuestGradeRequest):
    """
    Automated grader for progressive Quantum Quests.
    Checks statevector against target state and awards XP / badges.
    """
    try:
        return grade_quantum_quest(req.quest_id, req.circuit)
    except Exception as e:
        logger.error(f"Quest grading failed: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Quest grading error: {str(e)}")


@app.post("/tutor/voice-command", response_model=VoiceCommandResponse)
def tutor_voice_command_endpoint(req: VoiceCommandRequest):
    """
    Natural Language & Voice-to-Circuit Command Parser.
    Parses speech transcripts into circuit gates and updates the quantum grid.
    """
    try:
        return parse_voice_circuit_command(req.speech_transcript, req.circuit)
    except Exception as e:
        logger.error(f"Voice command error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Voice parsing error: {str(e)}")


@app.post("/tutor/fix-code", response_model=CodeFixResponse)
def tutor_fix_quantum_code_endpoint(req: CodeFixRequest):
    """
    AI Quantum Code Explainer and Error Fixer using Gemini.
    Detects quantum bugs, syntax errors, deprecations, and returns corrected code.
    """
    try:
        return analyze_and_fix_quantum_code(req)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Code fix error: {str(e)}")


@app.post("/export/qasm")
def export_qasm_endpoint(circuit: CircuitIR):
    """Export CircuitIR to OpenQASM 3.0 code."""
    try:
        qasm_str = ir_to_qasm(circuit)
        return {"qasm": qasm_str, "num_qubits": circuit.num_qubits}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"QASM export error: {str(e)}")


# ==============================================================================
# Gemini AI Configuration & Status APIs
# ==============================================================================

@app.get("/api/gemini/status")
def get_gemini_status():
    """Get status of Gemini 2.5 Flash-Lite AI service."""
    return is_gemini_active()


@app.post("/api/gemini/key")
def set_gemini_key_endpoint(payload: Dict[str, str] = Body(...)):
    """Set or update the Gemini API key at runtime."""
    key = payload.get("api_key", "").strip()
    if not key:
        raise HTTPException(status_code=400, detail="API key cannot be empty.")
    
    set_gemini_api_key(key)
    return {
        "success": True,
        "message": "Gemini API key updated successfully.",
        "status": is_gemini_active(),
    }


# ==============================================================================
# Quantum Problems & Challenges API (Gemini Flash-Lite Powered)
# ==============================================================================

def _build_problem_definition(p_data: Dict[str, Any]) -> ProblemDefinition:
    """Helper to cleanly parse and instantiate ProblemDefinition with typed GateIR objects."""
    starter_dict = p_data.get("starter_circuit", {})
    starter_gates_raw = starter_dict.get("gates", [])
    starter_gates: List[GateIR] = []
    for g in starter_gates_raw:
        if isinstance(g, dict):
            starter_gates.append(GateIR(
                name=g.get("name", ""),
                qubits=g.get("qubits", []),
                params=g.get("params", []),
            ))
        elif isinstance(g, GateIR):
            starter_gates.append(g)

    starter_circuit = CircuitIR(
        num_qubits=starter_dict.get("num_qubits", p_data.get("num_qubits", 2)),
        gates=starter_gates,
    )

    return ProblemDefinition(
        id=p_data["id"],
        title=p_data["title"],
        short_description=p_data["short_description"],
        difficulty=p_data["difficulty"],
        topic=p_data["topic"],
        xp=p_data["xp"],
        num_qubits=p_data["num_qubits"],
        estimated_minutes=p_data["estimated_minutes"],
        starter_circuit=starter_circuit,
        goal=p_data["goal"],
        expected_behavior=p_data["expected_behavior"],
        suggested_concept=p_data["suggested_concept"],
        hints=p_data["hints"],
        concept_explanation=p_data["concept_explanation"],
        available_gates=p_data.get("available_gates", ["h", "x", "y", "z", "cx", "measure"]),
        requirements=p_data.get("requirements", []),
        example_distribution=p_data.get("example_distribution", {}),
    )


@app.get("/problems", response_model=List[ProblemDefinition])
def list_problems():
    """List all available quantum learning challenges & problems."""
    return [_build_problem_definition(p_data) for p_data in PROBLEMS_REGISTRY.values()]


@app.get("/problems/{problem_id}", response_model=ProblemDefinition)
def get_problem(problem_id: str):
    """Get details for a specific quantum challenge."""
    if problem_id not in PROBLEMS_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Problem '{problem_id}' not found.")
    
    return _build_problem_definition(PROBLEMS_REGISTRY[problem_id])


@app.post("/problem/hint", response_model=ProblemHintResponse)
def get_problem_hint_endpoint(req: ProblemHintRequest):
    """Provide progressive tier hints for a problem using Gemini Flash-Lite with deterministic fallback."""
    if req.problem_id not in PROBLEMS_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Problem '{req.problem_id}' not found.")
    
    p_data = PROBLEMS_REGISTRY[req.problem_id]
    total = len(p_data.get("hints", []))
    circuit = req.circuit or CircuitIR(num_qubits=p_data.get("num_qubits", 2), gates=[])
    
    # 1. Deterministic baseline hint
    fallback_hint = generate_problem_hint(req.problem_id, circuit, req.hint_level)
    
    # 2. Gemini Flash-Lite enhanced Socratic hint
    final_hint = generate_gemini_problem_hint(
        problem_id=req.problem_id,
        problem_title=p_data["title"],
        problem_goal=p_data["goal"],
        problem_concept=p_data.get("suggested_concept", "Quantum Circuit"),
        circuit=circuit,
        hint_level=req.hint_level,
        deterministic_fallback=fallback_hint,
    )
    
    return ProblemHintResponse(
        problem_id=req.problem_id,
        hint_level=req.hint_level,
        hint=final_hint,
        total_hints=total,
    )


@app.post("/problem/review", response_model=ProblemReviewResponse)
def review_problem_endpoint(req: ProblemReviewRequest):
    """AI review of user's circuit against problem goal using Gemini Flash-Lite."""
    if req.problem_id not in PROBLEMS_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Problem '{req.problem_id}' not found.")
    
    p_data = PROBLEMS_REGISTRY[req.problem_id]
    status, base_positives, base_guidance = review_problem_circuit(req.problem_id, req.circuit)
    
    # Gemini Flash-Lite circuit critique
    final_status, final_positives, final_guidance = review_gemini_problem_circuit(
        problem_id=req.problem_id,
        problem_title=p_data["title"],
        problem_goal=p_data["goal"],
        circuit=req.circuit,
        fallback_positives=base_positives,
        fallback_guidance=base_guidance,
    )
    
    qasm_str = ir_to_qasm(req.circuit)
    
    return ProblemReviewResponse(
        problem_id=req.problem_id,
        status=final_status or status,
        positives=final_positives or base_positives,
        guidance=final_guidance or base_guidance,
        qasm=qasm_str,
    )


@app.post("/problem/explain", response_model=ProblemExplainResponse)
def explain_problem_concept_endpoint(req: ProblemExplainRequest):
    """Explain the underlying physics concept using Gemini Flash-Lite."""
    if req.problem_id not in PROBLEMS_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Problem '{req.problem_id}' not found.")
    
    p_data = PROBLEMS_REGISTRY[req.problem_id]
    base_explanation = p_data["concept_explanation"]
    concept_name = p_data.get("suggested_concept", "Quantum Concept")
    
    gemini_exp = explain_gemini_problem_concept(
        problem_id=req.problem_id,
        problem_title=p_data["title"],
        concept_name=concept_name,
        fallback_explanation=base_explanation,
        circuit=req.circuit,
    )
    
    return ProblemExplainResponse(
        problem_id=req.problem_id,
        title=p_data["title"],
        concept_explanation=gemini_exp or base_explanation,
        suggested_concept=concept_name,
    )


@app.post("/problem/check", response_model=ProblemCheckResponse)
def check_problem_endpoint(req: ProblemCheckRequest):
    """Evaluate and grade the user's circuit submission for a problem using Gemini Flash-Lite."""
    if req.problem_id not in PROBLEMS_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Problem '{req.problem_id}' not found.")
    
    p_data = PROBLEMS_REGISTRY[req.problem_id]
    prob_keys = list(PROBLEMS_REGISTRY.keys())
    curr_idx = prob_keys.index(req.problem_id)
    next_id = prob_keys[curr_idx + 1] if curr_idx + 1 < len(prob_keys) else None
    
    passed, feedback, ai_explanation, metrics = check_problem_solution(req.problem_id, req.circuit)
    
    if passed:
        # Generate rich AI breakdown using Gemini Flash-Lite
        probs_dict = metrics.get("actual", {})
        gemini_explanation = explain_gemini_solution_feedback(
            problem_id=req.problem_id,
            problem_title=p_data["title"],
            problem_goal=p_data["goal"],
            circuit=req.circuit,
            probabilities=probs_dict,
            fallback_explanation=ai_explanation,
        )
        ai_explanation = gemini_explanation or ai_explanation

    return ProblemCheckResponse(
        problem_id=req.problem_id,
        passed=passed,
        feedback=feedback,
        ai_explanation=ai_explanation,
        metrics=metrics,
        next_problem_id=next_id,
    )


@app.post("/export/qiskit")
def export_qiskit_endpoint(circuit: CircuitIR):
    """Export CircuitIR to executable Qiskit Python code."""
    try:
        code_str = ir_to_qiskit_code(circuit)
        return {"code": code_str, "num_qubits": circuit.num_qubits, "language": "python"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Qiskit code generation error: {str(e)}")


@app.post("/export/cirq")
def export_cirq_endpoint(circuit: CircuitIR):
    """Export CircuitIR to executable Google Cirq Python code."""
    try:
        code_str = ir_to_cirq_code(circuit)
        return {"code": code_str, "num_qubits": circuit.num_qubits, "language": "python"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cirq code generation error: {str(e)}")


@app.post("/export/pennylane")
def export_pennylane_endpoint(circuit: CircuitIR):
    """Export CircuitIR to executable PennyLane Python code."""
    try:
        code_str = ir_to_pennylane_code(circuit)
        return {"code": code_str, "num_qubits": circuit.num_qubits, "language": "python"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PennyLane code generation error: {str(e)}")


@app.post("/execute/code", response_model=CodeExecuteResponse)
def execute_code_endpoint(req: CodeExecuteRequest):
    """
    Execute quantum Python code locally in the verified quantum Python virtual environment
    with full Qiskit, Qiskit Aer, PennyLane, Cirq, and qsim support.
    Returns stdout, stderr, execution time, and status.
    """
    try:
        return execute_python_code(req)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Code execution failed: {str(e)}")


# ── Chat History Endpoints ───────────────────────────────────────

@app.get("/api/tutor/history")
def list_chat_sessions():
    """List all saved chat sessions (newest first) with message counts."""
    sessions = list_sessions()
    return {"sessions": sessions}


@app.post("/api/tutor/history")
def create_chat_session(req: CreateSessionRequest = Body(default=CreateSessionRequest())):
    """Create a new chat session."""
    session = create_session(title=req.title)
    return session


@app.get("/api/tutor/history/{session_id}")
def get_chat_session(session_id: str):
    """Get full session detail with all messages."""
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    messages = get_session_messages(session_id)
    return {
        **session,
        "messages": messages,
    }


@app.post("/api/tutor/history/{session_id}/message")
def save_chat_message(session_id: str, req: SaveMessageRequest):
    """Save a message to a session."""
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    msg = save_message(
        session_id=session_id,
        role=req.role,
        content=req.content,
        concept_tag=req.concept_tag,
    )
    return msg


@app.patch("/api/tutor/history/{session_id}")
def patch_chat_session(session_id: str, req: UpdateSessionTitleRequest):
    """Update a session's title."""
    updated = update_session_title(session_id, req.title)
    if not updated:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"success": True, "session_id": session_id, "title": req.title}


@app.delete("/api/tutor/history/{session_id}")
def delete_chat_session(session_id: str):
    """Delete a session and all its messages."""
    deleted = delete_session(session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"success": True, "session_id": session_id}
