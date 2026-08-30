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


class StepEvolutionItem(BaseModel):
    step_index: int
    gate_name: Optional[str] = None
    qubits: Optional[List[int]] = None
    params: Optional[List[float]] = None
    description: str = ""
    statevector: List[AmplitudeItem] = Field(default_factory=list)
    probabilities: Dict[str, float] = Field(default_factory=dict)
    bloch_vectors: List[BlochVector] = Field(default_factory=list)
    latex_state: str = ""


class StepEvolutionResponse(BaseModel):
    num_qubits: int
    total_steps: int
    steps: List[StepEvolutionItem] = Field(default_factory=list)


class DiagnosticIssue(BaseModel):
    type: str  # e.g., "EMPTY_CIRCUIT", "UNMEASURED_QUBITS", "INDEX_OUT_OF_BOUNDS", "REDUNDANT_GATES", "UNCONNECTED_QUBIT"
    severity: str  # "error", "warning", "info"
    message: str
    qubits: Optional[List[int]] = None
    gate_indices: Optional[List[int]] = None


class MisconceptionItem(BaseModel):
    id: str  # e.g., "CLASSICAL_VS_SUPERPOSITION", "NO_CLONING_VIOLATION", "MEASUREMENT_COLLAPSE", "REDUNDANT_GATES"
    title: str
    description: str
    corrective_guidance: str
    severity: str = "warning"  # "info", "warning", "error"


class TutorRequest(BaseModel):
    circuit: CircuitIR
    question: Optional[str] = ""
    mode: Optional[str] = "socratic"  # "socratic", "beginner", "mathematical", "diagnostics", "code"


class TutorResponse(BaseModel):
    status: str  # "clean", "warning", "error"
    issues: List[DiagnosticIssue] = Field(default_factory=list)
    misconceptions: List[MisconceptionItem] = Field(default_factory=list)
    explanation: str
    circuit_summary: Dict[str, Any] = Field(default_factory=dict)
    suggestions: List[str] = Field(default_factory=list)
    latex_math: Optional[str] = None
    code_fix: Optional[str] = None


class TutorChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = Field(default_factory=list)
    mode: Optional[str] = "socratic"  # "socratic", "eli5", "mathematical"


class TutorChatResponse(BaseModel):
    reply: str
    follow_up_question: Optional[str] = None
    suggestions: List[str] = Field(default_factory=list)
    concept_tag: Optional[str] = "Quantum Fundamentals"
    key_takeaways: List[str] = Field(default_factory=list)


class QuizRequest(BaseModel):
    topic: str
    context: Optional[str] = None
    num_questions: Optional[int] = 3


class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correctIndex: int
    explanation: str


class QuizResponse(BaseModel):
    topic: str
    quiz: List[QuizQuestion] = Field(default_factory=list)


class PredictiveChallenge(BaseModel):
    question: str
    options: List[str]
    correct_index: int
    hint: str
    explanation: str


class SocraticStepItem(BaseModel):
    step_id: str
    track_id: str
    title: str
    step_number: int
    total_steps: int
    intuitive_concept: str
    workspace_action: str
    target_gate_hint: Optional[str] = None
    predictive_challenge: Optional[PredictiveChallenge] = None
    latex_formula: Optional[str] = None
    misconceptions: List[MisconceptionItem] = Field(default_factory=list)
    xp_reward: int = 25


class SocraticStepRequest(BaseModel):
    circuit: CircuitIR
    question: Optional[str] = None
    track_id: Optional[str] = "superposition"
    step_number: int = 1


class CodeFixRequest(BaseModel):
    source_code: str
    error_message: Optional[str] = None
    language: str = "python"
    circuit_context: Optional[CircuitIR] = None


class CodeFixResponse(BaseModel):
    success: bool
    explanation: str
    corrected_code: str
    issues_found: List[str] = Field(default_factory=list)
    optimizations: List[str] = Field(default_factory=list)


class VoiceCommandRequest(BaseModel):
    speech_transcript: str
    circuit: CircuitIR


class VoiceCommandResponse(BaseModel):
    success: bool
    action_description: str
    circuit: CircuitIR
    gates_added: List[GateIR] = Field(default_factory=list)


class QuestGradeRequest(BaseModel):
    quest_id: str
    circuit: CircuitIR


class QuestGradeResponse(BaseModel):
    success: bool
    quest_id: str
    title: str
    score: int
    fidelity: float
    message: str
    target_state_latex: str
    current_state_latex: str
    badge: Optional[str] = None


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


# ── Chat History Models ──────────────────────────────────────────

class ChatMessageRecord(BaseModel):
    id: str
    session_id: str
    role: str  # "user" | "tutor"
    content: str
    concept_tag: str = ""
    created_at: str


class ChatSessionSummary(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    message_count: int = 0


class ChatSessionDetail(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    messages: List[ChatMessageRecord] = Field(default_factory=list)


class CreateSessionRequest(BaseModel):
    title: str = "New Chat"


class SaveMessageRequest(BaseModel):
    role: str  # "user" | "tutor"
    content: str
    concept_tag: str = ""


class UpdateSessionTitleRequest(BaseModel):
    title: str
