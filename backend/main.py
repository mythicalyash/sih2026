import math
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware

from backend.schemas import (
    CircuitIR,
    ExecutionRequest,
    ExecutionResponse,
    ComparisonRequest,
    ComparisonResponse,
    BlochResponse,
    ProbabilitiesResponse,
    AmplitudesResponse,
    TutorRequest,
    TutorResponse,
    QuirkImportRequest,
    QuirkImportResponse,
    AlgorithmSummary,
)
from backend.converter import ir_to_qiskit, ir_to_qasm
from backend.engine import run_circuit_qiskit
from backend.comparator import compare_circuits
from backend.state_analyzer import (
    compute_bloch_vectors,
    statevector_to_probabilities,
    statevector_to_amplitudes,
)
from backend.algorithms import ALGORITHMS_REGISTRY
from backend.quirk_importer import quirk_to_ir
from backend.tutor import generate_circuit_explanation

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


@app.post("/execute", response_model=ExecutionResponse)
def execute_circuit(req: ExecutionRequest):
    """
    Execute a Quantum Circuit IR on Qiskit Aer.
    Returns statevector amplitudes, shot counts, and measurement probabilities.
    """
    try:
        return run_circuit_qiskit(
            circuit=req.circuit,
            shots=req.shots,
            include_statevector=req.include_statevector,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Execution error: {str(e)}")


@app.post("/execute/compare", response_model=ComparisonResponse)
def compare_circuit_execution(req: ComparisonRequest):
    """
    Execute circuit on both Qiskit Aer and PennyLane (via qBraid),
    and verify numerical equivalence within tolerance.
    """
    try:
        return compare_circuits(
            circuit=req.circuit,
            tolerance=req.tolerance,
            shots=req.shots,
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
    redundant gates) and provide AI tutor educational analysis.
    """
    try:
        return generate_circuit_explanation(req.circuit, req.question)
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

