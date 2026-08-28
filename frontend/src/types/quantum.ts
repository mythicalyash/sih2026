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

export interface ExecutionResponse {
  statevector?: AmplitudeItem[];
  counts: Record<string, number>;
  probabilities: Record<string, number>;
  num_qubits: number;
  execution_time_ms: number;
}

export interface ComparisonResponse {
  match: boolean;
  max_diff: number;
  tolerance: number;
  fidelity: number;
  qiskit_result: {
    probabilities?: Record<string, number>;
    counts?: Record<string, number>;
    execution_time_ms?: number;
  };
  pennylane_result: {
    probabilities?: Record<string, number>;
    error?: string;
  };
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
  severity: "error" | "warning" | "info";
  message: string;
  qubits?: number[];
  gate_indices?: number[];
}

export interface TutorResponse {
  status: "clean" | "warning" | "error";
  issues: DiagnosticIssue[];
  explanation: string;
  circuit_summary: Record<string, any>;
  suggestions: string[];
}

export interface AlgorithmSummary {
  name: string;
  display_name: string;
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
