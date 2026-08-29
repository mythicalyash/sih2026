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
        elif name == "cx":
            if len(qubits) < 2:
                raise ValueError(f"CX/CNOT gate requires at least 2 qubits [control, target], got {qubits}")
            qc.cx(qubits[0], qubits[1])
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
        elif name == "cx":
            if len(qs) >= 2: ops.append(cirq.CNOT(qs[0], qs[1]))
        elif name == "cz":
            if len(qs) >= 2: ops.append(cirq.CZ(qs[0], qs[1]))
        elif name == "swap":
            if len(qs) >= 2: ops.append(cirq.SWAP(qs[0], qs[1]))
        elif name == "ccx":
            if len(qs) >= 3: ops.append(cirq.CCX(qs[0], qs[1], qs[2]))
        elif name == "cswap":
            if len(qs) >= 3: ops.append(cirq.CSWAP(qs[0], qs[1], qs[2]))
        elif name == "reset":
            for q in qs: ops.append(cirq.reset(q))
        elif name == "measure":
            for q in qs: ops.append(cirq.measure(q, key=f"m_{q.x}"))

    return cirq.Circuit(ops)


