import { Course } from './types';

export const QUANTUM_COURSES: Course[] = [
  {
    id: 'qubits-states',
    number: '01',
    title: 'Qubits & Quantum States',
    code: 'QF-101',
    level: 'Foundations · Level 1',
    category: 'Quantum Foundations',
    description: 'An introductory course exploring the fundamental unit of quantum information, Dirac bra-ket notation, and statevector representations.',
    lessonsCount: 4,
    completedLessonsCount: 4,
    status: 'complete',
    badgeBg: 'bg-[#eef8f2]',
    badgeBorder: 'border-[#bad8cb]',
    badgeText: 'text-[#287854]',
    cardBg: 'bg-[#f6faf8]',
    cardBorder: 'border-[#bad8cb]',
    accentColor: '#287854',
    lessons: [
      {
        id: 'q1',
        courseId: 'qubits-states',
        number: 1,
        title: 'Introduction to Qubits vs Classical Bits',
        subtitle: 'Foundations of Two-Level Quantum Systems',
        duration: '5 min',
        level: 'Foundations · Lesson 1 of 4',
        completed: true,
        conceptHeading: 'Classical Bits vs Quantum Bits',
        conceptBody: [
          'A classical bit represents a single binary value: either 0 or 1. Every digital computer operates by manipulating billions of these discrete switches.',
          'A quantum bit (qubit), by contrast, is a physical two-level quantum system. It can exist in the basis state |0⟩, the basis state |1⟩, or in any continuous linear superposition of both states:',
          '|ψ⟩ = α|0⟩ + β|1⟩',
          'where α and β are complex probability amplitudes satisfying the fundamental normalization condition:',
          '|α|² + |β|² = 1',
        ],
        calloutComparison: {
          leftTitle: 'CLASSICAL BIT',
          leftContent: '0 OR 1\nDeterministic state with definite binary value at all times.',
          rightTitle: 'QUBIT',
          rightContent: 'α|0⟩ + β|1⟩\nContinuous statevector with complex amplitudes and quantum phase.',
        },
        interactiveExample: {
          initialState: '|0⟩',
          description: 'Try applying quantum transformations to the initial state |0⟩ to see how the probability distribution shifts:',
          supportedGates: ['H', 'X', 'Z'],
        },
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[1] q;

// Apply quantum transformation to q[0]
x q[0];
`,
        starterCircuitGates: [{ name: 'x', qubit: 0, step: 0 }],
        availableGates: ['h', 'x', 'z'],
        numQubits: 1,
        challenge: {
          title: 'Prepare State |1⟩ from Ground State |0⟩',
          targetDescription: 'Use a single quantum bit-flip operation to transform the initialized state |0⟩ into excited state |1⟩ with 100% probability.',
          mathTarget: '|ψ⟩ = |1⟩',
          requirements: [
            'Use 1 qubit initialized to |0⟩',
            'Apply the Pauli-X gate to invert the amplitude',
            'Achieve 100% probability of measuring |1⟩',
          ],
          expectedState: '|1⟩',
          expectedProbabilities: { '1': 1.0 },
          xpReward: 100,
        },
        hints: [
          'The Pauli-X gate acts as the quantum NOT operator, flipping |0⟩ to |1⟩.',
          'Place the X gate directly on wire q[0] in the circuit canvas, or write `x q[0];` in the editor.',
        ],
      },
      {
        id: 'q2',
        courseId: 'qubits-states',
        number: 2,
        title: 'Computational Basis States |0⟩ and |1⟩',
        subtitle: 'Orthonormal Vectors in Hilbert Space',
        duration: '7 min',
        level: 'Foundations · Lesson 2 of 4',
        completed: true,
        conceptHeading: 'Dirac Bra-Ket Vector Representation',
        conceptBody: [
          'In Dirac notation, quantum states are written as ket vectors |ψ⟩. The computational basis states correspond to the column vectors:',
          '|0⟩ = [1, 0]ᵀ   and   |1⟩ = [0, 1]ᵀ',
          'These vectors are orthogonal (⟨0|1⟩ = 0) and normalized (⟨0|0⟩ = 1, ⟨1|1⟩ = 1), forming a complete basis for the single-qubit state space.',
        ],
        calloutComparison: {
          leftTitle: 'STATE |0⟩',
          leftContent: 'Vector [1, 0]ᵀ · North Pole on Bloch sphere · 100% probability of outcome 0.',
          rightTitle: 'STATE |1⟩',
          rightContent: 'Vector [0, 1]ᵀ · South Pole on Bloch sphere · 100% probability of outcome 1.',
        },
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[1] q;

// Initialize and explore computational basis
`,
        availableGates: ['x', 'z'],
        numQubits: 1,
        challenge: {
          title: 'Basis State Inversion Challenge',
          targetDescription: 'Apply two successive Pauli-X gates to demonstrate that X² = I (quantum identity).',
          mathTarget: '|ψ⟩ = X · X |0⟩ = |0⟩',
          requirements: [
            'Place two X gates in sequence on wire q[0]',
            'Observe that the state flips to |1⟩ and returns to |0⟩',
            'Verify that P(|0⟩) = 100%',
          ],
          expectedState: '|0⟩',
          expectedProbabilities: { '0': 1.0 },
          xpReward: 100,
        },
        hints: [
          'Because the Pauli-X matrix is its own inverse (unitary and Hermitian), X · X = I.',
          'Add two X gates in steps 0 and 1 on qubit 0.',
        ],
      },
      {
        id: 'q3',
        courseId: 'qubits-states',
        number: 3,
        title: 'Quantum Measurement & State Collapse',
        subtitle: 'The Born Rule and Wavefunction Collapse',
        duration: '8 min',
        level: 'Foundations · Lesson 3 of 4',
        completed: true,
        conceptHeading: 'How Measurement Changes Quantum Systems',
        conceptBody: [
          'Unlike classical systems where observation is non-invasive, measuring a quantum state irreversibly collapses the wavefunction into one of the basis states.',
          'According to the Born Rule, if a qubit is in state |ψ⟩ = α|0⟩ + β|1⟩:',
          'P(0) = |α|²   and   P(1) = |β|²',
          'After measuring outcome 0, the state is strictly |0⟩; subsequent measurements will deterministically return 0.',
        ],
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[1] q;
bit[1] c;

// Create state and measure
h q[0];
c[0] = measure q[0];
`,
        availableGates: ['h', 'x', 'measure'],
        numQubits: 1,
        challenge: {
          title: 'Measure a Superposition State',
          targetDescription: 'Prepare an equal superposition state using an H gate and measure the resulting distribution over 1024 shots.',
          mathTarget: '|ψ⟩ = (|0⟩ + |1⟩)/√2 → 50% |0⟩, 50% |1⟩',
          requirements: [
            'Apply H gate to q[0]',
            'Verify 50% probability on state |0⟩ and 50% on state |1⟩',
          ],
          expectedState: '|+⟩',
          expectedProbabilities: { '0': 0.5, '1': 0.5 },
          xpReward: 100,
        },
        hints: [
          'The Hadamard gate splits the probability evenly between |0⟩ and |1⟩.',
          'Add an H gate on wire q[0] and click Run Simulation.',
        ],
      },
      {
        id: 'q4',
        courseId: 'qubits-states',
        number: 4,
        title: 'Probability Amplitudes & Normalization',
        subtitle: 'Conserving Probability Across Hilbert Space',
        duration: '6 min',
        level: 'Foundations · Lesson 4 of 4',
        completed: true,
        conceptHeading: 'Normalization & Unitary Evolution',
        conceptBody: [
          'In quantum mechanics, all valid state vectors must satisfy |α|² + |β|² = 1 so that total probability equals 100%.',
          'Every quantum gate is a unitary transformation (U†U = I), meaning it preserves vector length and probability normalization during evolution.',
        ],
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[1] q;

h q[0];
`,
        availableGates: ['h', 'x', 'z', 's', 't'],
        numQubits: 1,
        challenge: {
          title: 'Unitary Superposition Challenge',
          targetDescription: 'Confirm unitary normalization by generating an equal superposition with |α|² = 0.5 and |β|² = 0.5.',
          mathTarget: '|α|² + |β|² = 1.0',
          requirements: [
            'Use 1 qubit initialized to |0⟩',
            'Apply Hadamard (H) gate',
            'Verify P(|0⟩) = 50% and P(|1⟩) = 50%',
          ],
          expectedState: '|+⟩',
          expectedProbabilities: { '0': 0.5, '1': 0.5 },
          xpReward: 100,
        },
        hints: ['Hadamard sets α = 1/√2 and β = 1/√2, so |α|² = 1/2 and |β|² = 1/2.'],
      },
    ],
  },
  {
    id: 'superposition',
    number: '02',
    title: 'Superposition',
    code: 'QF-102',
    level: 'Foundations · Level 2',
    category: 'Quantum Foundations',
    description: 'Learn how qubits exist in linear combinations of states simultaneously, and how the Hadamard gate rotates state vectors to the equator.',
    lessonsCount: 5,
    completedLessonsCount: 2,
    status: 'active',
    badgeBg: 'bg-[#fffaf0]',
    badgeBorder: 'border-[#fed7aa]',
    badgeText: 'text-[#c96b2c]',
    cardBg: 'bg-[#fffdfa]',
    cardBorder: 'border-[#f0d1b3]',
    accentColor: '#c96b2c',
    linkedChallengeId: 'superposition',
    lessons: [
      {
        id: 's1',
        courseId: 'superposition',
        number: 1,
        title: 'What is Quantum Superposition?',
        subtitle: 'Linear Combinations and Quantum Interference',
        duration: '6 min',
        level: 'Foundations · Lesson 1 of 5',
        completed: true,
        conceptHeading: 'Superposition is Not Just "0 and 1 Together"',
        conceptBody: [
          'Quantum superposition allows a qubit to be in a linear combination of states |ψ⟩ = α|0⟩ + β|1⟩.',
          'Crucially, amplitudes α and β have phase angles. Unlike classical probability where chances only add, quantum amplitudes can constructively or destructively interfere.',
          'The state |+⟩ = (|0⟩ + |1⟩)/√2 points along the positive X-axis on the Bloch sphere equator.',
        ],
        calloutComparison: {
          leftTitle: 'CLASSICAL PROBABILITY',
          leftContent: 'Probabilities are real positive numbers that only add (no cancellation).',
          rightTitle: 'QUANTUM SUPERPOSITION',
          rightContent: 'Complex amplitudes with phase angles that can cancel out through destructive interference.',
        },
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[1] q;

h q[0];
`,
        availableGates: ['h', 'x', 'z'],
        numQubits: 1,
        challenge: {
          title: 'Create an Equal Superposition State',
          targetDescription: 'Apply the Hadamard gate to transform |0⟩ into the equal superposition state |+⟩ = (|0⟩ + |1⟩)/√2.',
          mathTarget: '|ψ⟩ = (|0⟩ + |1⟩)/√2',
          requirements: [
            'Use 1 qubit initialized to |0⟩',
            'Apply Hadamard (H) gate to wire q[0]',
            'Target probability distribution: P(|0⟩) = 50%, P(|1⟩) = 50%',
          ],
          expectedState: '|+⟩',
          expectedProbabilities: { '0': 0.5, '1': 0.5 },
          xpReward: 100,
        },
        hints: [
          'The Hadamard gate performs a 180° rotation mapping the North pole |0⟩ to the equator |+⟩.',
          'Drag the red [ H ] gate onto wire q[0] or type `h q[0];` in the editor.',
        ],
      },
      {
        id: 's2',
        courseId: 'superposition',
        number: 2,
        title: 'Understanding the |+⟩ and |-⟩ States',
        subtitle: 'The X-Basis Superposition Pair',
        duration: '8 min',
        level: 'Foundations · Lesson 2 of 5',
        completed: true,
        conceptHeading: 'Relative Phase and the |-⟩ State',
        conceptBody: [
          'The two canonical equal superposition states are:',
          '|+⟩ = (|0⟩ + |1⟩)/√2   and   |-⟩ = (|0⟩ - |1⟩)/√2',
          'Both yield identical 50/50 measurement probabilities in the computational Z-basis, but they differ by a relative phase of π (180°).',
          'Applying a Pauli-Z gate to |+⟩ flips the phase, transforming |+⟩ into |-⟩.',
        ],
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[1] q;

h q[0];
z q[0];
`,
        starterCircuitGates: [
          { name: 'h', qubit: 0, step: 0 },
          { name: 'z', qubit: 0, step: 1 },
        ],
        availableGates: ['h', 'x', 'z'],
        numQubits: 1,
        challenge: {
          title: 'Prepare the |-⟩ Minus State',
          targetDescription: 'Prepare state |0⟩, apply Hadamard (H) to create |+⟩, then apply Pauli-Z (Z) to create |-⟩.',
          mathTarget: '|ψ⟩ = (|0⟩ - |1⟩)/√2',
          requirements: [
            'Apply H gate on q[0]',
            'Apply Z gate on q[0] after H',
            'Verify 50% probability distribution with relative phase π',
          ],
          expectedState: '|-⟩',
          expectedProbabilities: { '0': 0.5, '1': 0.5 },
          xpReward: 100,
        },
        hints: [
          'H maps |0⟩ → |+⟩, and Z maps |+⟩ → |-⟩.',
          'Place H at step 0 and Z at step 1 on qubit 0.',
        ],
      },
      {
        id: 's3',
        courseId: 'superposition',
        number: 3,
        title: 'The Hadamard (H) Gate',
        subtitle: 'Unitary Transformation and Invertibility',
        duration: '10 min',
        level: 'Foundations · Lesson 3 of 5',
        completed: false,
        conceptHeading: 'Hadamard is Self-Inverse (H² = I)',
        conceptBody: [
          'Because the Hadamard matrix is Hermitian and unitary, applying H twice returns the qubit to its initial state:',
          'H · H |0⟩ = H |+⟩ = |0⟩',
          'H · H |1⟩ = H |-⟩ = |1⟩',
          'This property is central to quantum interference algorithms like Deutsch-Jozsa and Grover search.',
        ],
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[1] q;

h q[0];
h q[0];
`,
        availableGates: ['h', 'x', 'z'],
        numQubits: 1,
        challenge: {
          title: 'Demonstrate Quantum Interference (H² = I)',
          targetDescription: 'Apply two successive Hadamard gates to put a qubit into superposition and constructively interfere it back to |0⟩.',
          mathTarget: 'H · H |0⟩ = |0⟩',
          requirements: [
            'Apply H on q[0] at step 0',
            'Apply a second H on q[0] at step 1',
            'Confirm 100% probability on state |0⟩',
          ],
          expectedState: '|0⟩',
          expectedProbabilities: { '0': 1.0 },
          xpReward: 100,
        },
        hints: ['Two sequential H gates cancel out by constructive/destructive interference.'],
      },
      {
        id: 's4',
        courseId: 'superposition',
        number: 4,
        title: 'Measuring Superposition in Different Bases',
        subtitle: 'Basis Rotations and Non-Commuting Observables',
        duration: '8 min',
        level: 'Foundations · Lesson 4 of 5',
        completed: false,
        conceptHeading: 'Z-Basis vs X-Basis Measurements',
        conceptBody: [
          'Measuring |+⟩ in the computational Z basis gives random 0 or 1 with 50% probability.',
          'However, applying an H gate before measurement rotates the X basis to the Z basis, revealing that |+⟩ is a deterministic eigenstate!',
        ],
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[1] q;

h q[0];
h q[0];
`,
        availableGates: ['h', 'x', 'z'],
        numQubits: 1,
        challenge: {
          title: 'X-Basis Rotation Challenge',
          targetDescription: 'Rotate the state |+⟩ back into the computational basis to measure outcome |0⟩ deterministically.',
          mathTarget: '|ψ⟩ = H |+⟩ = |0⟩',
          requirements: ['Place two H gates in series', 'Achieve 100% probability of |0⟩'],
          expectedState: '|0⟩',
          expectedProbabilities: { '0': 1.0 },
          xpReward: 100,
        },
        hints: ['H transforms |+⟩ into |0⟩ with 100% certainty.'],
      },
      {
        id: 's5',
        courseId: 'superposition',
        number: 5,
        title: '⚡ Challenge: Create a Superposition',
        subtitle: 'Hands-on Interactive Challenge',
        duration: '5 min',
        level: 'Foundations · Lesson 5 of 5',
        completed: false,
        conceptHeading: 'Capstone Superposition Challenge',
        conceptBody: [
          'Put all your understanding into practice by creating an equal superposition state from ground state |0⟩.',
        ],
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[1] q;

h q[0];
`,
        availableGates: ['h', 'x', 'z'],
        numQubits: 1,
        challenge: {
          title: 'Superposition Master Challenge',
          targetDescription: 'Create state (|0⟩ + |1⟩)/√2 on wire q[0].',
          mathTarget: '|ψ⟩ = (|0⟩ + |1⟩)/√2',
          requirements: ['Use single qubit', 'Achieve 50% |0⟩ and 50% |1⟩'],
          expectedState: '|+⟩',
          expectedProbabilities: { '0': 0.5, '1': 0.5 },
          xpReward: 150,
        },
        hints: ['Place an H gate on wire q[0].'],
      },
    ],
  },
  {
    id: 'quantum-gates',
    number: '03',
    title: 'Quantum Gates',
    code: 'QF-103',
    level: 'Foundations · Level 2',
    category: 'Quantum Foundations',
    description: 'Explore single-qubit unitary operators including Pauli-X bit flip, Pauli-Z phase flip, S/T phase rotations, and continuous Bloch rotations.',
    lessonsCount: 7,
    completedLessonsCount: 0,
    status: 'open',
    badgeBg: 'bg-[#f0f9ff]',
    badgeBorder: 'border-[#bae6fd]',
    badgeText: 'text-[#0284c7]',
    cardBg: 'bg-[#fbfdff]',
    cardBorder: 'border-[#bae6fd]',
    accentColor: '#0284c7',
    linkedChallengeId: 'flip_qubit',
    lessons: [
      {
        id: 'g1',
        courseId: 'quantum-gates',
        number: 1,
        title: 'The Pauli-X Gate (Quantum NOT)',
        subtitle: 'Bit Flip Operations Across the X-Axis',
        duration: '5 min',
        level: 'Foundations · Lesson 1 of 7',
        completed: false,
        conceptHeading: 'Pauli-X Rotations on the Bloch Sphere',
        conceptBody: [
          'The Pauli-X gate applies a π (180°) rotation around the X-axis of the Bloch sphere.',
          'It maps |0⟩ → |1⟩ and |1⟩ → |0⟩, exactly mirroring the classical NOT operation.',
        ],
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[1] q;

x q[0];
`,
        availableGates: ['x', 'y', 'z', 'h'],
        numQubits: 1,
        challenge: {
          title: 'Flip the Qubit to State |1⟩',
          targetDescription: 'Use a single Pauli-X gate to invert |0⟩ into |1⟩.',
          mathTarget: '|ψ⟩ = X |0⟩ = |1⟩',
          requirements: ['Place X gate on q[0]', 'Measure 100% |1⟩ probability'],
          expectedState: '|1⟩',
          expectedProbabilities: { '1': 1.0 },
          xpReward: 100,
        },
        hints: ['Add an X gate on q[0].'],
      },
    ],
  },
  {
    id: 'entanglement',
    number: '04',
    title: 'Entanglement',
    code: 'QF-104',
    level: 'Foundations · Level 3',
    category: 'Quantum Foundations',
    description: 'Discover the phenomenon of quantum non-locality, two-qubit tensor product spaces, the Controlled-NOT gate, and the four Bell states.',
    lessonsCount: 5,
    completedLessonsCount: 0,
    status: 'locked',
    badgeBg: 'bg-[#faf5ff]',
    badgeBorder: 'border-[#e9d5ff]',
    badgeText: 'text-[#9333ea]',
    cardBg: 'bg-[#fdfcff]',
    cardBorder: 'border-[#e9d5ff]',
    accentColor: '#9333ea',
    linkedChallengeId: 'bell_state',
    lessons: [
      {
        id: 'e1',
        courseId: 'entanglement',
        number: 1,
        title: 'Two-Qubit State Space & Tensor Products',
        subtitle: 'Combining Multiple Quantum Subsystems',
        duration: '8 min',
        level: 'Foundations · Lesson 1 of 5',
        completed: false,
        conceptHeading: 'Tensor Products & 4-Dimensional State Space',
        conceptBody: [
          'A two-qubit state exists in a 4-dimensional Hilbert space spanned by |00⟩, |01⟩, |10⟩, and |11⟩.',
          'When qubits become entangled, the state cannot be factored into the product of individual single-qubit states |ψ⟩ ≠ |q0⟩ ⊗ |q1⟩.',
        ],
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[2] q;

h q[0];
cx q[0], q[1];
`,
        availableGates: ['h', 'x', 'cx', 'cz'],
        numQubits: 2,
        challenge: {
          title: 'Create the Bell State |Φ⁺⟩',
          targetDescription: 'Prepare state |00⟩, apply H to q[0], and entangle q[1] with CNOT.',
          mathTarget: '|Φ⁺⟩ = (|00⟩ + |11⟩)/√2',
          requirements: [
            'Use 2 qubits',
            'Apply H on q[0] and CNOT from q[0] to q[1]',
            'Verify 50% |00⟩ and 50% |11⟩',
          ],
          expectedState: '|Φ⁺⟩',
          expectedProbabilities: { '00': 0.5, '11': 0.5 },
          xpReward: 150,
        },
        hints: ['H on q[0] creates superposition, then CX(q[0], q[1]) entangles q[1] with q[0].'],
      },
    ],
  },
  {
    id: 'circuits',
    number: '05',
    title: 'Quantum Circuits',
    code: 'QF-105',
    level: 'Foundations · Level 3',
    category: 'Quantum Foundations',
    description: 'Master circuit composition, timeline step ordering, circuit depth optimization, and translating between graphical diagrams and OpenQASM 3.0.',
    lessonsCount: 5,
    completedLessonsCount: 0,
    status: 'locked',
    badgeBg: 'bg-[#f5f3ff]',
    badgeBorder: 'border-[#ddd6fe]',
    badgeText: 'text-[#7c3aed]',
    cardBg: 'bg-[#fcfbfe]',
    cardBorder: 'border-[#ddd6fe]',
    accentColor: '#7c3aed',
    lessons: [],
  },
  {
    id: 'algorithms',
    number: '06',
    title: 'Quantum Algorithms',
    code: 'QF-106',
    level: 'Advanced · Level 4',
    category: 'Quantum Foundations',
    description: 'Explore quantum speedups through phase kickback, quantum interference, Deutsch-Jozsa oracle evaluation, and Grover search.',
    lessonsCount: 5,
    completedLessonsCount: 0,
    status: 'locked',
    badgeBg: 'bg-[#fef2f2]',
    badgeBorder: 'border-[#fecaca]',
    badgeText: 'text-[#dc2626]',
    cardBg: 'bg-[#fffbfb]',
    cardBorder: 'border-[#fecaca]',
    accentColor: '#dc2626',
    lessons: [],
  },
  {
    id: 'optimization',
    number: '07',
    title: 'Quantum Optimization & QAOA',
    code: 'QF-107',
    level: 'Advanced · Level 4',
    category: 'Quantum Foundations',
    description: 'Near-term hybrid quantum-classical algorithms including QAOA, VQE, and quantum-inspired optimization for combinatorial problems.',
    lessonsCount: 4,
    completedLessonsCount: 0,
    status: 'locked',
    badgeBg: 'bg-[#fdf4ff]',
    badgeBorder: 'border-[#f5d0fe]',
    badgeText: 'text-[#c026d3]',
    cardBg: 'bg-[#fefcff]',
    cardBorder: 'border-[#f5d0fe]',
    accentColor: '#c026d3',
    lessons: [],
  },
];
