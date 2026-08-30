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


class CodeExecuteRequest(BaseModel):
    source_code: str
    language: str = "python"
    stdin: Optional[str] = None
    timeout: Optional[float] = 8.0


class CodeExecuteResponse(BaseModel):
    stdout: Optional[str] = None
    stderr: Optional[str] = None
    status: Dict[str, Any] = Field(default_factory=lambda: {"id": 3, "description": "Success"})
    time: Optional[str] = "0.000"
    source: str = "quantum_sandbox"



class AlgorithmSummary(BaseModel):
    name: str
    display_name: str
    description: str
    default_params: Dict[str, Any]
    circuit: CircuitIR


class ProblemDefinition(BaseModel):
    id: str
    title: str
    short_description: str
    difficulty: str
    topic: str
    xp: int
    num_qubits: int
    estimated_minutes: int
    starter_circuit: CircuitIR
    goal: str
    expected_behavior: str
    suggested_concept: str
    hints: List[str] = Field(default_factory=list)
    concept_explanation: str
    available_gates: List[str] = Field(default_factory=lambda: ["h", "x", "y", "z", "cx", "measure"])
    requirements: List[str] = Field(default_factory=list)
    example_distribution: Dict[str, float] = Field(default_factory=dict)


class ProblemHintRequest(BaseModel):
    problem_id: str
    circuit: Optional[CircuitIR] = None
    hint_level: int = Field(default=1, ge=1, le=5)


class ProblemHintResponse(BaseModel):
    problem_id: str
    hint_level: int
    hint: str
    total_hints: int


class ProblemReviewRequest(BaseModel):
    problem_id: str
    circuit: CircuitIR


class ProblemReviewResponse(BaseModel):
    problem_id: str
    status: str  # "clean", "warning", "error"
    positives: List[str] = Field(default_factory=list)
    guidance: List[str] = Field(default_factory=list)
    qasm: str = ""


class ProblemExplainRequest(BaseModel):
    problem_id: str
    circuit: Optional[CircuitIR] = None


class ProblemExplainResponse(BaseModel):
    problem_id: str
    title: str
    concept_explanation: str
    suggested_concept: str


class ProblemCheckRequest(BaseModel):
    problem_id: str
    circuit: CircuitIR


class ProblemCheckResponse(BaseModel):
    problem_id: str
    passed: bool
    feedback: str
    ai_explanation: str
    metrics: Dict[str, Any] = Field(default_factory=dict)
    next_problem_id: Optional[str] = None


class UserProfileSchema(BaseModel):
    name: str
    email: str
    role: str
    level: int
    level_title: str
    xp: int
    max_xp: int
    weekly_xp: int
    streak_days: int
    last_active_date: str


class KPICardSchema(BaseModel):
    id: str
    title: str
    value: str
    subtitle: str
    footer: str
    tone: str
    icon: str


class HeatmapDayCell(BaseModel):
    date: str
    iso_date: str
    count: int
    level: int


class RadarConceptSchema(BaseModel):
    concept: str
    score: int
    category: str


class FocusAreaSchema(BaseModel):
    concept: str
    accuracy: str
    recommended_problem_id: str
    recommended_problem_title: str


class RecentActivityItemSchema(BaseModel):
    id: str
    label: str
    detail: str
    time: str
    xp: str
    tone: str


class DashboardMetricsResponse(BaseModel):
    user_profile: UserProfileSchema
    kpis: List[KPICardSchema]
    heatmap: List[List[HeatmapDayCell]]
    total_events_6m: int
    current_streak_days: int
    radar_data: List[RadarConceptSchema]
    focus_area: FocusAreaSchema
    recent_activity: List[RecentActivityItemSchema]


class LogEventRequest(BaseModel):
    event_type: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    xp: int = 0


class LogEventResponse(BaseModel):
    success: bool
    event: Dict[str, Any]

