import time
import math
from typing import Dict, Any, Optional, List, Tuple
import numpy as np

from backend.schemas import (
    CircuitIR,
    ExecutionResponse,
    AmplitudeItem,
    BackendInfo,
    StepEvolutionItem,
    StepEvolutionResponse,
)
from backend.converter import ir_to_qiskit, ir_to_cirq, normalize_gate_name
from backend.state_analyzer import (
    statevector_to_amplitudes,
    statevector_to_probabilities,
    compute_bloch_vectors,
    format_dirac_latex,
)

def _sample_counts_from_probs(probs: Dict[str, float], shots: int) -> Dict[str, int]:
    """Helper to sample discrete shot counts from an exact basis probability distribution."""
    outcomes = list(probs.keys())
    p_vals = list(probs.values())
    p_sum = sum(p_vals)
    if p_sum > 0:
        p_vals = [p / p_sum for p in p_vals]
    else:
        p_vals = [1.0 if i == 0 else 0.0 for i in range(len(p_vals))]

    sampled = np.random.choice(outcomes, size=shots, p=p_vals)
    counts: Dict[str, int] = {}
    for s in sampled:
        counts[s] = counts.get(s, 0) + 1
    return counts

def run_circuit_qiskit(
    circuit: CircuitIR,
    shots: int = 1024,
    include_statevector: bool = True
) -> ExecutionResponse:
    """Execute on Qiskit Aer / Statevector simulator."""
    start_time = time.perf_counter()
    num_qubits = circuit.num_qubits

    # 1. Statevector evaluation
    non_measure_gates = [g for g in circuit.gates if normalize_gate_name(g.name) != "measure"]
    ir_pure = CircuitIR(num_qubits=num_qubits, gates=non_measure_gates)
    qc_pure = ir_to_qiskit(ir_pure)

    try:
        from qiskit.quantum_info import Statevector
        sv = Statevector.from_instruction(qc_pure)
        statevector_np = np.array(sv.data, dtype=complex)
    except Exception:
        try:
            from qiskit_aer import AerSimulator
            sim = AerSimulator(method="statevector")
            qc_sv = qc_pure.copy()
            qc_sv.save_statevector()
            result = sim.run(qc_sv).result()
            statevector_np = np.array(result.get_statevector(), dtype=complex)
        except Exception:
            statevector_np = np.zeros(2 ** num_qubits, dtype=complex)
            statevector_np[0] = 1.0

    amplitudes = statevector_to_amplitudes(statevector_np, num_qubits)
    exact_probs = statevector_to_probabilities(statevector_np, num_qubits)

    # 2. Shot measurement
    counts: Dict[str, int] = {}
    has_measurements = any(normalize_gate_name(g.name) == "measure" for g in circuit.gates)
    try:
        from qiskit_aer import AerSimulator
        qc_measure = ir_to_qiskit(circuit)
        if not has_measurements:
            qc_measure.measure_all()

        sim = AerSimulator()
        job = sim.run(qc_measure, shots=shots)
        raw_counts = job.result().get_counts()
        for k, v in raw_counts.items():
            clean_k = k.replace(" ", "")[-num_qubits:].zfill(num_qubits)
            counts[clean_k] = counts.get(clean_k, 0) + v
    except Exception:
        counts = _sample_counts_from_probs(exact_probs, shots)

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0
    return ExecutionResponse(
        statevector=amplitudes if include_statevector else None,
        counts=counts,
        probabilities=exact_probs,
        num_qubits=num_qubits,
        execution_time_ms=round(elapsed_ms, 2),
        backend="qiskit_aer",
        backend_name="Qiskit Aer (IBM Quantum)"
    )

def run_circuit_pennylane(
    circuit: CircuitIR,
    shots: int = 1024,
    include_statevector: bool = True
) -> ExecutionResponse:
    """Execute on PennyLane default.qubit simulator."""
    start_time = time.perf_counter()
    import pennylane as qml

    num_qubits = circuit.num_qubits
    dev = qml.device("default.qubit", wires=num_qubits)
    active_gates = [g for g in circuit.gates if normalize_gate_name(g.name) != "measure"]

    @qml.qnode(dev)
    def pl_circuit():
        for g in active_gates:
            name = normalize_gate_name(g.name)
            qubits = g.qubits
            params = g.params or []
            theta = float(params[0]) if len(params) > 0 else math.pi

            if name == "h":
                for q in qubits: qml.Hadamard(wires=q)
            elif name == "x":
                for q in qubits: qml.PauliX(wires=q)
            elif name == "y":
                for q in qubits: qml.PauliY(wires=q)
            elif name == "z":
                for q in qubits: qml.PauliZ(wires=q)
            elif name == "s":
                for q in qubits: qml.S(wires=q)
            elif name == "sdg":
                for q in qubits: qml.adjoint(qml.S(wires=q))
            elif name == "t":
                for q in qubits: qml.T(wires=q)
            elif name == "tdg":
                for q in qubits: qml.adjoint(qml.T(wires=q))
            elif name == "sx":
                for q in qubits: qml.SX(wires=q)
            elif name == "sxdg":
                for q in qubits: qml.adjoint(qml.SX(wires=q))
            elif name == "sy":
                for q in qubits: qml.RY(math.pi / 2, wires=q)
            elif name == "sydg":
                for q in qubits: qml.RY(-math.pi / 2, wires=q)
            elif name == "x_1_4":
                for q in qubits: qml.RX(math.pi / 4, wires=q)
            elif name == "x_neg1_4":
                for q in qubits: qml.RX(-math.pi / 4, wires=q)
            elif name == "y_1_4":
                for q in qubits: qml.RY(math.pi / 4, wires=q)
            elif name == "y_neg1_4":
                for q in qubits: qml.RY(-math.pi / 4, wires=q)
            elif name == "z_1_8":
                for q in qubits: qml.PhaseShift(math.pi / 8, wires=q)
            elif name == "rx":
                for q in qubits: qml.RX(theta, wires=q)
            elif name == "ry":
                for q in qubits: qml.RY(theta, wires=q)
            elif name == "rz":
                for q in qubits: qml.RZ(theta, wires=q)
            elif name == "p":
                for q in qubits: qml.PhaseShift(theta, wires=q)
            elif name in ("u", "u3") and len(params) >= 3:
                for q in qubits: qml.Rot(params[1], params[0], params[2], wires=q)
            elif name == "cx":
                qml.CNOT(wires=[qubits[0], qubits[1]])
            elif name == "ncx":
                qml.PauliX(wires=qubits[0])
                qml.CNOT(wires=[qubits[0], qubits[1]])
                qml.PauliX(wires=qubits[0])
            elif name == "cz":
                qml.CZ(wires=[qubits[0], qubits[1]])
            elif name == "swap":
                qml.SWAP(wires=[qubits[0], qubits[1]])
            elif name == "ccx":
                qml.Toffoli(wires=[qubits[0], qubits[1], qubits[2]])
            elif name == "cswap":
                qml.CSWAP(wires=[qubits[0], qubits[1], qubits[2]])
            elif name == "qft":
                qml.QFT(wires=qubits)
            elif name == "iqft":
                qml.adjoint(qml.QFT)(wires=qubits)

        return qml.state()

    raw_sv = pl_circuit()
    pl_sv = np.array(raw_sv, dtype=complex)

    # Reorder statevector to match standard Qiskit basis indexing |q_{n-1}...q_0>
    dim = 2 ** num_qubits
    sv_reordered = np.zeros_like(pl_sv)
    for k in range(dim):
        qk_bin = bin(k)[2:].zfill(num_qubits)
        pl_bin = qk_bin[::-1]
        m = int(pl_bin, 2)
        sv_reordered[k] = pl_sv[m]

    amplitudes = statevector_to_amplitudes(sv_reordered, num_qubits)
    exact_probs = statevector_to_probabilities(sv_reordered, num_qubits)
    # 2. Native Shot measurement in PennyLane
    counts: Dict[str, int] = {}
    try:
        dev_shots = qml.device("default.qubit", wires=num_qubits)
        @qml.qnode(dev_shots, shots=shots)
        def pl_sample_circuit():
            for g in active_gates:
                name = normalize_gate_name(g.name)
                qubits = g.qubits
                params = g.params or []
                theta = float(params[0]) if len(params) > 0 else math.pi
                if name == "h":
                    for q in qubits: qml.Hadamard(wires=q)
                elif name == "x":
                    for q in qubits: qml.PauliX(wires=q)
                elif name == "y":
                    for q in qubits: qml.PauliY(wires=q)
                elif name == "z":
                    for q in qubits: qml.PauliZ(wires=q)
                elif name == "s":
                    for q in qubits: qml.S(wires=q)
                elif name == "sdg":
                    for q in qubits: qml.adjoint(qml.S(wires=q))
                elif name == "t":
                    for q in qubits: qml.T(wires=q)
                elif name == "tdg":
                    for q in qubits: qml.adjoint(qml.T(wires=q))
                elif name == "sx":
                    for q in qubits: qml.SX(wires=q)
                elif name == "sxdg":
                    for q in qubits: qml.adjoint(qml.SX(wires=q))
                elif name == "sy":
                    for q in qubits: qml.RY(math.pi / 2, wires=q)
                elif name == "sydg":
                    for q in qubits: qml.RY(-math.pi / 2, wires=q)
                elif name == "x_1_4":
                    for q in qubits: qml.RX(math.pi / 4, wires=q)
                elif name == "x_neg1_4":
                    for q in qubits: qml.RX(-math.pi / 4, wires=q)
                elif name == "y_1_4":
                    for q in qubits: qml.RY(math.pi / 4, wires=q)
                elif name == "y_neg1_4":
                    for q in qubits: qml.RY(-math.pi / 4, wires=q)
                elif name == "z_1_8":
                    for q in qubits: qml.PhaseShift(math.pi / 8, wires=q)
                elif name == "rx":
                    for q in qubits: qml.RX(theta, wires=q)
                elif name == "ry":
                    for q in qubits: qml.RY(theta, wires=q)
                elif name == "rz":
                    for q in qubits: qml.RZ(theta, wires=q)
                elif name == "p":
                    for q in qubits: qml.PhaseShift(theta, wires=q)
                elif name in ("u", "u3") and len(params) >= 3:
                    for q in qubits: qml.Rot(params[1], params[0], params[2], wires=q)
                elif name == "cx":
                    qml.CNOT(wires=[qubits[0], qubits[1]])
                elif name == "ncx":
                    qml.PauliX(wires=qubits[0])
                    qml.CNOT(wires=[qubits[0], qubits[1]])
                    qml.PauliX(wires=qubits[0])
                elif name == "cz":
                    qml.CZ(wires=[qubits[0], qubits[1]])
                elif name == "swap":
                    qml.SWAP(wires=[qubits[0], qubits[1]])
                elif name == "ccx":
                    qml.Toffoli(wires=[qubits[0], qubits[1], qubits[2]])
                elif name == "cswap":
                    qml.CSWAP(wires=[qubits[0], qubits[1], qubits[2]])
                elif name == "qft":
                    qml.QFT(wires=qubits)
                elif name == "iqft":
                    qml.adjoint(qml.QFT)(wires=qubits)
            return qml.sample(wires=list(range(num_qubits)))

        samples = pl_sample_circuit()
        for row in samples:
            bitstring = "".join(str(int(b)) for b in row[::-1])
            counts[bitstring] = counts.get(bitstring, 0) + 1
    except Exception:
        counts = _sample_counts_from_probs(exact_probs, shots)

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0
    return ExecutionResponse(
        statevector=amplitudes if include_statevector else None,
        counts=counts,
        probabilities=exact_probs,
        num_qubits=num_qubits,
        execution_time_ms=round(elapsed_ms, 2),
        backend="pennylane",
        backend_name="PennyLane (Xanadu default.qubit)"
    )

def run_circuit_qsim(
    circuit: CircuitIR,
    shots: int = 1024,
    include_statevector: bool = True
) -> ExecutionResponse:
    """Execute on Google's qsimcirq high-performance Schrodinger wave-function simulator."""
    start_time = time.perf_counter()
    import cirq
    import qsimcirq

    num_qubits = circuit.num_qubits
    qubits = cirq.LineQubit.range(num_qubits)
    
    # 1. Statevector evaluation (pure quantum circuit without destructive collapse)
    non_measure_gates = [g for g in circuit.gates if normalize_gate_name(g.name) != "measure"]
    ir_pure = CircuitIR(num_qubits=num_qubits, gates=non_measure_gates)
    cc_pure = ir_to_cirq(ir_pure)

    # Use reversed qubit order [q_{n-1}, ..., q_0] for exact match with standard Qiskit bitstring indexing
    qsim_sim = qsimcirq.QSimSimulator()
    res = qsim_sim.simulate(cc_pure, qubit_order=qubits[::-1])
    raw_sv = res.state_vector()
    statevector_np = np.array(raw_sv, dtype=complex)

    amplitudes = statevector_to_amplitudes(statevector_np, num_qubits)
    exact_probs = statevector_to_probabilities(statevector_np, num_qubits)

    # 2. Sample measurement counts using Google C++ qsim simulator
    has_measurements = any(normalize_gate_name(g.name) == "measure" for g in circuit.gates)
    counts: Dict[str, int] = {}
    try:
        cc_measure = ir_to_cirq(circuit)
        if not has_measurements:
            cc_measure.append([cirq.measure(qubits[i], key=f"q{i}") for i in range(num_qubits)])
        run_res = qsim_sim.run(cc_measure, repetitions=shots)
        for rep in range(shots):
            bitstring = "".join(str(int(run_res.measurements[f"q{i}"][rep][0])) for i in reversed(range(num_qubits)))
            counts[bitstring] = counts.get(bitstring, 0) + 1
    except Exception:
        counts = _sample_counts_from_probs(exact_probs, shots)

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0
    return ExecutionResponse(
        statevector=amplitudes if include_statevector else None,
        counts=counts,
        probabilities=exact_probs,
        num_qubits=num_qubits,
        execution_time_ms=round(elapsed_ms, 2),
        backend="qsim",
        backend_name="qsim (Google Quantum AI C++ Schrodinger Engine)"
    )

def run_circuit_cirq(
    circuit: CircuitIR,
    shots: int = 1024,
    include_statevector: bool = True
) -> ExecutionResponse:
    """Execute on Google Cirq native statevector and shot simulator."""
    start_time = time.perf_counter()
    import cirq

    num_qubits = circuit.num_qubits
    qubits = cirq.LineQubit.range(num_qubits)
    
    # 1. Statevector evaluation (pure quantum circuit without destructive collapse)
    non_measure_gates = [g for g in circuit.gates if normalize_gate_name(g.name) != "measure"]
    ir_pure = CircuitIR(num_qubits=num_qubits, gates=non_measure_gates)
    cc_pure = ir_to_cirq(ir_pure)

    sim = cirq.Simulator()
    res = sim.simulate(cc_pure, qubit_order=qubits[::-1])
    raw_sv = res.state_vector()
    statevector_np = np.array(raw_sv, dtype=complex)

    amplitudes = statevector_to_amplitudes(statevector_np, num_qubits)
    exact_probs = statevector_to_probabilities(statevector_np, num_qubits)

    # 2. Native Shot measurement in Google Cirq
    counts: Dict[str, int] = {}
    try:
        cc_measure = cc_pure.copy()
        has_measurements = any(normalize_gate_name(g.name) == "measure" for g in circuit.gates)
        if not has_measurements:
            cc_measure.append([cirq.measure(qubits[i], key=f"q{i}") for i in range(num_qubits)])
        else:
            for g in circuit.gates:
                if normalize_gate_name(g.name) == "measure":
                    for q in g.qubits:
                        if 0 <= q < num_qubits:
                            cc_measure.append(cirq.measure(qubits[q], key=f"q{q}"))
        run_res = sim.run(cc_measure, repetitions=shots)
        for rep in range(shots):
            bitstring = "".join(str(int(run_res.measurements[f"q{i}"][rep][0])) for i in reversed(range(num_qubits)))
            counts[bitstring] = counts.get(bitstring, 0) + 1
    except Exception:
        counts = _sample_counts_from_probs(exact_probs, shots)

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0
    return ExecutionResponse(
        statevector=amplitudes if include_statevector else None,
        counts=counts,
        probabilities=exact_probs,
        num_qubits=num_qubits,
        execution_time_ms=round(elapsed_ms, 2),
        backend="cirq",
        backend_name="Google Cirq Simulator"
    )

def run_circuit_qbraid(
    circuit: CircuitIR,
    shots: int = 1024,
    include_statevector: bool = True
) -> ExecutionResponse:
    """Transpile and execute across quantum SDK representations using qBraid."""
    start_time = time.perf_counter()
    import qbraid

    num_qubits = circuit.num_qubits
    non_measure_gates = [g for g in circuit.gates if normalize_gate_name(g.name) != "measure"]
    ir_pure = CircuitIR(num_qubits=num_qubits, gates=non_measure_gates)
    qc = ir_to_qiskit(ir_pure)

    try:
        cirq_prog = qbraid.transpile(qc, "cirq")
        import cirq
        sim = cirq.Simulator()
        qubits = list(cirq_prog.all_qubits())
        qubits_sorted = sorted(qubits, key=lambda q: getattr(q, "x", getattr(q, "name", str(q))))
        res = sim.simulate(cirq_prog, qubit_order=qubits_sorted[::-1])
        statevector_np = np.array(res.state_vector(), dtype=complex)

        # 2. Shot simulation via transpiled circuit
        cirq_run_prog = cirq_prog.copy()
        has_measure = any(cirq.is_measurement(op) for op in cirq_run_prog.all_operations())
        if not has_measure:
            for q in qubits_sorted:
                cirq_run_prog.append(cirq.measure(q, key=f"m_{getattr(q, 'x', getattr(q, 'name', str(q)))}"))
        run_res = sim.run(cirq_run_prog, repetitions=shots)
        keys_sorted = [f"m_{getattr(q, 'x', getattr(q, 'name', str(q)))}" for q in qubits_sorted]
        counts: Dict[str, int] = {}
        for rep in range(shots):
            bitstring = "".join(str(int(run_res.measurements[k][rep][0])) for k in reversed(keys_sorted))
            counts[bitstring] = counts.get(bitstring, 0) + 1
    except Exception:
        return run_circuit_qiskit(circuit, shots=shots, include_statevector=include_statevector)

    amplitudes = statevector_to_amplitudes(statevector_np, num_qubits)
    exact_probs = statevector_to_probabilities(statevector_np, num_qubits)

    elapsed_ms = (time.perf_counter() - start_time) * 1000.0
    return ExecutionResponse(
        statevector=amplitudes if include_statevector else None,
        counts=counts,
        probabilities=exact_probs,
        num_qubits=num_qubits,
        execution_time_ms=round(elapsed_ms, 2),
        backend="qbraid",
        backend_name="qBraid Transpiler (Cross-SDK Pipeline)"
    )

BACKEND_DISPATCHER = {
    "qiskit_aer": run_circuit_qiskit,
    "qiskit": run_circuit_qiskit,
    "pennylane": run_circuit_pennylane,
    "qbraid": run_circuit_qbraid,
    "qsim": run_circuit_qsim,
    "cirq": run_circuit_cirq,
}

def run_circuit(
    circuit: CircuitIR,
    backend: str = "qiskit_aer",
    shots: int = 1024,
    include_statevector: bool = True
) -> ExecutionResponse:
    """Unified entry point for executing quantum circuits on any supported backend."""
    b_key = backend.strip().lower().replace("-", "_")
    handler = BACKEND_DISPATCHER.get(b_key, run_circuit_qiskit)
    return handler(circuit, shots=shots, include_statevector=include_statevector)

def get_available_backends() -> List[BackendInfo]:
    """Retrieve metadata and status for all available quantum backend engines."""
    backends: List[BackendInfo] = []

    # 1. Qiskit Aer
    try:
        import qiskit
        import qiskit_aer
        backends.append(
            BackendInfo(
                id="qiskit_aer",
                name="Qiskit Aer Simulator",
                provider="IBM Quantum",
                version=f"qiskit {qiskit.__version__} / aer {qiskit_aer.__version__}",
                description="Industry standard statevector and shot-based quantum simulation engine.",
                supports_statevector=True,
                supports_shots=True,
                status="active",
            )
        )
    except ImportError:
        pass

    # 2. PennyLane
    try:
        import pennylane as qml
        backends.append(
            BackendInfo(
                id="pennylane",
                name="PennyLane Simulator",
                provider="Xanadu",
                version=qml.__version__,
                description="Quantum differentiable programming & analytical statevector simulation.",
                supports_statevector=True,
                supports_shots=True,
                status="active",
            )
        )
    except ImportError:
        pass

    # 3. qsim / Google Quantum AI
    try:
        import qsimcirq
        backends.append(
            BackendInfo(
                id="qsim",
                name="qsim High-Performance Simulator",
                provider="Google Quantum AI",
                version=qsimcirq.__version__,
                description="Ultra-fast vectorized C++ Schrodinger wave-function simulator.",
                supports_statevector=True,
                supports_shots=True,
                status="active",
            )
        )
    except ImportError:
        pass

    # 4. Cirq
    try:
        import cirq
        backends.append(
            BackendInfo(
                id="cirq",
                name="Google Cirq Simulator",
                provider="Google Quantum AI",
                version=cirq.__version__,
                description="Python framework for creating, editing, and invoking NISQ quantum circuits.",
                supports_statevector=True,
                supports_shots=True,
                status="active",
            )
        )
    except ImportError:
        pass

    # 5. qBraid
    try:
        import qbraid
        backends.append(
            BackendInfo(
                id="qbraid",
                name="qBraid Transpiler Engine",
                provider="qBraid",
                version=qbraid.__version__,
                description="Unified quantum software hub & automatic multi-SDK circuit transpilation.",
                supports_statevector=True,
                supports_shots=True,
                status="active",
            )
        )
    except ImportError:
        pass

    return backends

def run_circuit_step_by_step(circuit: CircuitIR) -> StepEvolutionResponse:
    """
    Simulate step-by-step state evolution of a quantum circuit.
    Step 0 is the initial ground state |0...0>.
    Subsequent steps evaluate state after applying gate 1, 2, ..., N.
    """
    from qiskit.quantum_info import Statevector

    num_qubits = circuit.num_qubits
    dim = 2 ** num_qubits
    steps: List[StepEvolutionItem] = []

    # Step 0: Ground state
    init_sv = np.zeros(dim, dtype=complex)
    init_sv[0] = 1.0
    steps.append(
        StepEvolutionItem(
            step_index=0,
            gate_name="init",
            qubits=list(range(num_qubits)),
            params=[],
            description="Initialized system in pure ground state |0...0⟩.",
            statevector=statevector_to_amplitudes(init_sv, num_qubits),
            probabilities=statevector_to_probabilities(init_sv, num_qubits),
            bloch_vectors=compute_bloch_vectors(init_sv, num_qubits),
            latex_state=format_dirac_latex(init_sv, num_qubits),
        )
    )

    if not circuit.gates:
        return StepEvolutionResponse(
            num_qubits=num_qubits,
            total_steps=1,
            steps=steps,
        )

    # Accumulate gates step-by-step
    for idx, current_gate in enumerate(circuit.gates):
        step_index = idx + 1
        prefix_gates = circuit.gates[:idx + 1]
        active_prefix = [g for g in prefix_gates if normalize_gate_name(g.name) != "measure"]

        try:
            sub_ir = CircuitIR(num_qubits=num_qubits, gates=active_prefix)
            qc_sub = ir_to_qiskit(sub_ir)
            sv_obj = Statevector.from_instruction(qc_sub)
            sv_arr = np.array(sv_obj.data, dtype=complex)
        except Exception:
            # Fallback to ground state if error
            sv_arr = np.zeros(dim, dtype=complex)
            sv_arr[0] = 1.0

        g_name = normalize_gate_name(current_gate.name).upper()
        q_targets = current_gate.qubits
        q_str = ", ".join(f"q[{q}]" for q in q_targets)

        # Gate narrative description
        if g_name == "H":
            desc = f"Hadamard gate on {q_str} creates an equal superposition of basis states."
        elif g_name in ["CX", "CNOT"]:
            ctrl = q_targets[0] if len(q_targets) > 0 else 0
            tgt = q_targets[1] if len(q_targets) > 1 else 1
            desc = f"Controlled-NOT with control q[{ctrl}] and target q[{tgt}] introduces multi-qubit entanglement."
        elif g_name == "X":
            desc = f"Pauli-X (NOT) gate on {q_str} bit-flips |0⟩ ↔ |1⟩ (180° rotation around X-axis)."
        elif g_name == "Y":
            desc = f"Pauli-Y gate on {q_str} performs 180° rotation around Y-axis (bit + phase flip)."
        elif g_name == "Z":
            desc = f"Pauli-Z gate on {q_str} phase-flips |1⟩ → -|1⟩ (180° rotation around Z-axis)."
        elif g_name in ["S", "SDG"]:
            desc = f"Phase gate ({g_name}) on {q_str} rotates state around Z-axis by ±90° (π/2 phase)."
        elif g_name in ["T", "TDG"]:
            desc = f"T-gate ({g_name}) on {q_str} applies a π/4 non-Clifford phase rotation."
        elif g_name == "MEASURE":
            desc = f"Projective measurement operator on {q_str} collapses superposition into classical basis state."
        elif g_name in ["RX", "RY", "RZ"]:
            angle = current_gate.params[0] if current_gate.params else math.pi
            desc = f"Parametric rotation {g_name}(θ={angle:.2f} rad) applied to {q_str} on the Bloch sphere."
        else:
            desc = f"Applied {g_name} gate operation on {q_str}."

        steps.append(
            StepEvolutionItem(
                step_index=step_index,
                gate_name=current_gate.name,
                qubits=current_gate.qubits,
                params=current_gate.params or [],
                description=desc,
                statevector=statevector_to_amplitudes(sv_arr, num_qubits),
                probabilities=statevector_to_probabilities(sv_arr, num_qubits),
                bloch_vectors=compute_bloch_vectors(sv_arr, num_qubits),
                latex_state=format_dirac_latex(sv_arr, num_qubits),
            )
        )

    return StepEvolutionResponse(
        num_qubits=num_qubits,
        total_steps=len(steps),
        steps=steps,
    )

