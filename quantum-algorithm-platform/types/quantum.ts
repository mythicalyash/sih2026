export interface GateIR {
  name: string;
  qubits: number[];
  params?: number[];
}

export interface CircuitIR {
  num_qubits: number;
  gates: GateIR[];
}

export interface AmplitudeItem {
  state: string;
  index: number;
  real: number;
  imag: number;
  magnitude: number;
  phase_rad: number;
  phase_deg: number;
}

export type StatevectorAmplitude = AmplitudeItem;

export type BackendId = 'qiskit_aer' | 'pennylane' | 'qsim' | 'cirq' | 'qbraid';

export interface BackendInfo {
  id: BackendId;
  name: string;
  provider: string;
  version: string;
  description: string;
  supports_statevector: boolean;
  supports_shots: boolean;
  status: string;
}

export interface ExecutionResponse {
  statevector?: AmplitudeItem[];
  counts: Record<string, number>;
  probabilities: Record<string, number>;
  num_qubits: number;
  execution_time_ms: number;
  backend?: string;
  backend_name?: string;
}

export interface ComparisonResponse {
  match: boolean;
  max_diff: number;
  tolerance: number;
  fidelity: number;
  qiskit_result?: {
    probabilities?: Record<string, number>;
    counts?: Record<string, number>;
    execution_time_ms?: number;
  };
  pennylane_result?: {
    probabilities?: Record<string, number>;
    error?: string;
  };
  results?: Record<string, any>;
  details: string;
}

export interface BlochVector {
  qubit: number;
  x: number;
  y: number;
  z: number;
  r: number;
  theta: number;
  phi: number;
}

export interface BlochResponse {
  num_qubits: number;
  bloch_vectors: BlochVector[];
}

export interface DiagnosticIssue {
  type: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  qubits?: number[] | null;
  gate_indices?: number[] | null;
}

export interface TutorResponse {
  status: string;
  issues: DiagnosticIssue[];
  explanation: string;
  circuit_summary: Record<string, any>;
  suggestions: string[];
}

export interface PlacedGate {
  id: string;
  gate: string;
  qubit: number;
  step: number;
  params?: number[];
  controlQubit?: number;
  isControl?: boolean;
  isTarget?: boolean;
}

<<<<<<< HEAD
export interface QuantumProblem {
  id: string;
  title: string;
  short_description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  topic: string;
  xp: number;
  num_qubits: number;
  estimated_minutes: number;
  starter_circuit: CircuitIR;
  goal: string;
  expected_behavior: string;
  suggested_concept: string;
  hints: string[];
  concept_explanation: string;
  available_gates?: string[];
  requirements?: string[];
  example_distribution?: Record<string, number>;
}

export interface ProblemHintResponse {
  problem_id: string;
  hint_level: number;
  hint: string;
  total_hints: number;
}

export interface ProblemReviewResponse {
  problem_id: string;
  status: 'clean' | 'warning' | 'error';
  positives: string[];
  guidance: string[];
  qasm: string;
}

export interface ProblemExplainResponse {
  problem_id: string;
  title: string;
  concept_explanation: string;
  suggested_concept: string;
}

export interface ProblemCheckResponse {
  problem_id: string;
  passed: boolean;
  feedback: string;
  ai_explanation: string;
  metrics: Record<string, any>;
  next_problem_id?: string | null;
}

export interface ProblemProgressState {
  solvedProblemIds: string[];
  attemptedProblemIds: string[];
  streakDays: number;
  totalXp: number;
}
=======
export interface ExecutionStatus {
  id: number;
  description: string;
}

export interface CodeExecutionResult {
  stdout?: string | null;
  stderr?: string | null;
  status: ExecutionStatus;
  time?: string;
  source?: string;
}

>>>>>>> origin/main
