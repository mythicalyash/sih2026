from typing import List, Dict, Optional, Any, Union
from pydantic import BaseModel, Field


class GateIR(BaseModel):
    name: str = Field(..., description="Name of the gate, e.g. 'h', 'x', 'cx', 'rx', 'measure'")
    qubits: List[int] = Field(..., description="List of target qubit indices")
    params: Optional[List[float]] = Field(default_factory=list, description="Gate parameters e.g. rotation angles")


class CircuitIR(BaseModel):
    num_qubits: int = Field(..., ge=1, le=10, description="Total number of qubits (1 to 10)")
    gates: List[GateIR] = Field(default_factory=list, description="Ordered list of quantum gates")


class ExecutionRequest(BaseModel):
    circuit: CircuitIR
    shots: int = Field(default=1024, ge=1, le=100000, description="Number of measurement shots")
    include_statevector: bool = Field(default=True, description="Whether to compute statevector")
    backend: Optional[str] = Field(
        default="qiskit_aer",
        description="Quantum simulator backend: 'qiskit_aer', 'pennylane', 'qbraid', 'qsim', 'cirq'"
    )


class AmplitudeItem(BaseModel):
    state: str
    index: int
    real: float
    imag: float
    magnitude: float
    phase_rad: float
    phase_deg: float


class BackendInfo(BaseModel):
    id: str
    name: str
    provider: str
    version: str
    description: str
    supports_statevector: bool
    supports_shots: bool
    supports_gpu: bool = False
    status: str = "active"


class BackendsListResponse(BaseModel):
    backends: List[BackendInfo]
    default: str = "qiskit_aer"


class ExecutionResponse(BaseModel):
    statevector: Optional[List[AmplitudeItem]] = None
    counts: Dict[str, int] = Field(default_factory=dict)
    probabilities: Dict[str, float] = Field(default_factory=dict)
    num_qubits: int
    execution_time_ms: float = 0.0
    backend: str = "qiskit_aer"
    backend_name: str = "Qiskit Aer (Statevector & Qasm)"


class ComparisonRequest(BaseModel):
    circuit: CircuitIR
    tolerance: float = Field(default=1e-4, ge=1e-7, le=0.5, description="Comparison absolute tolerance")
    shots: int = Field(default=1024, ge=1, le=100000)
    backends: Optional[List[str]] = Field(
        default_factory=lambda: ["qiskit_aer", "pennylane"],
        description="List of backends to compare: 'qiskit_aer', 'pennylane', 'qsim', 'qbraid', 'cirq'"
    )


class ComparisonResponse(BaseModel):
    match: bool
    max_diff: float
    tolerance: float
    fidelity: float
    qiskit_result: Optional[Dict[str, Any]] = None
    pennylane_result: Optional[Dict[str, Any]] = None
    results: Dict[str, Any] = Field(default_factory=dict)
    details: str


class BlochVector(BaseModel):
    qubit: int
    x: float
    y: float
    z: float
    r: float
    theta: float
    phi: float


class BlochResponse(BaseModel):
    num_qubits: int
    bloch_vectors: List[BlochVector]


class ProbabilitiesResponse(BaseModel):
    num_qubits: int
    probabilities: Dict[str, float]


class AmplitudesResponse(BaseModel):
    num_qubits: int
    amplitudes: List[AmplitudeItem]


class DiagnosticIssue(BaseModel):
    type: str  # e.g., "EMPTY_CIRCUIT", "UNMEASURED_QUBITS", "INDEX_OUT_OF_BOUNDS", "REDUNDANT_GATES", "UNCONNECTED_QUBIT"
    severity: str  # "error", "warning", "info"
    message: str
    qubits: Optional[List[int]] = None
    gate_indices: Optional[List[int]] = None


class TutorRequest(BaseModel):
    circuit: CircuitIR
    question: Optional[str] = ""


class TutorResponse(BaseModel):
    status: str  # "clean", "warning", "error"
    issues: List[DiagnosticIssue] = Field(default_factory=list)
    explanation: str
    circuit_summary: Dict[str, Any] = Field(default_factory=dict)
    suggestions: List[str] = Field(default_factory=list)


class QuirkImportRequest(BaseModel):
    quirk_json: Optional[Union[Dict[str, Any], List[Any], str]] = None
    quirk_url: Optional[str] = None


class QuirkImportResponse(BaseModel):
    circuit: CircuitIR
    imported_gates_count: int
    warnings: List[str] = Field(default_factory=list)


class AlgorithmSummary(BaseModel):
    name: str
    display_name: str
    description: str
    default_params: Dict[str, Any]
    circuit: CircuitIR
