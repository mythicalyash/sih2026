from typing import Dict, Any, List, Optional
import math
from backend.schemas import CircuitIR, GateIR

def build_deutsch_jozsa(oracle_type: str = "balanced", num_input_qubits: int = 2) -> CircuitIR:
    """
    Build Deutsch-Jozsa algorithm circuit IR.
    oracle_type: 'constant' or 'balanced'
    num_input_qubits: number of input qubits (default 2 -> total 3 qubits with ancilla)
    """
    n = max(1, min(4, num_input_qubits))
    ancilla = n
    total_qubits = n + 1
    gates: List[GateIR] = []

    # 1. Initialize ancilla in |1>
    gates.append(GateIR(name="x", qubits=[ancilla]))

    # 2. Apply Hadamard to all qubits (inputs + ancilla -> |->)
    for q in range(total_qubits):
        gates.append(GateIR(name="h", qubits=[q]))

    # 3. Oracle
    if oracle_type.lower() == "constant":
        # Constant oracle f(x) = 0: do nothing
        pass
    else:
        # Balanced oracle: e.g. f(x) = x_0 (CNOT from input 0 to ancilla)
        for i in range(n):
            gates.append(GateIR(name="cx", qubits=[i, ancilla]))

    # 4. Apply Hadamard to input qubits
    for i in range(n):
        gates.append(GateIR(name="h", qubits=[i]))

    # 5. Measure input qubits
    for i in range(n):
        gates.append(GateIR(name="measure", qubits=[i]))

    return CircuitIR(num_qubits=total_qubits, gates=gates)

def build_bernstein_vazirani(secret_bitstring: str = "101") -> CircuitIR:
    """
    Build Bernstein-Vazirani algorithm circuit IR.
    secret_bitstring: string of '0' and '1'
    """
    secret = str(secret_bitstring).strip()
    if not secret or not all(c in "01" for c in secret):
        secret = "101"
    
    n = len(secret)
    ancilla = n
    total_qubits = n + 1
    gates: List[GateIR] = []

    # 1. Ancilla to |1>
    gates.append(GateIR(name="x", qubits=[ancilla]))

    # 2. Hadamard all qubits
    for q in range(total_qubits):
        gates.append(GateIR(name="h", qubits=[q]))

    # 3. Query oracle: CX from qubit i to ancilla if secret[i] == '1'
    # Note: bitstring secret[0] is MSB in string, qubit 0 is LSB or index i.
    # To match standard bitstring ordering secret[::-1] or direct index:
    for i, bit in enumerate(secret):
        # We map qubit (n - 1 - i) so that binary measurement matches secret string
        qubit_idx = n - 1 - i
        if bit == "1":
            gates.append(GateIR(name="cx", qubits=[qubit_idx, ancilla]))

    # 4. Hadamard input qubits
    for i in range(n):
        gates.append(GateIR(name="h", qubits=[i]))

    # 5. Measure input qubits
    for i in range(n):
        gates.append(GateIR(name="measure", qubits=[i]))

    return CircuitIR(num_qubits=total_qubits, gates=gates)

def build_grovers_search(target_bitstring: str = "11") -> CircuitIR:
    """
    Build Grover's Search algorithm circuit IR for 2 or 3 qubits.
    target_bitstring: '00', '01', '10', '11' (2 qubits) or 3-bit string.
    """
    target = str(target_bitstring).strip()
    if not target or not all(c in "01" for c in target):
        target = "11"
    
    n = min(3, max(2, len(target)))
    target = target[-n:]
    gates: List[GateIR] = []

    # 1. Uniform superposition
    for q in range(n):
        gates.append(GateIR(name="h", qubits=[q]))

    # Oracle + Diffusion iterations:
    # For n=2, 1 iteration gives 100% success
    # For n=3, 2 iterations give ~94.5% success
    iterations = 1 if n == 2 else 2

    for _ in range(iterations):
        # --- Oracle for target ---
        # Apply X to qubits where target bit is '0'
        for i, bit in enumerate(target):
            qubit_idx = n - 1 - i
            if bit == "0":
                gates.append(GateIR(name="x", qubits=[qubit_idx]))

        # Multi-controlled Z gate
        if n == 2:
            gates.append(GateIR(name="cz", qubits=[0, 1]))
        elif n == 3:
            # Toffoli-based phase inversion: H on target -> CCX -> H
            gates.append(GateIR(name="h", qubits=[2]))
            gates.append(GateIR(name="ccx", qubits=[0, 1, 2]))
            gates.append(GateIR(name="h", qubits=[2]))

        # Undo X gates
        for i, bit in enumerate(target):
            qubit_idx = n - 1 - i
            if bit == "0":
                gates.append(GateIR(name="x", qubits=[qubit_idx]))

        # --- Diffusion Operator (Inversion about mean) ---
        for q in range(n):
            gates.append(GateIR(name="h", qubits=[q]))
            gates.append(GateIR(name="x", qubits=[q]))

        if n == 2:
            gates.append(GateIR(name="cz", qubits=[0, 1]))
        elif n == 3:
            gates.append(GateIR(name="h", qubits=[2]))
            gates.append(GateIR(name="ccx", qubits=[0, 1, 2]))
            gates.append(GateIR(name="h", qubits=[2]))

        for q in range(n):
            gates.append(GateIR(name="x", qubits=[q]))
            gates.append(GateIR(name="h", qubits=[q]))

    # Measurement
    for q in range(n):
        gates.append(GateIR(name="measure", qubits=[q]))

    return CircuitIR(num_qubits=n, gates=gates)

def build_qft(num_qubits: int = 3, input_state: Optional[str] = "001") -> CircuitIR:
    """
    Build Quantum Fourier Transform (QFT) circuit IR.
    """
    n = max(1, min(5, num_qubits))
    gates: List[GateIR] = []

    # Optional input state preparation
    if input_state:
        clean_input = input_state.strip().zfill(n)[-n:]
        for i, bit in enumerate(clean_input):
            qubit_idx = n - 1 - i
            if bit == "1":
                gates.append(GateIR(name="x", qubits=[qubit_idx]))

    # QFT Gates
    for j in range(n):
        gates.append(GateIR(name="h", qubits=[j]))
        for k in range(j + 1, n):
            # Phase angle theta = 2*pi / 2^(k - j + 1)
            angle = float(2.0 * math.pi / (2 ** (k - j + 1)))
            gates.append(GateIR(name="cp", qubits=[k, j], params=[angle]))

    # Swap qubits
    for i in range(n // 2):
        gates.append(GateIR(name="swap", qubits=[i, n - 1 - i]))

    return CircuitIR(num_qubits=n, gates=gates)

def build_quantum_teleportation(theta: float = 1.2, phi: float = 0.5) -> CircuitIR:
    """
    Build Quantum Teleportation circuit IR (3 qubits: q0=input, q1=bell_alice, q2=bob).
    Teleports arbitrary single-qubit state from q0 to q2.
    """
    gates: List[GateIR] = []

    # 1. State preparation on qubit 0
    gates.append(GateIR(name="ry", qubits=[0], params=[float(theta)]))
    gates.append(GateIR(name="rz", qubits=[0], params=[float(phi)]))

    # 2. Bell pair creation between qubit 1 and qubit 2
    gates.append(GateIR(name="h", qubits=[1]))
    gates.append(GateIR(name="cx", qubits=[1, 2]))

    # 3. Alice's Bell basis measurement interaction
    gates.append(GateIR(name="cx", qubits=[0, 1]))
    gates.append(GateIR(name="h", qubits=[0]))

    # 4. Bob's conditional correction (via standard unitary deferred measurement)
    gates.append(GateIR(name="cx", qubits=[1, 2]))
    gates.append(GateIR(name="cz", qubits=[0, 2]))

    # Measurement on all qubits
    gates.append(GateIR(name="measure", qubits=[0]))
    gates.append(GateIR(name="measure", qubits=[1]))
    gates.append(GateIR(name="measure", qubits=[2]))

    return CircuitIR(num_qubits=3, gates=gates)

def build_superdense_coding(message: str = "10") -> CircuitIR:
    """
    Build Superdense Coding circuit IR (2 qubits: q0=Alice, q1=Bob).
    Encodes 2 classical bits on q0, decodes on both qubits.
    """
    msg = str(message).strip()
    if len(msg) < 2 or not all(c in "01" for c in msg):
        msg = "10"
    msg = msg[:2]
    gates: List[GateIR] = []

    # 1. Create Bell pair |Phi+>
    gates.append(GateIR(name="h", qubits=[0]))
    gates.append(GateIR(name="cx", qubits=[0, 1]))

    # 2. Alice encodes classical 2-bit message into qubit 0
    # msg: "b1 b0" -> b1 controls X, b0 controls Z
    b1, b0 = msg[0], msg[1]
    if b0 == "1":
        gates.append(GateIR(name="z", qubits=[0]))
    if b1 == "1":
        gates.append(GateIR(name="x", qubits=[0]))

    # 3. Bob decodes
    gates.append(GateIR(name="cx", qubits=[0, 1]))
    gates.append(GateIR(name="h", qubits=[0]))

    # 4. Measure
    gates.append(GateIR(name="measure", qubits=[0]))
    gates.append(GateIR(name="measure", qubits=[1]))

    return CircuitIR(num_qubits=2, gates=gates)

ALGORITHMS_REGISTRY = {
    "deutsch_jozsa": {
        "display_name": "Deutsch-Jozsa",
        "description": "Determines whether an oracle function is constant or balanced in a single quantum query.",
        "builder": lambda: build_deutsch_jozsa(oracle_type="balanced", num_input_qubits=2),
        "default_params": {"oracle_type": "balanced", "num_input_qubits": 2},
    },
    "bernstein_vazirani": {
        "display_name": "Bernstein-Vazirani",
        "description": "Finds a hidden secret bitstring s with 100% certainty in only 1 quantum query.",
        "builder": lambda: build_bernstein_vazirani("101"),
        "default_params": {"secret_bitstring": "101"},
    },
    "grovers_search": {
        "display_name": "Grover's Search",
        "description": "Performs quantum amplitude amplification to search an unsorted space of 2^n elements with quadratic speedup.",
        "builder": lambda: build_grovers_search("11"),
        "default_params": {"target_bitstring": "11"},
    },
    "qft": {
        "display_name": "Quantum Fourier Transform (QFT)",
        "description": "Performs the discrete Fourier transform on quantum state amplitudes using quantum phase gates.",
        "builder": lambda: build_qft(3, "001"),
        "default_params": {"num_qubits": 3, "input_state": "001"},
    },
    "teleportation": {
        "display_name": "Quantum Teleportation",
        "description": "Transfers an arbitrary unknown qubit state to another qubit using shared entanglement and classical communication.",
        "builder": lambda: build_quantum_teleportation(1.2, 0.5),
        "default_params": {"theta": 1.2, "phi": 0.5},
    },
    "superdense_coding": {
        "display_name": "Superdense Coding",
        "description": "Transmits 2 classical bits of information from Alice to Bob by sending only 1 physical qubit.",
        "builder": lambda: build_superdense_coding("10"),
        "default_params": {"message": "10"},
    },
}
