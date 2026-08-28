from typing import Dict, Any, Tuple, Optional
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
    shots: int = 1024
) -> ComparisonResponse:
    """
    Execute circuit on both Qiskit Aer and PennyLane (via qBraid).
    Calculate probability difference and state fidelity.
    """
    # 1. Run on Qiskit Aer
    qk_res = run_circuit_qiskit(circuit, shots=shots, include_statevector=True)
    qk_probs = qk_res.probabilities

    # 2. Run on PennyLane default.qubit
    try:
        pl_sv, pl_probs = run_circuit_pennylane(circuit)
    except Exception as e:
        # If PennyLane encounters execution issue, report diff
        return ComparisonResponse(
            match=False,
            max_diff=1.0,
            tolerance=tolerance,
            fidelity=0.0,
            qiskit_result={"probabilities": qk_probs, "counts": qk_res.counts},
            pennylane_result={"error": str(e)},
            details=f"PennyLane execution error: {str(e)}"
        )

    # 3. Calculate max probability diff across all computational basis states
    num_qubits = circuit.num_qubits
    dim = 2 ** num_qubits
    max_prob_diff = 0.0
    all_states = [bin(i)[2:].zfill(num_qubits) for i in range(dim)]

    for state in all_states:
        p_qk = qk_probs.get(state, 0.0)
        p_pl = pl_probs.get(state, 0.0)
        diff = abs(p_qk - p_pl)
        if diff > max_prob_diff:
            max_prob_diff = diff

    # 4. Calculate fidelity between statevectors
    # Re-order PennyLane statevector to match Qiskit basis indexing
    # Qiskit index k: sum(q_j * 2^j), PennyLane index m: sum(q_j * 2^(n-1-j))
    pl_sv_reordered = np.zeros_like(pl_sv)
    for k in range(dim):
        # binary of k is q_{n-1}...q_0
        qk_bin = bin(k)[2:].zfill(num_qubits)
        # in PennyLane wires order: q_0...q_{n-1}
        pl_bin = qk_bin[::-1]
        m = int(pl_bin, 2)
        pl_sv_reordered[k] = pl_sv[m]

    # Qiskit statevector
    if qk_res.statevector:
        qk_sv = np.array([complex(item.real, item.imag) for item in qk_res.statevector], dtype=complex)
        overlap = np.vdot(qk_sv, pl_sv_reordered)
        fidelity = float(abs(overlap) ** 2)
    else:
        fidelity = 1.0 if max_prob_diff < tolerance else float(1.0 - max_prob_diff)

    fidelity = round(max(0.0, min(1.0, fidelity)), 6)
    max_prob_diff = round(max_prob_diff, 6)
    is_match = bool(max_prob_diff <= tolerance and fidelity >= (1.0 - max(tolerance, 1e-3)))

    details = (
        f"Verified across Qiskit Aer and PennyLane default.qubit. "
        f"Max probability diff: {max_prob_diff:.6f} (tolerance: {tolerance}), "
        f"State Fidelity: {fidelity:.6f}."
    )

    return ComparisonResponse(
        match=is_match,
        max_diff=max_prob_diff,
        tolerance=tolerance,
        fidelity=fidelity,
        qiskit_result={
            "probabilities": qk_probs,
            "counts": qk_res.counts,
            "execution_time_ms": qk_res.execution_time_ms
        },
        pennylane_result={
            "probabilities": pl_probs,
        },
        details=details
    )
