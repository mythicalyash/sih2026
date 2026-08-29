from typing import Dict, Any, Tuple, Optional, List
import math
import numpy as np

from backend.schemas import CircuitIR, ComparisonResponse
from backend.converter import ir_to_qiskit, normalize_gate_name
from backend.engine import run_circuit_qiskit


def run_circuit_pennylane(circuit: CircuitIR) -> Tuple[np.ndarray, Dict[str, float]]:
    """
    Run circuit on PennyLane default.qubit device.
    Returns (statevector, probabilities_dict).
    Uses qbraid transpilation where possible with native PennyLane execution.
    """
    import pennylane as qml

    num_qubits = circuit.num_qubits
    dev = qml.device("default.qubit", wires=num_qubits)

    # Filter out explicit measurement gates for unitary state evolution
    active_gates = [g for g in circuit.gates if normalize_gate_name(g.name) != "measure"]

    # Attempt qbraid transpilation if qbraid is installed
    used_qbraid = False
    try:
        import qbraid
        qc = ir_to_qiskit(CircuitIR(num_qubits=num_qubits, gates=active_gates))
        pl_program = qbraid.transpile(qc, "pennylane")
        if callable(pl_program):
            @qml.qnode(dev)
            def qbraid_qnode():
                pl_program()
                return qml.state(), qml.probs(wires=range(num_qubits))
            
            sv_raw, probs_raw = qbraid_qnode()
            used_qbraid = True
    except Exception:
        used_qbraid = False

    if not used_qbraid:
        @qml.qnode(dev)
        def native_pl_qnode():
            for g in active_gates:
                name = normalize_gate_name(g.name)
                qubits = g.qubits
                params = g.params or []

                if name == "h":
                    for q in qubits:
                        qml.Hadamard(wires=q)
                elif name == "x":
                    for q in qubits:
                        qml.PauliX(wires=q)
                elif name == "y":
                    for q in qubits:
                        qml.PauliY(wires=q)
                elif name == "z":
                    for q in qubits:
                        qml.PauliZ(wires=q)
                elif name == "s":
                    for q in qubits:
                        qml.S(wires=q)
                elif name == "sdg":
                    for q in qubits:
                        qml.adjoint(qml.S(wires=q))
                elif name == "t":
                    for q in qubits:
                        qml.T(wires=q)
                elif name == "tdg":
                    for q in qubits:
                        qml.adjoint(qml.T(wires=q))
                elif name == "rx":
                    theta = float(params[0]) if len(params) > 0 else math.pi
                    for q in qubits:
                        qml.RX(theta, wires=q)
                elif name == "ry":
                    theta = float(params[0]) if len(params) > 0 else math.pi
                    for q in qubits:
                        qml.RY(theta, wires=q)
                elif name == "rz":
                    theta = float(params[0]) if len(params) > 0 else math.pi
                    for q in qubits:
                        qml.RZ(theta, wires=q)
                elif name == "p":
                    theta = float(params[0]) if len(params) > 0 else math.pi
                    for q in qubits:
                        qml.PhaseShift(theta, wires=q)
                elif name == "cx":
                    qml.CNOT(wires=[qubits[0], qubits[1]])
                elif name == "cz":
                    qml.CZ(wires=[qubits[0], qubits[1]])
                elif name == "swap":
                    qml.SWAP(wires=[qubits[0], qubits[1]])
                elif name == "ch":
                    qml.CY(wires=[qubits[0], qubits[1]])  # fallback or custom
                elif name == "ccx":
                    qml.Toffoli(wires=[qubits[0], qubits[1], qubits[2]])
                elif name == "cswap":
                    qml.CSWAP(wires=[qubits[0], qubits[1], qubits[2]])
                elif name == "id":
                    pass

            return qml.state(), qml.probs(wires=range(num_qubits))

        sv_raw, probs_raw = native_pl_qnode()

    sv_array = np.array(sv_raw, dtype=complex)
    probs_array = np.array(probs_raw, dtype=float)

    # Map PennyLane bitstring format to Qiskit bitstring format |q_{n-1}...q_0>
    # In PennyLane, binary index m corresponds to wire configuration (q_0, q_1, ..., q_{n-1})
    # In Qiskit, bitstring is q_{n-1} ... q_0.
    pl_probs: Dict[str, float] = {}
    dim = 2 ** num_qubits
    for m in range(dim):
        pl_bin_wire_order = bin(m)[2:].zfill(num_qubits)  # q0, q1, ..., q_{n-1}
        # Invert to Qiskit little-endian format q_{n-1}...q_0
        qiskit_format_str = pl_bin_wire_order[::-1]
        pl_probs[qiskit_format_str] = round(float(probs_array[m]), 6)

    return sv_array, pl_probs


def compare_circuits(
    circuit: CircuitIR,
    tolerance: float = 1e-4,
    shots: int = 1024,
    backends: Optional[List[str]] = None
) -> ComparisonResponse:
    """
    Execute circuit across multiple quantum backends (Qiskit Aer, PennyLane, qsim, qBraid, Cirq),
    compute basis probability differences and state fidelities, and verify mathematical equivalence.
    """
    from backend.engine import run_circuit

    if not backends or len(backends) == 0:
        backends = ["qiskit_aer", "pennylane"]

    results_map: Dict[str, Any] = {}
    sv_map: Dict[str, np.ndarray] = {}
    probs_map: Dict[str, Dict[str, float]] = {}

    num_qubits = circuit.num_qubits
    dim = 2 ** num_qubits

    for b_id in backends:
        try:
            exec_res = run_circuit(circuit, backend=b_id, shots=shots, include_statevector=True)
            results_map[b_id] = {
                "backend": exec_res.backend,
                "backend_name": exec_res.backend_name,
                "probabilities": exec_res.probabilities,
                "counts": exec_res.counts,
                "execution_time_ms": exec_res.execution_time_ms,
                "status": "success",
            }
            probs_map[b_id] = exec_res.probabilities
            if exec_res.statevector:
                sv_map[b_id] = np.array([complex(a.real, a.imag) for a in exec_res.statevector], dtype=complex)
        except Exception as e:
            results_map[b_id] = {
                "backend": b_id,
                "status": "error",
                "error": str(e),
            }

    # If fewer than 2 backends succeeded, return failure
    successful_backends = list(probs_map.keys())
    if len(successful_backends) < 2:
        return ComparisonResponse(
            match=False,
            max_diff=1.0,
            tolerance=tolerance,
            fidelity=0.0,
            qiskit_result=results_map.get("qiskit_aer", {}),
            pennylane_result=results_map.get("pennylane", {}),
            results=results_map,
            details=f"Comparison failed: Only {len(successful_backends)} backend(s) succeeded."
        )

    # Compute maximum probability difference across all pairs and basis states
    all_states = [bin(i)[2:].zfill(num_qubits) for i in range(dim)]
    global_max_diff = 0.0

    for i in range(len(successful_backends)):
        for j in range(i + 1, len(successful_backends)):
            b1 = successful_backends[i]
            b2 = successful_backends[j]
            p1 = probs_map[b1]
            p2 = probs_map[b2]
            for state in all_states:
                diff = abs(p1.get(state, 0.0) - p2.get(state, 0.0))
                if diff > global_max_diff:
                    global_max_diff = diff

    # Compute state fidelity across pairs
    min_fidelity = 1.0
    sv_backends = list(sv_map.keys())
    for i in range(len(sv_backends)):
        for j in range(i + 1, len(sv_backends)):
            b1 = sv_backends[i]
            b2 = sv_backends[j]
            sv1 = sv_map[b1]
            sv2 = sv_map[b2]
            overlap = np.vdot(sv1, sv2)
            fid = float(abs(overlap) ** 2)
            if fid < min_fidelity:
                min_fidelity = fid

    min_fidelity = round(max(0.0, min(1.0, min_fidelity)), 6)
    global_max_diff = round(global_max_diff, 6)
    is_match = bool(global_max_diff <= tolerance and min_fidelity >= (1.0 - max(tolerance, 1e-3)))

    b_names = [results_map[b].get("backend_name", b) for b in successful_backends]
    details = (
        f"Verified across {len(successful_backends)} backends ({', '.join(b_names)}). "
        f"Max probability diff: {global_max_diff:.6f} (tolerance: {tolerance}), "
        f"Minimum State Fidelity: {min_fidelity:.6f}."
    )

    return ComparisonResponse(
        match=is_match,
        max_diff=global_max_diff,
        tolerance=tolerance,
        fidelity=min_fidelity,
        qiskit_result=results_map.get("qiskit_aer", results_map.get(successful_backends[0], {})),
        pennylane_result=results_map.get("pennylane", results_map.get(successful_backends[-1], {})),
        results=results_map,
        details=details
    )
