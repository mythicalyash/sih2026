import os
import json
import math
from typing import Dict, Any, List, Optional, Tuple
import numpy as np

from backend.schemas import (
    CircuitIR,
    GateIR,
    ExecutionResponse,
    DiagnosticIssue,
)
from backend.converter import normalize_gate_name, ir_to_qasm
from backend.engine import run_circuit_qiskit
from backend.state_analyzer import compute_bloch_vectors

# Problem Registry for the 6 Hackathon Demo Problems
PROBLEMS_REGISTRY = {
    "superposition": {
        "id": "superposition",
        "title": "Create a Superposition",
        "short_description": "Create an equal superposition on a single qubit (|0⟩ and |1⟩ ~50% each).",
        "difficulty": "Beginner",
        "topic": "Superposition",
        "xp": 100,
        "num_qubits": 1,
        "estimated_minutes": 3,
        "available_gates": ["h", "x", "y", "z", "measure"],
        "requirements": [
            "Start with qubit q[0] in ground state |0⟩",
            "Construct a circuit resulting in equal probabilities for |0⟩ and |1⟩",
            "Target probability distribution: P(|0⟩) ≈ 50%, P(|1⟩) ≈ 50%"
        ],
        "example_distribution": {
            "|0⟩": 0.5,
            "|1⟩": 0.5
        },
        "starter_circuit": {
            "num_qubits": 1,
            "gates": []
        },
        "goal": "Create an equal quantum superposition on a single qubit, transitioning the initialized state |0⟩ into (|0⟩ + |1⟩)/√2.",
        "expected_behavior": "The measurement probability distribution should be approximately 50% for |0⟩ and 50% for |1⟩.",
        "suggested_concept": "Hadamard (H) Gate",
        "hints": [
            "Start by thinking about which single-qubit gate creates an equal mixture of |0⟩ and |1⟩ from the ground state.",
            "In quantum computing, the Hadamard (H) gate is the primary tool to create superposition. Look for the red 'H' gate in the Operations palette.",
            "Drag an 'H' gate onto wire q[0] at step 0, then click 'Run Simulation' or 'Check Solution'."
        ],
        "concept_explanation": "In classical computing, a bit is either strictly 0 or 1. In quantum mechanics, a qubit can exist in a linear combination of both states: |ψ⟩ = α|0⟩ + β|1⟩, where |α|² + |β|² = 1. Applying a Hadamard (H) gate transforms |0⟩ into (|0⟩ + |1⟩)/√2, meaning upon measurement you have an exact 50% chance of observing 0 and a 50% chance of observing 1.",
    },
    "flip_qubit": {
        "id": "flip_qubit",
        "title": "Flip the Qubit",
        "short_description": "Transform the initialized state |0⟩ into |1⟩ with 100% certainty.",
        "difficulty": "Beginner",
        "topic": "Quantum Gates",
        "xp": 100,
        "num_qubits": 1,
        "estimated_minutes": 3,
        "available_gates": ["x", "y", "z", "h", "measure"],
        "requirements": [
            "Start with qubit q[0] in ground state |0⟩",
            "Transform the state deterministically into |1⟩",
            "Target probability distribution: P(|1⟩) = 100%"
        ],
        "example_distribution": {
            "|0⟩": 0.0,
            "|1⟩": 1.0
        },
        "starter_circuit": {
            "num_qubits": 1,
            "gates": []
        },
        "goal": "Transform the initial state |0⟩ into |1⟩ with 100% probability using a single quantum gate.",
        "expected_behavior": "Approximately 100% probability of measuring state |1⟩ and 0% for |0⟩.",
        "suggested_concept": "Pauli-X Gate (Quantum NOT)",
        "hints": [
            "Recall the classical NOT gate that inverts bits from 0 to 1. In quantum computing, there is a Pauli gate that performs this exact bit-flip operation.",
            "Look for the Pauli-X gate (marked 'X') in the Operations palette. It rotates the qubit by π radians around the X-axis of the Bloch sphere.",
            "Place an 'X' gate on wire q[0]. This will invert |0⟩ to |1⟩."
        ],
        "concept_explanation": "The Pauli-X gate acts as a quantum bit-flip, analogous to the classical NOT gate. Matrix representation: X = [[0, 1], [1, 0]]. When acting on |0⟩ = [1, 0]ᵀ, it produces X|0⟩ = [0, 1]ᵀ = |1⟩.",
    },
    "bell_state": {
        "id": "bell_state",
        "title": "Build a Bell State",
        "short_description": "Create a maximally entangled two-qubit Bell pair (|00⟩ and |11⟩ ~50% each).",
        "difficulty": "Beginner",
        "topic": "Entanglement",
        "xp": 150,
        "num_qubits": 2,
        "estimated_minutes": 5,
        "available_gates": ["h", "x", "z", "cx", "cz", "measure"],
        "requirements": [
            "Start with two qubits initialized to |00⟩",
            "Create an entangled Bell state (|00⟩ + |11⟩)/√2",
            "Target probability distribution: P(|00⟩) ≈ 50%, P(|11⟩) ≈ 50%, P(|01⟩) = 0%, P(|10⟩) = 0%"
        ],
        "example_distribution": {
            "|00⟩": 0.5,
            "|01⟩": 0.0,
            "|10⟩": 0.0,
            "|11⟩": 0.5
        },
        "starter_circuit": {
            "num_qubits": 2,
            "gates": []
        },
        "goal": "Create an entangled two-qubit Bell state |Φ⁺⟩ = (|00⟩ + |11⟩)/√2 between qubit 0 and qubit 1.",
        "expected_behavior": "Strong equal probability on |00⟩ (~50%) and |11⟩ (~50%), with near 0% on |01⟩ and |10⟩, demonstrating quantum correlation.",
        "suggested_concept": "Hadamard (H) followed by Controlled-NOT (CNOT / CX)",
        "hints": [
            "Start by putting q0 into a superposition. Which gate creates an equal superposition from |0⟩?",
            "Now think about how you could make q1 depend on q0. A controlled two-qubit gate can create this correlation.",
            "Apply an 'H' gate on q[0], then add a 'CNOT (CX)' gate with control on q[0] and target on q[1]."
        ],
        "concept_explanation": "Quantum entanglement occurs when two qubits cannot be described independently of each other. In the Bell state |Φ⁺⟩ = (|00⟩ + |11⟩)/√2, measuring q0 as 0 guarantees q1 is 0, and measuring q0 as 1 guarantees q1 is 1, even if they are physically separated. We create it by first putting q0 in superposition with H (|00⟩ → (|00⟩ + |10⟩)/√2), and then applying CNOT to flip q1 whenever q0 is 1.",
    },
    "ghz_state": {
        "id": "ghz_state",
        "title": "Create a Three-Qubit GHZ State",
        "short_description": "Create a 3-qubit maximally entangled Greenberger–Horne–Zeilinger state.",
        "difficulty": "Intermediate",
        "topic": "Entanglement",
        "xp": 200,
        "num_qubits": 3,
        "estimated_minutes": 6,
        "available_gates": ["h", "x", "z", "cx", "cz", "measure"],
        "requirements": [
            "Start with 3 qubits initialized to |000⟩",
            "Construct a 3-qubit GHZ state (|000⟩ + |111⟩)/√2",
            "Target probability distribution: P(|000⟩) ≈ 50%, P(|111⟩) ≈ 50%"
        ],
        "example_distribution": {
            "|000⟩": 0.5,
            "|111⟩": 0.5
        },
        "starter_circuit": {
            "num_qubits": 3,
            "gates": []
        },
        "goal": "Create a 3-qubit Greenberger–Horne–Zeilinger (GHZ) state |GHZ⟩ = (|000⟩ + |111⟩)/√2.",
        "expected_behavior": "Approximately 50% probability on |000⟩ and 50% on |111⟩, with no probability in any other computational basis states.",
        "suggested_concept": "Hadamard on q0, followed by chained CX gates across q0, q1, and q2",
        "hints": [
            "Similar to creating a 2-qubit Bell state, start by putting the first qubit q0 into superposition with an H gate.",
            "Now entangle q0 with q1 using a CNOT gate. How can you further propagate this entanglement to q2?",
            "Apply an 'H' gate on q[0], then a 'CX' from q[0] to q[1], followed by another 'CX' from q[1] (or q[0]) to q[2]."
        ],
        "concept_explanation": "The GHZ state is a multipartite entangled state across 3 or more qubits: |GHZ⟩ = (|000⟩ + |111⟩)/√2. It exhibits non-local correlations that cannot be explained by any local hidden variable theory, forming the backbone of quantum secret sharing and error correction protocols.",
    },
    "quantum_coin": {
        "id": "quantum_coin",
        "title": "Build a Quantum Coin",
        "short_description": "Generate true hardware randomness using superposition and quantum measurement.",
        "difficulty": "Beginner",
        "topic": "Measurement",
        "xp": 120,
        "num_qubits": 1,
        "estimated_minutes": 4,
        "available_gates": ["h", "x", "measure"],
        "requirements": [
            "Start with single qubit q[0] in state |0⟩",
            "Create an equal superposition and explicitly add a measurement gate",
            "Target probability distribution: P(0) ≈ 50%, P(1) ≈ 50%"
        ],
        "example_distribution": {
            "|0⟩": 0.5,
            "|1⟩": 0.5
        },
        "starter_circuit": {
            "num_qubits": 1,
            "gates": []
        },
        "goal": "Create a true quantum random number generator that yields equal 0/1 outcomes upon measurement.",
        "expected_behavior": "An equal 50/50 probability distribution of 0 and 1, with explicit measurement into the classical register.",
        "suggested_concept": "Hadamard (H) + Measurement (◓)",
        "hints": [
            "A quantum coin needs an equal superposition of heads (|0⟩) and tails (|1⟩), followed by a measurement that collapses the state.",
            "Apply a Hadamard (H) gate to create the equal superposition, and then add a Measurement gate at the end of the wire.",
            "Drag an 'H' gate to step 0 on q[0], and place the 'Measure (◓)' gate after it. Run the simulation to see the shot counts."
        ],
        "concept_explanation": "Unlike pseudorandom algorithms on classical computers, quantum measurement collapse is fundamentally non-deterministic. Placing a qubit in equal superposition with H and measuring it produces true physical randomness.",
    },
    "break_entanglement": {
        "id": "break_entanglement",
        "title": "Break the Entanglement",
        "short_description": "Disentangle a 2-qubit correlated pair back into separable single-qubit states.",
        "difficulty": "Intermediate",
        "topic": "Quantum Reasoning",
        "xp": 180,
        "num_qubits": 2,
        "estimated_minutes": 6,
        "available_gates": ["h", "x", "z", "cx", "cz", "reset", "measure"],
        "requirements": [
            "Start with an entangled Bell pair circuit",
            "Modify or append gates so the two qubits become unentangled and separable",
            "Target state: Product state where individual qubit states are independent"
        ],
        "example_distribution": {
            "|00⟩": 1.0
        },
        "starter_circuit": {
            "num_qubits": 2,
            "gates": [
                {"name": "h", "qubits": [0]},
                {"name": "cx", "qubits": [0, 1]}
            ]
        },
        "goal": "Modify the initial Bell state circuit so the two qubits are no longer entangled and become separable.",
        "expected_behavior": "Individual subsystem purity on both qubits should be r ≈ 1.0 (pure state), or the joint distribution should be separable (P(00)*P(11) ≈ P(01)*P(10)).",
        "suggested_concept": "Reversibility of Unitaries (CX · CX = I, H · H = I), or applying Reset / Disentangling operators",
        "hints": [
            "Entanglement was created by the unitary sequence H then CX. Remember that quantum gates are unitary and reversible.",
            "Try placing another CNOT gate between the two qubits, or apply an operation that decouples the interaction.",
            "If you apply a second CX gate on q0 and q1, CX · CX = I, removing the entanglement. Adding an H gate on q0 after that returns both qubits to |00⟩."
        ],
        "concept_explanation": "Quantum operations are unitary (U†U = I) and therefore completely reversible. Since CNOT is self-inverse (CNOT² = I), applying a second CNOT undoes the entangling interaction, transforming the entangled state back into a product state (|ψ⟩ = |q₀⟩ ⊗ |q₁⟩).",
    },
}

def check_problem_solution(problem_id: str, circuit: CircuitIR, execution: Optional[ExecutionResponse] = None) -> Tuple[bool, str, str, Dict[str, Any]]:
    """
    Evaluates whether the user's circuit satisfies the success criteria of the given problem.
    Returns (passed, feedback, ai_explanation, metrics).
    """
    if problem_id not in PROBLEMS_REGISTRY:
        return False, f"Unknown problem ID '{problem_id}'.", "", {}

    if execution is None:
        try:
            execution = run_circuit_qiskit(circuit, shots=1024, include_statevector=True)
        except Exception as e:
            return False, f"Simulation failed: {str(e)}", "Please check that your circuit is valid.", {}

    probs = execution.probabilities or {}
    gates = circuit.gates or []
    gate_names = [normalize_gate_name(g.name) for g in gates]
    num_qubits = circuit.num_qubits

    # 1. Superposition Problem
    if problem_id == "superposition":
        p0 = probs.get("0", probs.get("00", 0.0))
        p1 = probs.get("1", probs.get("01", 0.0))
        has_h = "h" in gate_names or any(g in ["ry", "rx"] for g in gate_names)
        
        is_balanced = math.isclose(p0, 0.5, abs_tol=0.1) and math.isclose(p1, 0.5, abs_tol=0.1)
        if is_balanced and has_h:
            feedback = "You successfully created an equal quantum superposition on a single qubit!"
            ai_explanation = "Your circuit placed q0 into the state (|0⟩ + |1⟩)/√2. The simulation confirms equal probability distribution (|0⟩: {:.1f}%, |1⟩: {:.1f}%).".format(p0 * 100, p1 * 100)
            return True, feedback, ai_explanation, {"p0": p0, "p1": p1, "actual": {"|0⟩": p0, "|1⟩": p1}, "expected": {"|0⟩": 0.5, "|1⟩": 0.5}}
        elif has_h:
            return False, "Your circuit contains a superposition gate, but other operations altered the probability balance.", "Try removing extra gates and keeping only the Hadamard (H) gate on q[0].", {"p0": p0, "p1": p1, "actual": {"|0⟩": p0, "|1⟩": p1}, "expected": {"|0⟩": 0.5, "|1⟩": 0.5}}
        else:
            return False, "Not quite. The qubit remains in state |0⟩ with 100% probability.", "You need to add a gate that puts the qubit into superposition. Look for the Hadamard (H) gate.", {"p0": p0, "p1": p1, "actual": {"|0⟩": p0, "|1⟩": p1}, "expected": {"|0⟩": 0.5, "|1⟩": 0.5}}

    # 2. Flip Qubit Problem
    elif problem_id == "flip_qubit":
        p1 = probs.get("1", probs.get("01", probs.get("10", 0.0)))
        p0 = probs.get("0", probs.get("00", 0.0))
        has_x = "x" in gate_names
        
        if p1 >= 0.95:
            feedback = "You successfully flipped the qubit from |0⟩ to |1⟩!"
            ai_explanation = "The Pauli-X gate applied a π-radian rotation around the X-axis, successfully inverting the state from |0⟩ to |1⟩ with 100% fidelity."
            return True, feedback, ai_explanation, {"p1": p1, "actual": {"|0⟩": p0, "|1⟩": p1}, "expected": {"|0⟩": 0.0, "|1⟩": 1.0}}
        else:
            return False, f"The qubit was not fully flipped to |1⟩ (Current P(|1⟩) = {p1 * 100:.1f}%).", "Use the Pauli-X gate on wire q[0] to transform |0⟩ into |1⟩.", {"p1": p1, "actual": {"|0⟩": p0, "|1⟩": p1}, "expected": {"|0⟩": 0.0, "|1⟩": 1.0}}

    # 3. Bell State Problem (Hero Problem)
    elif problem_id == "bell_state":
        p00 = probs.get("00", 0.0)
        p11 = probs.get("11", 0.0)
        p01 = probs.get("01", 0.0)
        p10 = probs.get("10", 0.0)
        
        has_h = "h" in gate_names
        has_cx = "cx" in gate_names or "cnot" in gate_names
        
        is_bell = (
            math.isclose(p00, 0.5, abs_tol=0.1) and
            math.isclose(p11, 0.5, abs_tol=0.1) and
            p01 < 0.05 and p10 < 0.05
        )
        
        if is_bell and has_h and has_cx:
            feedback = "🎉 Outstanding! You successfully built the maximally entangled Bell state |Φ⁺⟩!"
            ai_explanation = "Your H gate placed q0 into an equal superposition, and the CX gate entangled q1 with q0. The simulation confirms the characteristic |00⟩ (~{:.1f}%) and |11⟩ (~{:.1f}%) correlation with zero chance of |01⟩ or |10⟩.".format(p00 * 100, p11 * 100)
            return True, feedback, ai_explanation, {"p00": p00, "p11": p11, "p01": p01, "p10": p10, "actual": {"|00⟩": p00, "|01⟩": p01, "|10⟩": p10, "|11⟩": p11}, "expected": {"|00⟩": 0.5, "|01⟩": 0.0, "|10⟩": 0.0, "|11⟩": 0.5}}
        elif has_h and not has_cx:
            return False, "You're creating a superposition on q0, but q0 and q1 are not yet correlated.", "Add a CNOT (CX) gate with q0 as the control and q1 as the target to create entanglement.", {"p00": p00, "p11": p11, "actual": {"|00⟩": p00, "|01⟩": p01, "|10⟩": p10, "|11⟩": p11}, "expected": {"|00⟩": 0.5, "|01⟩": 0.0, "|10⟩": 0.0, "|11⟩": 0.5}}
        elif has_cx and not has_h:
            return False, "You added a CNOT gate, but without superposition on the control qubit, no entanglement is created.", "Place an H gate on q[0] BEFORE the CNOT gate.", {"p00": p00, "p11": p11, "actual": {"|00⟩": p00, "|01⟩": p01, "|10⟩": p10, "|11⟩": p11}, "expected": {"|00⟩": 0.5, "|01⟩": 0.0, "|10⟩": 0.0, "|11⟩": 0.5}}
        else:
            return False, "The circuit does not yet prepare an entangled Bell state.", "To create a Bell state, combine an H gate on q[0] with a CX gate connecting q[0] to q[1].", {"p00": p00, "p11": p11, "actual": {"|00⟩": p00, "|01⟩": p01, "|10⟩": p10, "|11⟩": p11}, "expected": {"|00⟩": 0.5, "|01⟩": 0.0, "|10⟩": 0.0, "|11⟩": 0.5}}

    # 4. GHZ State Problem
    elif problem_id == "ghz_state":
        p000 = probs.get("000", 0.0)
        p111 = probs.get("111", 0.0)
        other_sum = sum(v for k, v in probs.items() if k not in ["000", "111"])
        
        is_ghz = (
            math.isclose(p000, 0.5, abs_tol=0.1) and
            math.isclose(p111, 0.5, abs_tol=0.1) and
            other_sum < 0.05
        )
        
        if is_ghz and num_qubits >= 3:
            feedback = "🎉 Excellent! You successfully created a 3-qubit GHZ state!"
            ai_explanation = "By putting q0 into superposition and chaining CNOT gates across all three qubits, you formed the multipartite entangled state (|000⟩ + |111⟩)/√2."
            return True, feedback, ai_explanation, {"p000": p000, "p111": p111, "other_sum": other_sum, "actual": {"|000⟩": p000, "|111⟩": p111}, "expected": {"|000⟩": 0.5, "|111⟩": 0.5}}
        else:
            return False, f"Circuit did not produce the GHZ state (|000⟩: {p000*100:.1f}%, |111⟩: {p111*100:.1f}%).", "Make sure you have 3 qubits, an H gate on q[0], and CNOT gates chaining q[0]→q[1] and q[1]→q[2].", {"p000": p000, "p111": p111, "actual": {"|000⟩": p000, "|111⟩": p111}, "expected": {"|000⟩": 0.5, "|111⟩": 0.5}}

    # 5. Quantum Coin
    elif problem_id == "quantum_coin":
        p0 = probs.get("0", probs.get("00", 0.0))
        p1 = probs.get("1", probs.get("01", 0.0))
        has_measure = "measure" in gate_names
        has_h = "h" in gate_names
        
        is_5050 = math.isclose(p0, 0.5, abs_tol=0.1) and math.isclose(p1, 0.5, abs_tol=0.1)
        
        if is_5050 and has_measure and has_h:
            feedback = "You successfully built a genuine quantum random coin flipper!"
            ai_explanation = "The H gate placed the qubit into equal superposition, and the explicit Measurement gate collapsed the wave function into 0 or 1 with equal 50% probability."
            return True, feedback, ai_explanation, {"p0": p0, "p1": p1, "actual": {"|0⟩": p0, "|1⟩": p1}, "expected": {"|0⟩": 0.5, "|1⟩": 0.5}}
        elif is_5050 and not has_measure:
            return False, "You created equal probability, but you forgot to add the Measurement (◓) gate to complete the coin flip!", "Add a 'Measure' gate at the end of the wire.", {"p0": p0, "p1": p1, "actual": {"|0⟩": p0, "|1⟩": p1}, "expected": {"|0⟩": 0.5, "|1⟩": 0.5}}
        else:
            return False, "The circuit is not generating an equal random distribution.", "Place an H gate followed by a Measure (◓) gate on wire q[0].", {"p0": p0, "p1": p1, "actual": {"|0⟩": p0, "|1⟩": p1}, "expected": {"|0⟩": 0.5, "|1⟩": 0.5}}

    # 6. Break Entanglement
    elif problem_id == "break_entanglement":
        sv = [complex(a.real, a.imag) for a in (execution.statevector or [])]
        if sv and len(sv) == 4:
            bloch = compute_bloch_vectors(np.array(sv, dtype=complex), num_qubits=2)
            r0 = bloch[0].r
            r1 = bloch[1].r
            is_disentangled = (r0 >= 0.9 and r1 >= 0.9)
        else:
            p00 = probs.get("00", 0.0)
            p11 = probs.get("11", 0.0)
            p01 = probs.get("01", 0.0)
            p10 = probs.get("10", 0.0)
            is_disentangled = not (math.isclose(p00, 0.5, abs_tol=0.1) and math.isclose(p11, 0.5, abs_tol=0.1) and p01 < 0.02 and p10 < 0.02)
        
        if is_disentangled:
            feedback = "🎉 Great job! You successfully broke the entanglement and restored separable states!"
            ai_explanation = "By inverting the entangling unitary operations (or resetting the subsystem), the two qubits are now independent product states with full individual purity."
            return True, feedback, ai_explanation, {"separable": True, "actual": {"Separable State": 1.0}, "expected": {"Separable State": 1.0}}
        else:
            return False, "The qubits are still maximally entangled in the Bell state.", "Try applying a second CNOT gate to cancel the first (since CNOT · CNOT = I), or reset one of the qubits.", {"separable": False, "actual": {"Entangled Bell Pair": 1.0}, "expected": {"Separable State": 1.0}}

    return False, "Evaluation criteria not met.", "Keep experimenting with gates on the canvas.", {}

def generate_problem_hint(problem_id: str, circuit: CircuitIR, hint_level: int = 1) -> str:
    """Provides progressive tier hints based on problem and current circuit state."""
    prob = PROBLEMS_REGISTRY.get(problem_id)
    if not prob:
        return "I'm here to help! What question do you have about quantum circuits?"
    
    hints_list = prob.get("hints", [])
    idx = max(0, min(len(hints_list) - 1, hint_level - 1))
    return hints_list[idx]

def review_problem_circuit(problem_id: str, circuit: CircuitIR, execution: Optional[ExecutionResponse] = None) -> Tuple[str, List[str], List[str]]:
    """
    Generates structured AI review points comparing current circuit against the problem goal.
    Returns (status, positive_points, guidance_points).
    """
    prob = PROBLEMS_REGISTRY.get(problem_id)
    if not prob:
        return "clean", ["Circuit is valid."], ["Ready to simulate."]

    if execution is None:
        try:
            execution = run_circuit_qiskit(circuit, shots=1024, include_statevector=True)
        except Exception:
            pass

    gates = circuit.gates or []
    gate_names = [normalize_gate_name(g.name) for g in gates]
    probs = execution.probabilities if execution else {}

    positives = []
    guidance = []

    if not gates:
        return "warning", [], ["Your circuit is currently empty. Place a gate from the Operations palette to start solving this challenge."]

    if problem_id == "superposition":
        if "h" in gate_names:
            positives.append("You correctly placed a Hadamard (H) gate on the qubit.")
            p0 = probs.get("0", 0.0)
            p1 = probs.get("1", 0.0)
            if math.isclose(p0, 0.5, abs_tol=0.1) and math.isclose(p1, 0.5, abs_tol=0.1):
                positives.append(f"The simulation shows a balanced superposition: |0⟩ ({p0*100:.1f}%), |1⟩ ({p1*100:.1f}%).")
                guidance.append("Your circuit looks ready! Click 'Check Solution' to complete this problem.")
            else:
                guidance.append("Additional gates are shifting the superposition. Try keeping only the H gate.")
        else:
            guidance.append("You have gates placed, but you need a Hadamard (H) gate to create equal superposition.")

    elif problem_id == "bell_state":
        if "h" in gate_names and gate_names[0] == "h":
            positives.append("You correctly put q[0] into equal superposition with the initial H gate.")
        elif "h" in gate_names:
            positives.append("Hadamard gate is present on the circuit.")
        else:
            guidance.append("Missing initial superposition on q[0]. Add an H gate first.")

        has_cx = any(g in ["cx", "cnot"] for g in gate_names)
        if has_cx:
            positives.append("Your CNOT (CX) gate connects the control and target qubits.")
        else:
            guidance.append("Add a CNOT (CX) gate from q[0] to q[1] to entangle the two qubits.")

        p00 = probs.get("00", 0.0)
        p11 = probs.get("11", 0.0)
        if math.isclose(p00, 0.5, abs_tol=0.1) and math.isclose(p11, 0.5, abs_tol=0.1):
            positives.append(f"Simulation confirms Bell correlation: |00⟩ ({p00*100:.1f}%), |11⟩ ({p11*100:.1f}%).")
            guidance.append("Ready to verify! Click 'Check Solution' now.")

    elif problem_id == "flip_qubit":
        if "x" in gate_names:
            positives.append("Pauli-X gate is placed on the wire.")
            p1 = probs.get("1", probs.get("01", 0.0))
            if p1 >= 0.95:
                positives.append(f"Simulation confirms state is 100% |1⟩.")
                guidance.append("Looks complete! Click 'Check Solution' to submit.")
        else:
            guidance.append("Add a Pauli-X gate on q[0] to flip the state |0⟩ into |1⟩.")

    elif problem_id == "ghz_state":
        if "h" in gate_names:
            positives.append("Initial Hadamard gate applied.")
        cx_count = sum(1 for g in gate_names if g in ["cx", "cnot"])
        if cx_count >= 2:
            positives.append(f"Found {cx_count} CNOT gates chaining the 3 qubits.")
        else:
            guidance.append("You need 2 chained CNOT gates (q0→q1 and q1→q2) to entangle all 3 qubits.")

    elif problem_id == "quantum_coin":
        if "h" in gate_names:
            positives.append("Superposition initialized with Hadamard.")
        if "measure" in gate_names:
            positives.append("Measurement operator present on the classical register.")
        else:
            guidance.append("Add the Measure (◓) gate to collapse the superposition into classical bits.")

    elif problem_id == "break_entanglement":
        cx_count = sum(1 for g in gate_names if g in ["cx", "cnot"])
        if cx_count >= 2:
            positives.append("Second CNOT placed, canceling the entangling operation (CX · CX = I).")
        else:
            guidance.append("Try applying an inverse gate sequence to unentangle the qubits.")

    status = "clean" if len(guidance) == 0 or (len(guidance) == 1 and "Check Solution" in guidance[0]) else "warning"
    return status, positives, guidance
