export type SupportedBackend =
  | 'qiskit_aer'
  | 'pennylane'
  | 'cirq'
  | 'qsim'
  | 'qbraid';

export interface GateIR {
  name: string;
  qubits: number[];
  params?: number[];
  condition?: {
    classical_bit: number;
    value: number;
  };
}

export interface CircuitIR {
  num_qubits: number;
  gates: GateIR[];
  metadata?: Record<string, any>;
}

export interface ExecutionRequest {
  circuit: CircuitIR;
  shots?: number;
  backend?: SupportedBackend;
  include_statevector?: boolean;
  noise_model?: Record<string, any>;
}

export interface ExecutionResponse {
  counts: Record<string, number>;
  probabilities: Record<string, number>;
  statevector?: number[][];
  execution_time_ms: number;
  backend_used: string;
  num_qubits: number;
  raw_output?: Record<string, any>;
}

export interface BackendStatus {
  backend: SupportedBackend;
  available: boolean;
  version?: string;
  device_name?: string;
  supports_statevector: boolean;
  supports_noise: boolean;
  error_message?: string;
}

export interface CompareRequest {
  circuit: CircuitIR;
  backends: SupportedBackend[];
  shots?: number;
}

export interface CompareResponse {
  results: Record<string, ExecutionResponse>;
  total_time_ms: number;
}

export interface AlgorithmSummary {
  id: string;
  name: string;
  category: string;
  description: string;
  default_params: Record<string, any>;
  circuit: CircuitIR;
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

export interface ExecutionStatus {
  id: number;
  description: string;
}

export interface CodeExecutionResult {
  stdout: string;
  stderr: string;
  execution_time_ms: number;
  status: string;
  source?: string;
}

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
