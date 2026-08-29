from typing import List, Dict, Any, Optional
import math
from backend.schemas import CircuitIR, GateIR

# Try importing Qiskit; handle gracefully if environment is still installing
try:
    from qiskit import QuantumCircuit, ClassicalRegister, QuantumRegister
    from qiskit.circuit import Gate
    try:
        from qiskit import qasm3
        HAS_QASM3 = True
    except ImportError:
        HAS_QASM3 = False
except ImportError:
    QuantumCircuit = None
    ClassicalRegister = None
    QuantumRegister = None
    HAS_QASM3 = False

# Normalized gate name mapping
GATE_ALIASES = {
    "cnot": "cx",
    "toffoli": "ccx",
    "fredkin": "cswap",
    "phase": "p",
    "i": "id",
    "hadamard": "h",
    "pauli_x": "x",
    "pauli_y": "y",
    "pauli_z": "z",
    "s_dagger": "sdg",
    "t_dagger": "tdg",
    "sqrt_x": "sx",
    "sqrt_x_dagger": "sxdg",
    "sqrt_x_dag": "sxdg",
    "sqrt_y": "sy",
    "sqrt_y_dagger": "sydg",
    "sqrt_y_dag": "sydg",
    "anti_cnot": "ncx",
    "anti_cx": "ncx",
    "zero_control_not": "ncx",
    "inverse_qft": "iqft",
    "qft_dagger": "iqft",
    "qft_dag": "iqft",
    "phase_i": "gphase_i",
    "phase_ni": "gphase_ni",
    "phase_sqrt_i": "gphase_sqrt_i",
    "phase_sqrt_ni": "gphase_sqrt_ni",
    "p0": "prob_0",
    "p1": "prob_1",
    "x_eighth": "x_1_4",
    "x_eighth_dag": "x_neg1_4",
    "y_eighth": "y_1_4",
    "y_eighth_dag": "y_neg1_4",
    "z_sixteenth": "z_1_8",
}


def normalize_gate_name(name: str) -> str:
    name_clean = name.strip().lower()
    return GATE_ALIASES.get(name_clean, name_clean)


def ir_to_qiskit(ir: CircuitIR) -> Any:
    """Convert CircuitIR JSON model to a Qiskit QuantumCircuit."""
    if QuantumCircuit is None:
        raise RuntimeError("Qiskit is not installed in the environment.")

    # Check if there are explicit measure gates
    has_measurements = any(normalize_gate_name(g.name) == "measure" for g in ir.gates)
    
    num_qubits = ir.num_qubits
    if num_qubits <= 0:
        raise ValueError("Circuit must have at least 1 qubit.")

    if has_measurements:
        # Create classical register of matching size
        qc = QuantumCircuit(num_qubits, num_qubits)
    else:
        qc = QuantumCircuit(num_qubits)

    for gate_idx, gate in enumerate(ir.gates):
        name = normalize_gate_name(gate.name)
        qubits = gate.qubits
        params = gate.params or []

        # Validate qubit indices
        for q in qubits:
            if q < 0 or q >= num_qubits:
                raise ValueError(f"Gate '{name}' at index {gate_idx} references invalid qubit index {q} for {num_qubits}-qubit circuit.")

        if name == "h":
            for q in qubits:
                qc.h(q)
        elif name == "x":
            for q in qubits:
                qc.x(q)
        elif name == "y":
            for q in qubits:
                qc.y(q)
        elif name == "z":
            for q in qubits:
                qc.z(q)
        elif name == "s":
            for q in qubits:
                qc.s(q)
        elif name == "sdg":
            for q in qubits:
                qc.sdg(q)
        elif name == "t":
            for q in qubits:
                qc.t(q)
        elif name == "tdg":
            for q in qubits:
                qc.tdg(q)
        elif name == "sx":
            for q in qubits:
                qc.sx(q)
        elif name == "sxdg":
            for q in qubits:
                if hasattr(qc, "sxdg"):
                    qc.sxdg(q)
                else:
                    qc.rx(-math.pi / 2, q)
        elif name == "sy":
            for q in qubits:
                qc.ry(math.pi / 2, q)
        elif name == "sydg":
            for q in qubits:
                qc.ry(-math.pi / 2, q)
        elif name == "x_1_4":
            for q in qubits:
                qc.rx(math.pi / 4, q)
        elif name == "x_neg1_4":
            for q in qubits:
                qc.rx(-math.pi / 4, q)
        elif name == "y_1_4":
            for q in qubits:
                qc.ry(math.pi / 4, q)
        elif name == "y_neg1_4":
            for q in qubits:
                qc.ry(-math.pi / 4, q)
        elif name == "z_1_8":
            for q in qubits:
                qc.p(math.pi / 8, q)
        elif name == "id":
            for q in qubits:
                qc.id(q)
        elif name == "rx":
            theta = float(params[0]) if len(params) > 0 else math.pi
            for q in qubits:
                qc.rx(theta, q)
        elif name == "ry":
            theta = float(params[0]) if len(params) > 0 else math.pi
            for q in qubits:
                qc.ry(theta, q)
        elif name == "rz":
            theta = float(params[0]) if len(params) > 0 else math.pi
            for q in qubits:
                qc.rz(theta, q)
        elif name == "p":
            theta = float(params[0]) if len(params) > 0 else math.pi
            for q in qubits:
                qc.p(theta, q)
        elif name in ("u", "u3"):
            theta = float(params[0]) if len(params) > 0 else 0.0
            phi = float(params[1]) if len(params) > 1 else 0.0
            lam = float(params[2]) if len(params) > 2 else 0.0
            for q in qubits:
                qc.u(theta, phi, lam, q)
        elif name == "cx":
            if len(qubits) < 2:
                raise ValueError(f"CX/CNOT gate requires at least 2 qubits [control, target], got {qubits}")
            qc.cx(qubits[0], qubits[1])
        elif name == "ncx":
            if len(qubits) < 2:
                raise ValueError(f"Anti-CNOT gate requires at least 2 qubits [control, target], got {qubits}")
            qc.x(qubits[0])
            qc.cx(qubits[0], qubits[1])
            qc.x(qubits[0])
        elif name == "cz":
            if len(qubits) < 2:
                raise ValueError(f"CZ gate requires at least 2 qubits [control, target], got {qubits}")
            qc.cz(qubits[0], qubits[1])
        elif name == "swap":
            if len(qubits) < 2:
                raise ValueError(f"SWAP gate requires 2 qubits, got {qubits}")
            qc.swap(qubits[0], qubits[1])
        elif name == "ch":
            if len(qubits) < 2:
                raise ValueError(f"CH gate requires 2 qubits, got {qubits}")
            qc.ch(qubits[0], qubits[1])
        elif name == "cy":
            if len(qubits) < 2:
                raise ValueError(f"CY gate requires 2 qubits, got {qubits}")
            qc.cy(qubits[0], qubits[1])
        elif name == "cp":
            theta = float(params[0]) if len(params) > 0 else math.pi
            if len(qubits) < 2:
                raise ValueError(f"CP gate requires 2 qubits, got {qubits}")
            qc.cp(theta, qubits[0], qubits[1])
        elif name == "crx":
            theta = float(params[0]) if len(params) > 0 else math.pi
            if len(qubits) < 2:
                raise ValueError(f"CRX gate requires 2 qubits, got {qubits}")
            qc.crx(theta, qubits[0], qubits[1])
        elif name == "cry":
            theta = float(params[0]) if len(params) > 0 else math.pi
            if len(qubits) < 2:
                raise ValueError(f"CRY gate requires 2 qubits, got {qubits}")
            qc.cry(theta, qubits[0], qubits[1])
        elif name == "crz":
            theta = float(params[0]) if len(params) > 0 else math.pi
            if len(qubits) < 2:
                raise ValueError(f"CRZ gate requires 2 qubits, got {qubits}")
            qc.crz(theta, qubits[0], qubits[1])
        elif name == "ccx":
            if len(qubits) < 3:
                raise ValueError(f"CCX/Toffoli gate requires 3 qubits [c1, c2, target], got {qubits}")
            qc.ccx(qubits[0], qubits[1], qubits[2])
        elif name == "cswap":
            if len(qubits) < 3:
                raise ValueError(f"CSWAP/Fredkin gate requires 3 qubits [control, target1, target2], got {qubits}")
            qc.cswap(qubits[0], qubits[1], qubits[2])
        elif name == "qft":
            # Quantum Fourier Transform subroutine on specified qubits
            targets = qubits if len(qubits) > 0 else list(range(num_qubits))
            n = len(targets)
            for j in range(n):
                qc.h(targets[j])
                for k in range(j + 1, n):
                    qc.cp(math.pi / float(2 ** (k - j)), targets[k], targets[j])
            for j in range(n // 2):
                qc.swap(targets[j], targets[n - j - 1])
        elif name == "iqft":
            # Inverse Quantum Fourier Transform subroutine
            targets = qubits if len(qubits) > 0 else list(range(num_qubits))
            n = len(targets)
            for j in range(n // 2):
                qc.swap(targets[j], targets[n - j - 1])
            for j in reversed(range(n)):
                for k in reversed(range(j + 1, n)):
                    qc.cp(-math.pi / float(2 ** (k - j)), targets[k], targets[j])
                qc.h(targets[j])
        elif name == "gphase_i":
            if hasattr(qc, "global_phase"):
                qc.global_phase += math.pi / 2
        elif name == "gphase_ni":
            if hasattr(qc, "global_phase"):
                qc.global_phase -= math.pi / 2
        elif name == "gphase_sqrt_i":
            if hasattr(qc, "global_phase"):
                qc.global_phase += math.pi / 4
        elif name == "gphase_sqrt_ni":
            if hasattr(qc, "global_phase"):
                qc.global_phase -= math.pi / 4
        elif name in ("prob_0", "prob_1"):
            # Informational projection / visualization marker
            pass
        elif name == "barrier":
            qc.barrier(qubits if qubits else range(num_qubits))
        elif name == "reset":
            for q in qubits:
                qc.reset(q)
        elif name == "measure":
            for q in qubits:
                qc.measure(q, q)
        else:
            raise ValueError(f"Unsupported quantum gate '{gate.name}'.")

    return qc


def qiskit_to_ir(qc: Any) -> CircuitIR:
    """Convert a Qiskit QuantumCircuit into our CircuitIR JSON schema."""
    num_qubits = qc.num_qubits
    gates: List[GateIR] = []

    for circuit_instruction in qc.data:
        operation = circuit_instruction.operation
        qubits_objs = circuit_instruction.qubits
        
        # Resolve qubit integer index
        qubit_indices = [qc.find_bit(q).index for q in qubits_objs]
        
        op_name = normalize_gate_name(operation.name)
        params: List[float] = []
        if hasattr(operation, "params") and operation.params:
            for p in operation.params:
                try:
                    params.append(float(p))
                except (TypeError, ValueError):
                    params.append(float(p.evalf()) if hasattr(p, "evalf") else 0.0)

        gates.append(
            GateIR(
                name=op_name,
                qubits=qubit_indices,
                params=params if params else None
            )
        )

    return CircuitIR(num_qubits=num_qubits, gates=gates)


def ir_to_qasm(circuit: CircuitIR) -> str:
    """Generate OpenQASM 3.0 representation of CircuitIR."""
    try:
        qc = ir_to_qiskit(circuit)
        if HAS_QASM3:
            return qasm3.dumps(qc)
        elif hasattr(qc, "qasm"):
            return qc.qasm()
    except Exception:
        pass

    # Fallback OpenQASM 3 string generation
    lines = [
        "OPENQASM 3.0;",
        'include "stdgates.inc";',
        "",
        f"qubit[{circuit.num_qubits}] q;",
        f"bit[{circuit.num_qubits}] c;",
        "",
    ]
    for g in circuit.gates:
        name = g.name.lower()
        if name == "cx" or name == "cnot":
            lines.append(f"cx q[{g.qubits[0]}], q[{g.qubits[1]}];")
        elif name == "cz":
            lines.append(f"cz q[{g.qubits[0]}], q[{g.qubits[1]}];")
        elif name == "swap":
            lines.append(f"swap q[{g.qubits[0]}], q[{g.qubits[1]}];")
        elif name in ("rx", "ry", "rz", "p", "phase") and g.params:
            lines.append(f"{name}({g.params[0]:.4f}) q[{g.qubits[0]}];")
        elif name == "measure":
            lines.append(f"c[{g.qubits[0]}] = measure q[{g.qubits[0]}];")
        elif name == "reset":
            lines.append(f"reset q[{g.qubits[0]}];")
        elif name == "barrier":
            lines.append(f"barrier q;")
        else:
            lines.append(f"{name} q[{g.qubits[0]}];")

    return "\n".join(lines)


def ir_to_cirq(ir: CircuitIR) -> Any:
    """Convert CircuitIR JSON model to a Google Cirq Circuit."""
    import cirq

    num_qubits = ir.num_qubits
    qubits = cirq.LineQubit.range(num_qubits)
    ops = []

    for gate_idx, gate in enumerate(ir.gates):
        name = normalize_gate_name(gate.name)
        qs = [qubits[q] for q in gate.qubits if 0 <= q < num_qubits]
        params = gate.params or []
        theta = float(params[0]) if len(params) > 0 else math.pi

        if name == "h":
            for q in qs: ops.append(cirq.H(q))
        elif name == "x":
            for q in qs: ops.append(cirq.X(q))
        elif name == "y":
            for q in qs: ops.append(cirq.Y(q))
        elif name == "z":
            for q in qs: ops.append(cirq.Z(q))
        elif name == "s":
            for q in qs: ops.append(cirq.S(q))
        elif name == "sdg":
            for q in qs: ops.append(cirq.ZPowGate(exponent=-0.5)(q))
        elif name == "t":
            for q in qs: ops.append(cirq.T(q))
        elif name == "tdg":
            for q in qs: ops.append(cirq.ZPowGate(exponent=-0.25)(q))
        elif name == "id":
            for q in qs: ops.append(cirq.I(q))
        elif name == "rx":
            for q in qs: ops.append(cirq.rx(theta)(q))
        elif name == "ry":
            for q in qs: ops.append(cirq.ry(theta)(q))
        elif name == "rz":
            for q in qs: ops.append(cirq.rz(theta)(q))
        elif name == "p":
            for q in qs: ops.append(cirq.ZPowGate(exponent=theta / math.pi)(q))
        elif name == "sx":
            for q in qs: ops.append(cirq.XPowGate(exponent=0.5)(q))
        elif name == "sxdg":
            for q in qs: ops.append(cirq.XPowGate(exponent=-0.5)(q))
        elif name == "sy":
            for q in qs: ops.append(cirq.YPowGate(exponent=0.5)(q))
        elif name == "sydg":
            for q in qs: ops.append(cirq.YPowGate(exponent=-0.5)(q))
        elif name == "x_1_4":
            for q in qs: ops.append(cirq.XPowGate(exponent=0.25)(q))
        elif name == "x_neg1_4":
            for q in qs: ops.append(cirq.XPowGate(exponent=-0.25)(q))
        elif name == "y_1_4":
            for q in qs: ops.append(cirq.YPowGate(exponent=0.25)(q))
        elif name == "y_neg1_4":
            for q in qs: ops.append(cirq.YPowGate(exponent=-0.25)(q))
        elif name == "z_1_8":
            for q in qs: ops.append(cirq.ZPowGate(exponent=0.125)(q))
        elif name == "cx":
            if len(qs) >= 2: ops.append(cirq.CNOT(qs[0], qs[1]))
        elif name == "ncx":
            if len(qs) >= 2: ops.append(cirq.X(qs[1]).controlled_by(qs[0], control_values=[0]))
        elif name == "cz":
            if len(qs) >= 2: ops.append(cirq.CZ(qs[0], qs[1]))
        elif name == "swap":
            if len(qs) >= 2: ops.append(cirq.SWAP(qs[0], qs[1]))
        elif name == "ccx":
            if len(qs) >= 3: ops.append(cirq.CCX(qs[0], qs[1], qs[2]))
        elif name == "cswap":
            if len(qs) >= 3: ops.append(cirq.CSWAP(qs[0], qs[1], qs[2]))
        elif name == "qft":
            if len(qs) > 0: ops.append(cirq.qft(*qs))
        elif name == "iqft":
            if len(qs) > 0: ops.append(cirq.inverse(cirq.qft(*qs)))
        elif name == "reset":
            for q in qs: ops.append(cirq.reset(q))
        elif name == "measure":
            for q in qs: ops.append(cirq.measure(q, key=f"m_{q.x}"))

    return cirq.Circuit(ops)


def ir_to_qiskit_code(circuit: CircuitIR) -> str:
    """Generate clean, standalone, executable Qiskit Python code for the circuit."""
    lines = [
        "from qiskit import QuantumCircuit",
        "",
        f"qc = QuantumCircuit({circuit.num_qubits})",
    ]

    for g in circuit.gates:
        name = normalize_gate_name(g.name)
        qs = g.qubits
        params = g.params or []

        if name in ("h", "x", "y", "z", "s", "sdg", "t", "tdg", "sx", "sxdg"):
            for q in qs:
                lines.append(f"qc.{name}({q})")
        elif name == "sy":
            for q in qs:
                lines.append(f"qc.ry(1.570796, {q})")
        elif name == "sydg":
            for q in qs:
                lines.append(f"qc.ry(-1.570796, {q})")
        elif name == "x_1_4":
            for q in qs:
                lines.append(f"qc.rx(0.785398, {q})")
        elif name == "x_neg1_4":
            for q in qs:
                lines.append(f"qc.rx(-0.785398, {q})")
        elif name == "y_1_4":
            for q in qs:
                lines.append(f"qc.ry(0.785398, {q})")
        elif name == "y_neg1_4":
            for q in qs:
                lines.append(f"qc.ry(-0.785398, {q})")
        elif name == "z_1_8":
            for q in qs:
                lines.append(f"qc.p(0.392699, {q})")
        elif name in ("rx", "ry", "rz", "p") and len(params) > 0:
            for q in qs:
                lines.append(f"qc.{name}({params[0]:.6f}, {q})")
        elif name in ("u", "u3") and len(params) >= 3:
            for q in qs:
                lines.append(f"qc.u({params[0]:.4f}, {params[1]:.4f}, {params[2]:.4f}, {q})")
        elif name == "cx" and len(qs) >= 2:
            lines.append(f"qc.cx({qs[0]}, {qs[1]})")
        elif name == "ncx" and len(qs) >= 2:
            lines.append(f"qc.x({qs[0]}); qc.cx({qs[0]}, {qs[1]}); qc.x({qs[0]})")
        elif name == "cz" and len(qs) >= 2:
            lines.append(f"qc.cz({qs[0]}, {qs[1]})")
        elif name == "swap" and len(qs) >= 2:
            lines.append(f"qc.swap({qs[0]}, {qs[1]})")
        elif name == "ccx" and len(qs) >= 3:
            lines.append(f"qc.ccx({qs[0]}, {qs[1]}, {qs[2]})")
        elif name == "cswap" and len(qs) >= 3:
            lines.append(f"qc.cswap({qs[0]}, {qs[1]}, {qs[2]})")
        elif name == "qft":
            lines.append(f"# QFT on qubits {qs}")
        elif name == "reset":
            for q in qs:
                lines.append(f"qc.reset({q})")
        elif name == "measure":
            for q in qs:
                lines.append(f"qc.measure({q}, {q})")

    return "\n".join(lines)


def ir_to_cirq_code(circuit: CircuitIR) -> str:
    """Generate clean, standalone, executable Google Cirq Python code for the circuit."""
    lines = [
        "import cirq",
        "",
        f"qubits = cirq.LineQubit.range({circuit.num_qubits})",
        "circuit = cirq.Circuit()",
    ]

    for g in circuit.gates:
        name = normalize_gate_name(g.name)
        qs = g.qubits
        params = g.params or []

        if name == "h":
            for q in qs: lines.append(f"circuit.append(cirq.H(qubits[{q}]))")
        elif name == "x":
            for q in qs: lines.append(f"circuit.append(cirq.X(qubits[{q}]))")
        elif name == "y":
            for q in qs: lines.append(f"circuit.append(cirq.Y(qubits[{q}]))")
        elif name == "z":
            for q in qs: lines.append(f"circuit.append(cirq.Z(qubits[{q}]))")
        elif name == "s":
            for q in qs: lines.append(f"circuit.append(cirq.S(qubits[{q}]))")
        elif name == "sdg":
            for q in qs: lines.append(f"circuit.append(cirq.ZPowGate(exponent=-0.5)(qubits[{q}]))")
        elif name == "t":
            for q in qs: lines.append(f"circuit.append(cirq.T(qubits[{q}]))")
        elif name == "tdg":
            for q in qs: lines.append(f"circuit.append(cirq.ZPowGate(exponent=-0.25)(qubits[{q}]))")
        elif name == "sx":
            for q in qs: lines.append(f"circuit.append(cirq.XPowGate(exponent=0.5)(qubits[{q}]))")
        elif name == "rx" and len(params) > 0:
            for q in qs: lines.append(f"circuit.append(cirq.rx({params[0]:.6f})(qubits[{q}]))")
        elif name == "ry" and len(params) > 0:
            for q in qs: lines.append(f"circuit.append(cirq.ry({params[0]:.6f})(qubits[{q}]))")
        elif name == "rz" and len(params) > 0:
            for q in qs: lines.append(f"circuit.append(cirq.rz({params[0]:.6f})(qubits[{q}]))")
        elif name == "cx" and len(qs) >= 2:
            lines.append(f"circuit.append(cirq.CNOT(qubits[{qs[0]}], qubits[{qs[1]}]))")
        elif name == "cz" and len(qs) >= 2:
            lines.append(f"circuit.append(cirq.CZ(qubits[{qs[0]}], qubits[{qs[1]}]))")
        elif name == "swap" and len(qs) >= 2:
            lines.append(f"circuit.append(cirq.SWAP(qubits[{qs[0]}], qubits[{qs[1]}]))")
        elif name == "ccx" and len(qs) >= 3:
            lines.append(f"circuit.append(cirq.CCX(qubits[{qs[0]}], qubits[{qs[1]}], qubits[{qs[2]}]))")
        elif name == "cswap" and len(qs) >= 3:
            lines.append(f"circuit.append(cirq.CSWAP(qubits[{qs[0]}], qubits[{qs[1]}], qubits[{qs[2]}]))")
        elif name == "measure":
            for q in qs: lines.append(f"circuit.append(cirq.measure(qubits[{q}]))")

    return "\n".join(lines)


def ir_to_pennylane_code(circuit: CircuitIR) -> str:
    """Generate clean, standalone, executable Xanadu PennyLane Python code for the circuit."""
    lines = [
        "import pennylane as qml",
        "",
        f"dev = qml.device('default.qubit', wires={circuit.num_qubits})",
        "",
        "@qml.qnode(dev)",
        "def circuit():",
    ]

    for g in circuit.gates:
        name = normalize_gate_name(g.name)
        qs = g.qubits
        params = g.params or []

        if name == "h":
            for q in qs: lines.append(f"    qml.Hadamard(wires={q})")
        elif name == "x":
            for q in qs: lines.append(f"    qml.PauliX(wires={q})")
        elif name == "y":
            for q in qs: lines.append(f"    qml.PauliY(wires={q})")
        elif name == "z":
            for q in qs: lines.append(f"    qml.PauliZ(wires={q})")
        elif name == "s":
            for q in qs: lines.append(f"    qml.S(wires={q})")
        elif name == "sdg":
            for q in qs: lines.append(f"    qml.adjoint(qml.S(wires={q}))")
        elif name == "t":
            for q in qs: lines.append(f"    qml.T(wires={q})")
        elif name == "tdg":
            for q in qs: lines.append(f"    qml.adjoint(qml.T(wires={q}))")
        elif name == "sx":
            for q in qs: lines.append(f"    qml.SX(wires={q})")
        elif name == "rx" and len(params) > 0:
            for q in qs: lines.append(f"    qml.RX({params[0]:.6f}, wires={q})")
        elif name == "ry" and len(params) > 0:
            for q in qs: lines.append(f"    qml.RY({params[0]:.6f}, wires={q})")
        elif name == "rz" and len(params) > 0:
            for q in qs: lines.append(f"    qml.RZ({params[0]:.6f}, wires={q})")
        elif name == "cx" and len(qs) >= 2:
            lines.append(f"    qml.CNOT(wires=[{qs[0]}, {qs[1]}])")
        elif name == "cz" and len(qs) >= 2:
            lines.append(f"    qml.CZ(wires=[{qs[0]}, {qs[1]}])")
        elif name == "swap" and len(qs) >= 2:
            lines.append(f"    qml.SWAP(wires=[{qs[0]}, {qs[1]}])")
        elif name == "ccx" and len(qs) >= 3:
            lines.append(f"    qml.Toffoli(wires=[{qs[0]}, {qs[1]}, {qs[2]}])")
        elif name == "cswap" and len(qs) >= 3:
            lines.append(f"    qml.CSWAP(wires=[{qs[0]}, {qs[1]}, {qs[2]}])")

    lines.append("    return qml.state()")
    return "\n".join(lines)



