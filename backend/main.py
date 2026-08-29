import math
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware

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
    TutorRequest,
    TutorResponse,
    QuirkImportRequest,
    QuirkImportResponse,
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
)
from backend.converter import ir_to_qiskit, ir_to_qasm, ir_to_cirq
from backend.engine import run_circuit, run_circuit_qiskit, get_available_backends
from backend.comparator import compare_circuits
from backend.state_analyzer import (
    compute_bloch_vectors,
    statevector_to_probabilities,
    statevector_to_amplitudes,
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
)

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
    try:
        backend_choice = req.backend or "qiskit_aer"
        return run_circuit(
            circuit=req.circuit,
            backend=backend_choice,
            shots=req.shots,
            include_statevector=req.include_statevector,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Execution error ({req.backend}): {str(e)}")


@app.post("/execute/compare", response_model=ComparisonResponse)
def compare_circuit_execution(req: ComparisonRequest):
    """
    Execute circuit across multiple quantum engines (Qiskit Aer, PennyLane, qsim, qBraid, Cirq),
    and verify mathematical equivalence and state fidelity.
    """
    try:
        return compare_circuits(
            circuit=req.circuit,
            tolerance=req.tolerance,
            shots=req.shots,
            backends=req.backends,
        )
    except Exception as e:
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


@app.post("/tutor/explain", response_model=TutorResponse)
def tutor_explain_circuit(req: TutorRequest):
    """
    Perform deterministic diagnostics (unmeasured qubits, empty circuit, index mismatch,
    redundant gates) and provide Gemini AI tutor educational analysis.
    """
    try:
        diag_resp = generate_circuit_explanation(req.circuit, req.question)
        
        # If student asked a question and Gemini is active, get rich Socratic AI response
        if req.question and req.question.strip():
            gemini_answer = ask_gemini_socratic_tutor(
                circuit=req.circuit,
                question=req.question.strip(),
                fallback_response=diag_resp.explanation,
            )
            diag_resp.explanation = gemini_answer

        return diag_resp
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Tutor analysis failed: {str(e)}")


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

