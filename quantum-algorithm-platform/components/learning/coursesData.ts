import { Course } from './types';

export const QUANTUM_COURSES: Course[] = [
  {
    id: 'course-zero-interactive',
    number: '00',
    title: 'From Bit to H Gate',
    code: 'QF-100',
    level: 'Foundations · Level 0',
    category: 'Quantum Foundations',
    description: 'Master classical bits, Dirac ket notation, superposition, wavefunction collapse, and the Hadamard self-inverse reversal with live Aer simulation.',
    lessonsCount: 13,
    completedLessonsCount: 0,
    status: 'open',
    badgeBg: 'bg-[#fff4e6]',
    badgeBorder: 'border-[#fed7aa]',
    badgeText: 'text-[#c96b2c]',
    cardBg: 'bg-[#fffaf0]',
    cardBorder: 'border-[#fed7aa]',
    accentColor: '#c96b2c',
    lessons: [
      {
        id: 'c0_m1',
        courseId: 'course-zero-interactive',
        number: 1,
        title: 'What is Quantum Computing?',
        subtitle: 'Classical vs Quantum Information',
        duration: '5 min',
        level: 'Module 1 of 13',
        completed: false,
        conceptHeading: 'What is Quantum Computing?',
        conceptBody: ['Introduction to qubits, physical quantum states, and superposition.'],
        starterQasm: 'OPENQASM 3.0;\ninclude "stdgates.inc";\nqubit[1] q;\n',
        starterCircuitGates: [],
        availableGates: ['h', 'x'],
        numQubits: 1,
        challenge: {
          title: 'Explore Qubit State Space',
          targetDescription: 'Explore the quantum state equation |ψ⟩ = α|0⟩ + β|1⟩.',
          mathTarget: '|ψ⟩ = |0⟩',
          requirements: ['Understand qubit superposition'],
          expectedState: '|0⟩',
          expectedProbabilities: { '0': 1.0 },
          xpReward: 25,
        },
        hints: ['Click on any term to unpack its definition.'],
      }
    ],
  },
  {
    id: 'qubits-states',
    number: '01',
    title: 'Qubits & Quantum States',
    code: 'QF-101',
    level: 'Foundations · Level 1',
    category: 'Quantum Foundations',
    description: 'An introductory course exploring the fundamental unit of quantum information, Dirac bra-ket notation, and statevector representations.',
    lessonsCount: 13,
    completedLessonsCount: 0,
    status: 'open',
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
        level: 'Foundations · Lesson 1 of 13',
        completed: false,
        conceptHeading: 'Classical Bits vs Quantum Bits',
        conceptBody: [
          'A classical bit represents a single binary value: either 0 or 1. Every digital computer operates by manipulating billions of these discrete switches.',
          'A quantum bit (qubit), by contrast, is a physical two-level quantum system. It can exist in the basis state |0⟩, the basis state |1⟩, or in any continuous linear superposition of both states:',
          '|ψ⟩ = α|0⟩ + β|1⟩',
          'where α and β are complex probability amplitudes satisfying the fundamental normalization condition:',
          '|α|² + |β|² = 1',
          'Think of it like a coin spinning in the air — while spinning, it is neither heads nor tails, but a blend of both possibilities. Only when it lands (measurement) does it commit to one outcome.',
        ],
        keyInsight: 'A qubit is NOT randomly switching between 0 and 1. It exists in a definite, continuous mathematical state — a precise point on the Bloch sphere — until the moment of measurement.',
        realWorldApplication: 'IBM Quantum and Google Sycamore use superconducting transmon qubits cooled to 15 millikelvin (-273.135°C) to maintain quantum coherence for microseconds.',
        historicalNote: 'The term "qubit" was coined by Benjamin Schumacher in 1995 in his foundational paper on quantum data compression.',
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
        title: 'Classical Bits & Multi-Bit Combinations',
        subtitle: 'Exponential Scaling of Hilbert Spaces',
        duration: '6 min',
        level: 'Foundations · Lesson 2 of 13',
        completed: false,
        conceptHeading: 'Binary Scaling & Quantum Registers',
        conceptBody: [
          'The word bit is short for binary digit. With n classical bits, a system can be in exactly one of 2ⁿ distinct states at any given moment.',
          'For 3 classical bits, there are 2³ = 8 possible bitstrings: 000, 001, 010, 011, 100, 101, 110, 111.',
          'In a quantum computer, an n-qubit quantum register can exist in a superposition of all 2ⁿ states simultaneously, described by 2ⁿ complex amplitudes.',
          'This is called quantum parallelism: with just 300 qubits in superposition, the number of simultaneously represented states (2³⁰⁰) exceeds the number of atoms in the observable universe!',
        ],
        keyInsight: 'Classical computers process one state at a time. Quantum computers explore all 2ⁿ states simultaneously through superposition — but you can only extract one answer per measurement.',
        historicalNote: 'Richard Feynman first proposed quantum computers in 1982 at MIT, arguing that simulating quantum physics requires a quantum mechanical computer.',
        calloutComparison: {
          leftTitle: 'CLASSICAL 3-BIT REGISTER',
          leftContent: '1 of 8 states\nStores exactly one integer from 0 to 7 at any given point in time.',
          rightTitle: 'QUANTUM 3-QUBIT REGISTER',
          rightContent: 'All 8 basis states\nSimultaneously stores a superposition of all 8 computational states with phase.',
        },
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[1] q;

// Flip qubit 0
x q[0];
`,
        starterCircuitGates: [{ name: 'x', qubit: 0, step: 0 }],
        availableGates: ['x', 'h'],
        numQubits: 1,
        challenge: {
          title: 'Create Your First Superposition',
          targetDescription: 'Apply a Hadamard gate to create an equal superposition of |0⟩ and |1⟩.',
          mathTarget: '|ψ⟩ = (|0⟩ + |1⟩)/√2',
          requirements: [
            'Place 1 Hadamard (H) gate on wire q[0]',
            'Verify that outcome 0 and 1 each have ~50% probability',
          ],
          expectedState: '|+⟩',
          expectedProbabilities: { '0': 0.5, '1': 0.5 },
          xpReward: 100,
        },
        hints: [
          'Replace the X gate with an H gate on wire q[0] to create superposition.',
        ],
      },
      {
        id: 'q3',
        courseId: 'qubits-states',
        number: 3,
        title: 'Computational Basis States |0⟩ and |1⟩',
        subtitle: 'Orthonormal Vectors in Hilbert Space',
        duration: '7 min',
        level: 'Foundations · Lesson 3 of 13',
        completed: false,
        conceptHeading: 'Dirac Bra-Ket Vector Representation',
        conceptBody: [
          'In Dirac notation, quantum states are written as ket vectors |ψ⟩. The computational basis states correspond to the column vectors:',
          '|0⟩ = [1, 0]ᵀ   and   |1⟩ = [0, 1]ᵀ',
          'These vectors are orthogonal (⟨0|1⟩ = 0) and normalized (⟨0|0⟩ = 1, ⟨1|1⟩ = 1), forming a complete orthonormal basis for single-qubit Hilbert space.',
          'The inner product ⟨ψ|φ⟩ gives the overlap between two quantum states. Orthogonality (⟨0|1⟩ = 0) means |0⟩ and |1⟩ are completely distinguishable — like two perfectly perpendicular arrows in space.',
        ],
        keyInsight: 'Orthonormality is the bedrock of quantum measurement: the probability of "confusing" |0⟩ with |1⟩ is exactly zero because their inner product vanishes.',
        historicalNote: 'Paul Dirac introduced this elegant "bra-ket" notation in 1939 in his textbook "The Principles of Quantum Mechanics", revolutionizing how physicists write quantum equations.',
        illustrationUrl: '/images/lessons/bloch_sphere.jpg',
        illustrationCaption: 'Bloch Sphere: Geometric representation of a single qubit with basis states |0⟩ and |1⟩ at the poles and superposition states |+⟩ and |−⟩ on the equator.',
        showBlochSphere: true,
        predictionCheckpoint: {
          question: 'What is the inner product ⟨0|1⟩ between orthogonal basis states |0⟩ and |1⟩?',
          options: ['1.0 (Identical states)', '0.0 (Zero probability of confusion)', '0.5 (Equal superposition)', '-1.0 (Phase inverted)'],
          correctIndex: 1,
          explanation: 'Orthogonal basis states have an inner product of exactly 0.0, meaning measurement in the standard basis can never confuse a 0 with a 1.'
        },
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
x q[0];
x q[0];
`,
        starterCircuitGates: [
          { name: 'x', qubit: 0, step: 0 },
          { name: 'x', qubit: 0, step: 1 },
        ],
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
        id: 'q4',
        courseId: 'qubits-states',
        number: 4,
        title: 'What Exactly is a Qubit? (Physical & State)',
        subtitle: 'Physical Implementations & Realizations',
        duration: '6 min',
        level: 'Foundations · Lesson 4 of 13',
        completed: false,
        conceptHeading: 'Physical Hardware Realizations',
        conceptBody: [
          'A qubit is an abstract mathematical concept realized using real physical quantum phenomena:',
          '• Superconducting Circuits (Transmons using Josephson junctions) — Used by IBM, Google, and Rigetti. Operate at 15 millikelvin inside dilution refrigerators.',
          '• Trapped Ion Systems (Laser-cooled ions held by electromagnetic traps) — Used by IonQ and Quantinuum. Offer the highest gate fidelities (>99.9%).',
          '• Photonic Waveguides (Single photons and polarization states) — Used by Xanadu and PsiQuantum. Operate at room temperature.',
          '• Semiconductor Spin Qubits (Electron spins trapped in silicon quantum dots) — Used by Intel. Leverage existing semiconductor fabrication technology.',
          '• Neutral Atom Arrays (Laser-trapped atoms in optical tweezers) — Used by QuEra and Pasqal. Scale to hundreds of qubits in 2D arrays.',
        ],
        keyInsight: 'The mathematical qubit |ψ⟩ = α|0⟩ + β|1⟩ is hardware-agnostic: the same quantum algorithm runs identically whether implemented on trapped ions, superconductors, or photons.',
        realWorldApplication: 'Google\'s Willow chip (2024) demonstrated quantum error correction below threshold with 105 superconducting qubits, achieving computational results that would take a classical supercomputer 10 septillion years.',
        calloutComparison: {
          leftTitle: 'PHYSICAL HARDWARE',
          leftContent: 'Microwave pulses, laser beams, magnetic traps, and cryostats operating near 15 millikelvin.',
          rightTitle: 'LOGICAL ABSTRACTION',
          rightContent: 'Statevector |ψ⟩ in complex 2-dimensional vector space, manipulated via unitary gate matrices.',
        },
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[1] q;

x q[0];
z q[0];
`,
        starterCircuitGates: [
          { name: 'x', qubit: 0, step: 0 },
          { name: 'z', qubit: 0, step: 1 },
        ],
        availableGates: ['x', 'z', 'h'],
        numQubits: 1,
        challenge: {
          title: 'Statevector Phase Manipulation',
          targetDescription: 'Prepare excited state |1⟩ and apply a Pauli-Z gate to introduce a negative phase factor.',
          mathTarget: '|ψ⟩ = Z|1⟩ = -|1⟩',
          requirements: [
            'Place Pauli-X gate on wire q[0]',
            'Follow with Pauli-Z gate on wire q[0]',
            'Verify that measurement probability remains 100% |1⟩',
          ],
          expectedState: '|1⟩',
          expectedProbabilities: { '1': 1.0 },
          xpReward: 100,
        },
        hints: [
          'The Z gate maps |0⟩ -> |0⟩ and |1⟩ -> -|1⟩.',
        ],
      },
      {
        id: 'q5',
        courseId: 'qubits-states',
        number: 5,
        title: 'Probability Amplitudes & Normalization',
        subtitle: 'The Born Rule and Unitary Conservation',
        duration: '7 min',
        level: 'Foundations · Lesson 5 of 13',
        completed: false,
        conceptHeading: 'Normalization Axiom: |α|² + |β|² = 1',
        conceptBody: [
          'In quantum state |ψ⟩ = α|0⟩ + β|1⟩, α and β are complex probability amplitudes.',
          'According to the Born rule (formulated by Max Born in 1926), the probability of measuring basis state |0⟩ is P(0) = |α|², and the probability of measuring |1⟩ is P(1) = |β|².',
          'Because the total probability of all mutually exclusive measurement outcomes must sum to 100%, quantum states must always obey the normalization condition: |α|² + |β|² = 1.',
          'Critical distinction: Amplitudes (α, β) are complex numbers that can be negative or imaginary, enabling wave-like interference. Probabilities (P) are always real, non-negative numbers.',
        ],
        keyInsight: 'Amplitudes are the "hidden layer" of quantum mechanics. Two states can have identical measurement probabilities (50/50) yet behave completely differently in algorithms because their amplitudes have different phases.',
        historicalNote: 'Max Born received the 1954 Nobel Prize in Physics for his probabilistic interpretation of the wavefunction — the Born Rule is arguably the most experimentally verified equation in all of physics.',
        calloutComparison: {
          leftTitle: 'AMPLITUDE (α, β)',
          leftContent: 'Complex numbers with phase\nCan be positive, negative, or imaginary, enabling wave interference.',
          rightTitle: 'PROBABILITY (P(0), P(1))',
          rightContent: 'Real numbers between 0 and 1\nAlways strictly non-negative and sum to exactly 1.0 (100%).',
        },
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[1] q;

h q[0];
`,
        starterCircuitGates: [{ name: 'h', qubit: 0, step: 0 }],
        availableGates: ['h', 'x'],
        numQubits: 1,
        challenge: {
          title: 'Prepare Equal Probability Amplitudes',
          targetDescription: 'Apply a Hadamard gate to prepare state |+⟩ with α = 1/√2 and β = 1/√2.',
          mathTarget: '|ψ⟩ = (1/√2)|0⟩ + (1/√2)|1⟩',
          requirements: [
            'Apply Hadamard (H) gate to wire q[0]',
            'Verify P(0) = 50% and P(1) = 50%',
            'Verify normalization |1/√2|² + |1/√2|² = 1.0',
          ],
          expectedState: '|+⟩',
          expectedProbabilities: { '0': 0.5, '1': 0.5 },
          xpReward: 100,
        },
        hints: [
          'A single Hadamard gate on |0⟩ creates the equal superposition state |+⟩.',
        ],
      },
      {
        id: 'q6',
        courseId: 'qubits-states',
        number: 6,
        title: 'Quantum Measurement & Wavefunction Collapse',
        subtitle: 'From Continuous Statevector to Definite Bit',
        duration: '8 min',
        level: 'Foundations · Lesson 6 of 13',
        completed: false,
        conceptHeading: 'Projective Measurement in Computational Basis',
        conceptBody: [
          'A quantum state before measurement can exist as a continuous linear combination α|0⟩ + β|1⟩.',
          'However, when a measurement in the computational basis occurs, the wavefunction collapses irreversibly to one definite eigenvalue: either classical 0 or classical 1.',
          'Repeated runs (shots) on quantum hardware reveal the statistical probability distribution P(0) = |α|² and P(1) = |β|².',
          'This collapse is truly random — even with perfect knowledge of the quantum state, the individual outcome of each shot is fundamentally unpredictable. Only the statistical distribution is determined by the wavefunction.',
        ],
        keyInsight: 'Measurement is irreversible and destructive: it permanently destroys the superposition. This is why quantum algorithms must extract useful information through clever interference BEFORE measuring.',
        realWorldApplication: 'Quantum key distribution (QKD) exploits wavefunction collapse for security: any eavesdropper measuring a quantum channel disturbs the state, alerting the communicating parties.',
        calloutComparison: {
          leftTitle: 'PRE-MEASUREMENT',
          leftContent: 'Continuous statevector\nPreserves quantum phase and coherent amplitude information.',
          rightTitle: 'POST-MEASUREMENT',
          rightContent: 'Collapsed classical bit\nIrreversibly becomes either definite 0 or 1 with zero phase remaining.',
        },
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[1] q;

x q[0];
`,
        starterCircuitGates: [{ name: 'x', qubit: 0, step: 0 }],
        availableGates: ['x', 'h'],
        numQubits: 1,
        challenge: {
          title: 'Deterministic Measurement Collapse',
          targetDescription: 'Prepare state |1⟩ so that projective measurement collapses to outcome 1 with 100% certainty.',
          mathTarget: '|ψ⟩ = |1⟩ ⟹ P(1) = 1.0',
          requirements: [
            'Place 1 Pauli-X gate on wire q[0]',
            'Verify that measurement yields outcome 1 with 100% certainty',
          ],
          expectedState: '|1⟩',
          expectedProbabilities: { '1': 1.0 },
          xpReward: 100,
        },
        hints: [
          'Starting from |0⟩, applying X flips the statevector to |1⟩.',
        ],
      },
      {
        id: 'q7',
        courseId: 'qubits-states',
        number: 7,
        title: 'Superposition & The Plus State (|+⟩)',
        subtitle: 'The Core Building Block of Quantum Algorithms',
        duration: '8 min',
        level: 'Foundations · Lesson 7 of 13',
        completed: false,
        conceptHeading: 'The Canonical Plus State (|+⟩)',
        conceptBody: [
          'The plus state |+⟩ is the most fundamental equal superposition in quantum information science:',
          '|+⟩ = (|0⟩ + |1⟩) / √2',
          'Here, α = 1/√2 and β = 1/√2. Measuring in the computational basis produces outcome 0 with 50% probability and outcome 1 with 50% probability.',
          'The |+⟩ state is the starting point for nearly every quantum algorithm: Grover\'s search, Shor\'s factoring, and the Deutsch-Jozsa algorithm all begin by placing qubits into |+⟩.',
        ],
        keyInsight: '|+⟩ is NOT the same as "50% chance of being |0⟩ and 50% chance of being |1⟩" (that would be a classical mixed state). It is a coherent quantum superposition where both outcomes coexist simultaneously with well-defined phase.',
        calloutComparison: {
          leftTitle: 'COMPUTATIONAL BASIS',
          leftContent: '|0⟩ and |1⟩\nZ-axis eigenstates on the Bloch sphere with definite discrete values.',
          rightTitle: 'HADAMARD BASIS',
          rightContent: '|+⟩ and |−⟩\nX-axis eigenstates with equal 50/50 measurement distribution in Z.',
        },
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[1] q;

h q[0];
`,
        starterCircuitGates: [{ name: 'h', qubit: 0, step: 0 }],
        availableGates: ['h', 'x', 'z'],
        numQubits: 1,
        challenge: {
          title: 'Synthesize the Canonical |+⟩ State',
          targetDescription: 'Use a Hadamard transformation to produce state |+⟩ from ground state |0⟩.',
          mathTarget: '|ψ⟩ = |+⟩ = (|0⟩ + |1⟩)/√2',
          requirements: [
            'Place Hadamard (H) gate on wire q[0]',
            'Verify 50% P(0) and 50% P(1)',
          ],
          expectedState: '|+⟩',
          expectedProbabilities: { '0': 0.5, '1': 0.5 },
          xpReward: 100,
        },
        hints: [
          'Place gate [ H ] on step 0 of wire q[0].',
        ],
      },
      {
        id: 'q8',
        courseId: 'qubits-states',
        number: 8,
        title: 'Quantum Gates: Reversibility & Unitary Evolution',
        subtitle: 'Conservation of Quantum Information (U†U = I)',
        duration: '7 min',
        level: 'Foundations · Lesson 8 of 13',
        completed: false,
        conceptHeading: 'Unitary Matrices & Information Conservation',
        conceptBody: [
          'Unlike classical digital logic gates (AND, OR) which discard bits and dissipate heat, quantum logic gates are always unitary operators U:',
          'U† · U = U · U† = I',
          'This condition ensures that quantum evolution is completely reversible and preserves total probability |α|² + |β|² = 1.',
        ],
        calloutComparison: {
          leftTitle: 'CLASSICAL LOGIC GATE',
          leftContent: 'Irreversible\n2 inputs produce 1 output, permanently discarding information.',
          rightTitle: 'QUANTUM UNITARY GATE',
          rightContent: 'Reversible\nAlways bijective mapping that can be undone by applying conjugate transpose U†.',
        },
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[1] q;

x q[0];
x q[0];
`,
        starterCircuitGates: [
          { name: 'x', qubit: 0, step: 0 },
          { name: 'x', qubit: 0, step: 1 },
        ],
        availableGates: ['x', 'h'],
        numQubits: 1,
        challenge: {
          title: 'Demonstrate Unitary Reversibility Cycle',
          targetDescription: 'Apply two successive Pauli-X gates to prove that X is its own unitary inverse (X† = X and X² = I).',
          mathTarget: '|ψ⟩ = X · X |0⟩ = |0⟩',
          requirements: [
            'Place two X gates in series on wire q[0]',
            'Verify that initial state |0⟩ is restored with 100% fidelity',
          ],
          expectedState: '|0⟩',
          expectedProbabilities: { '0': 1.0 },
          xpReward: 100,
        },
        hints: [
          'X * X = I restores |0⟩.',
        ],
      },
      {
        id: 'q9',
        courseId: 'qubits-states',
        number: 9,
        title: 'The Hadamard Gate (Matrix & Relative Phase)',
        subtitle: 'The 2x2 Unitary Matrix and Relative Phase Factor',
        duration: '8 min',
        level: 'Foundations · Lesson 9 of 13',
        completed: false,
        conceptHeading: 'The Hadamard Matrix & Phase Factor e^(iπ) = -1',
        conceptBody: [
          'The Hadamard gate matrix is defined as:',
          'H = (1/√2) [ 1   1 ] \n             [ 1  -1 ]',
          'Acting on |0⟩: H|0⟩ = (|0⟩ + |1⟩)/√2 = |+⟩ (In-phase, +1).',
          'Acting on |1⟩: H|1⟩ = (|0⟩ - |1⟩)/√2 = |−⟩ (Out-of-phase, -1).',
          'Both |+⟩ and |−⟩ have 50/50 measurement probabilities in computational basis, but differ by a relative phase factor e^(iπ) = -1.',
          'Think of |+⟩ and |−⟩ like two tuning forks vibrating at the same frequency: they produce identical sounds (same probabilities), but one is half a wavelength behind the other (opposite phase). When combined, they either amplify or cancel!',
        ],
        keyInsight: 'The Hadamard gate is the quantum "beam splitter": it converts certainty into quantum possibility (and back again). This is NOT randomness — it is a precise, deterministic rotation of the statevector in Hilbert space.',
        calloutComparison: {
          leftTitle: 'STATE |+⟩',
          leftContent: 'In-Phase\nAmplitudes (+1/√2, +1/√2) point along +X axis on Bloch equator.',
          rightTitle: 'STATE |−⟩',
          rightContent: 'Out-of-Phase\nAmplitudes (+1/√2, -1/√2) point along -X axis due to negative sign.',
        },
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[1] q;

x q[0];
h q[0];
`,
        starterCircuitGates: [
          { name: 'x', qubit: 0, step: 0 },
          { name: 'h', qubit: 0, step: 1 },
        ],
        availableGates: ['h', 'x', 'z'],
        numQubits: 1,
        challenge: {
          title: 'Synthesize the Minus State (|−⟩)',
          targetDescription: 'Prepare excited state |1⟩ with an X gate, then apply Hadamard to generate |−⟩.',
          mathTarget: '|ψ⟩ = H|1⟩ = |−⟩ = (|0⟩ - |1⟩)/√2',
          requirements: [
            'Apply Pauli-X to flip |0⟩ to |1⟩',
            'Apply Hadamard (H) to transform |1⟩ into |−⟩',
            'Verify 50% P(0) and 50% P(1)',
          ],
          expectedState: '|−⟩',
          expectedProbabilities: { '0': 0.5, '1': 0.5 },
          xpReward: 100,
        },
        hints: [
          'First place [ X ] to reach |1⟩, then place [ H ] to create |−⟩.',
        ],
      },
      {
        id: 'q10',
        courseId: 'qubits-states',
        number: 10,
        title: 'H Gate Simulator & Statistics',
        subtitle: 'Sampling Noise and Binomial Convergence',
        duration: '7 min',
        level: 'Foundations · Lesson 10 of 13',
        completed: false,
        conceptHeading: 'Finite Sampling Variance (Shot Noise)',
        conceptBody: [
          'Real quantum processors cannot directly output the mathematical probability equations. Instead, they execute discrete projective measurement runs called shots.',
          'For N = 100 shots on a 50/50 state, measuring 48 zeros and 52 ones is normal statistical variance governed by a binomial distribution with standard deviation σ = √(N · p · (1-p)) = 5.',
          'As N increases to 1024 or 4096 shots, the sample frequency converges precisely to theoretical probability by the Law of Large Numbers.',
        ],
        calloutComparison: {
          leftTitle: 'THEORETICAL PROBABILITY',
          leftContent: 'Exact continuous value\nP(0) = |1/√2|² = 0.5000000',
          rightTitle: 'MEASUREMENT SHOTS',
          rightContent: 'Discrete empirical counts\nE.g. 512 zeros and 512 ones out of 1024 total runs.',
        },
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[1] q;

h q[0];
`,
        starterCircuitGates: [{ name: 'h', qubit: 0, step: 0 }],
        availableGates: ['h'],
        numQubits: 1,
        challenge: {
          title: 'Simulate 50/50 Statistical Distribution',
          targetDescription: 'Construct a single-qubit Hadamard superposition circuit and execute simulation shots.',
          mathTarget: '|ψ⟩ = |+⟩ ⟹ P(0) ≈ 50%, P(1) ≈ 50%',
          requirements: [
            'Place 1 Hadamard gate on wire q[0]',
            'Run simulation to verify statistical 50/50 convergence',
          ],
          expectedState: '|+⟩',
          expectedProbabilities: { '0': 0.5, '1': 0.5 },
          xpReward: 100,
        },
        hints: [
          'Place H on wire q[0].',
        ],
      },
      {
        id: 'q11',
        courseId: 'qubits-states',
        number: 11,
        title: 'H + H: The Self-Inverse Reversal (H² = I)',
        subtitle: 'Constructive and Destructive Quantum Interference',
        duration: '9 min',
        level: 'Foundations · Lesson 11 of 13',
        completed: false,
        conceptHeading: 'Quantum Interference & The Identity Gate H² = I',
        conceptBody: [
          'In classical physics, applying two randomizing coin-flips in a row produces even more randomness.',
          'In quantum computing, because the Hadamard gate is unitary and self-inverse (H = H†, so H² = I), applying a second H gate coherently undoes the superposition:',
          'H(|+⟩) = H((|0⟩+|1⟩)/√2) = (1/2)(|0⟩+|1⟩ + |0⟩-|1⟩) = (2/2)|0⟩ + (0/2)|1⟩ = 100% |0⟩',
          'Constructive interference boosts amplitude |0⟩ (+1/2 + 1/2 = 1.0), while destructive interference cancels amplitude |1⟩ (+1/2 - 1/2 = 0.0).',
        ],
        calloutComparison: {
          leftTitle: 'CONSTRUCTIVE INTERFERENCE',
          leftContent: 'In-phase amplitudes add up (+1/2 + 1/2 = 1.0), producing 100% certainty for |0⟩.',
          rightTitle: 'DESTRUCTIVE INTERFERENCE',
          rightContent: 'Out-of-phase amplitudes cancel out (+1/2 - 1/2 = 0.0), completely eliminating outcome |1⟩.',
        },
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[1] q;

h q[0];
h q[0];
`,
        starterCircuitGates: [
          { name: 'h', qubit: 0, step: 0 },
          { name: 'h', qubit: 0, step: 1 },
        ],
        availableGates: ['h', 'x'],
        numQubits: 1,
        challenge: {
          title: 'Demonstrate Hadamard Self-Inverse Reversal',
          targetDescription: 'Apply two Hadamard gates in series on wire q[0] to prove that H² = I.',
          mathTarget: '|ψ⟩ = H · H |0⟩ = |0⟩',
          requirements: [
            'Place two Hadamard (H) gates in sequence on wire q[0]',
            'Verify that initial state |0⟩ is restored with 100% probability',
          ],
          expectedState: '|0⟩',
          expectedProbabilities: { '0': 1.0 },
          xpReward: 100,
        },
        hints: [
          'Add two H gates in series: H -> H.',
        ],
      },
      {
        id: 'q12',
        courseId: 'qubits-states',
        number: 12,
        title: 'Circuit Lab: 3 Interactive Missions',
        subtitle: 'Multi-Gate Synthesis & Commutativity',
        duration: '10 min',
        level: 'Foundations · Lesson 12 of 13',
        completed: false,
        conceptHeading: 'Synthesizing Quantum Sequences',
        conceptBody: [
          'Quantum algorithms are constructed by combining basic unitary single-qubit gates (X, Z, H) into multi-stage circuits.',
          'Order matters in quantum mechanics: matrix multiplication is generally non-commutative (HX ≠ XH).',
          'In this lab, explore composing multiple transformations on wire q[0] and verifying the final statevector trajectory.',
        ],
        calloutComparison: {
          leftTitle: 'CIRCUIT WORKBENCH',
          leftContent: 'Visual wire representation where gates execute sequentially from left to right.',
          rightTitle: 'OPENQASM 3.0 CODE',
          rightContent: 'Standard quantum assembly language executed across physical hardware and cloud backends.',
        },
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[1] q;

x q[0];
h q[0];
h q[0];
x q[0];
`,
        starterCircuitGates: [
          { name: 'x', qubit: 0, step: 0 },
          { name: 'h', qubit: 0, step: 1 },
          { name: 'h', qubit: 0, step: 2 },
          { name: 'x', qubit: 0, step: 3 },
        ],
        availableGates: ['h', 'x', 'z'],
        numQubits: 1,
        challenge: {
          title: 'Complete Multi-Gate Synthesis Cycle',
          targetDescription: 'Construct a 4-gate sequence (X -> H -> H -> X) that flips, creates superposition, reverses superposition, and restores |0⟩.',
          mathTarget: '|ψ⟩ = X · H · H · X |0⟩ = |0⟩',
          requirements: [
            'Place gate sequence X -> H -> H -> X on wire q[0]',
            'Verify 100% probability for outcome |0⟩',
          ],
          expectedState: '|0⟩',
          expectedProbabilities: { '0': 1.0 },
          xpReward: 100,
        },
        hints: [
          'Place X, then H, then H, then X on wire q[0].',
        ],
      },
      {
        id: 'q13',
        courseId: 'qubits-states',
        number: 13,
        title: 'Final Challenge & Socratic Verification',
        subtitle: 'Foundational Quantum Computing Mastery',
        duration: '10 min',
        level: 'Foundations · Lesson 13 of 13',
        completed: false,
        conceptHeading: 'Synthesizing Coherent Quantum Interference',
        conceptBody: [
          'Congratulations on reaching the final milestone of Course 01: From Bit to H Gate!',
          'You have explored the shift from classical discrete bits to continuous quantum statevectors, mastered Dirac ket notation, analyzed the Born rule, and proved self-inverse Hadamard interference.',
          'For your final mastery challenge, synthesize the complete H² = I interference circuit and verify your solution.',
        ],
        calloutComparison: {
          leftTitle: 'CLASSICAL BIT',
          leftContent: 'Deterministic switches (0 or 1) with classical Boolean logic.',
          rightTitle: 'QUANTUM QUBIT',
          rightContent: 'Continuous Hilbert statevectors with phase interference and unitary reversible evolution.',
        },
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[1] q;

h q[0];
h q[0];
`,
        starterCircuitGates: [
          { name: 'h', qubit: 0, step: 0 },
          { name: 'h', qubit: 0, step: 1 },
        ],
        availableGates: ['h', 'x', 'z'],
        numQubits: 1,
        challenge: {
          title: 'Final Mastery Mission: Perfect Interference Reversal',
          targetDescription: 'Starting from |0⟩, create equal superposition, apply an operation that returns the qubit to 100% |0⟩, and verify the circuit.',
          mathTarget: '|ψ⟩ = H · H |0⟩ = |0⟩ (100% Fidelity)',
          requirements: [
            'Starting from |0⟩, create superposition using H',
            'Apply a second H to achieve complete constructive interference for |0⟩',
            'Achieve 100% probability of measuring outcome 0',
          ],
          expectedState: '|0⟩',
          expectedProbabilities: { '0': 1.0 },
          xpReward: 250,
        },
        hints: [
          'Place two Hadamard gates in series: H -> H on wire q[0].',
        ],
      },
    ],
  },
  {
    id: 'superposition-gates',
    number: '02',
    title: 'Superposition & Basic Gates',
    code: 'QF-102',
    level: 'Foundations · Level 2',
    category: 'Quantum Foundations',
    description: 'Master quantum superposition, single-qubit rotation gates, the Hadamard transformation, and the geometry of the Bloch sphere.',
    lessonsCount: 6,
    completedLessonsCount: 0,
    status: 'open',
    badgeBg: 'bg-[#fff4e6]',
    badgeBorder: 'border-[#fed7aa]',
    badgeText: 'text-[#c96b2c]',
    cardBg: 'bg-[#fffaf0]',
    cardBorder: 'border-[#fed7aa]',
    accentColor: '#c96b2c',
    lessons: [
      {
        id: 's1',
        courseId: 'superposition-gates',
        number: 1,
        title: 'The Hadamard Gate: Creating Superposition',
        subtitle: 'Transforming Computational Basis into Equal Superposition',
        duration: '6 min',
        level: 'Foundations · Lesson 1 of 6',
        completed: false,
        conceptHeading: 'The Quantum Beam Splitter: Matrix & Physical Action',
        conceptBody: [
          'Why Superposition Matters: In classical computing, every bit is rigidly locked into either 0 or 1. To achieve quantum parallelism and quantum speedup, we must first put qubits into a coherent state where all computational possibilities coexist simultaneously.',
          'The Hadamard (H) gate acts as the fundamental "quantum beam splitter". In optics, when a single photon hits a half-silvered mirror, its probability wave splits evenly across two transmission paths. Similarly, the H gate takes a definite classical state and expands it into an equal superposition.',
          'The Hadamard matrix representation is given by the 2×2 unitary operator:',
          'H = (1/√2) [ 1   1 ] \n             [ 1  -1 ]',
          'Transformation of Ground State |0⟩:',
          'H|0⟩ = (|0⟩ + |1⟩) / √2 = |+⟩',
          'Applying H to |0⟩ creates the |+⟩ state with equal positive amplitudes α = 1/√2 and β = 1/√2. By the Born rule, the probability of measuring 0 is |1/√2|² = 50%, and the probability of measuring 1 is |1/√2|² = 50%.',
          'Transformation of Excited State |1⟩:',
          'H|1⟩ = (|0⟩ - |1⟩) / √2 = |−⟩',
          'Applying H to |1⟩ creates the |−⟩ state. Although it also measures 50% 0 and 50% 1, the negative sign on |1⟩ represents a relative quantum phase shift of 180° (e^(iπ) = -1) which drives destructive interference in subsequent quantum gates.',
          'Bloch Sphere Geometry: Applying H performs a 180° rotation around the diagonal X+Z axis. It maps the North Pole (|0⟩) to the front equator (|+⟩ on the +X axis), and the South Pole (|1⟩) to the back equator (|−⟩ on the -X axis).',
          'Deterministic & Reversible: The H gate is NOT a random coin toss. It is a completely deterministic, reversible rotation of a continuous statevector in complex Hilbert space.',
        ],
        keyInsight: 'The Hadamard gate is the quantum equivalent of a half-silvered mirror in optics: it splits a definite photon path into an equal superposition of two paths. This optical analogy is exact — quantum computing grew directly from quantum optics research.',
        realWorldApplication: 'Every quantum algorithm starts with Hadamard gates. In Shor\'s factoring algorithm (which threatens RSA encryption), the first step is applying H to all n qubits to create a uniform superposition of all 2ⁿ possible inputs.',
        calloutComparison: {
          leftTitle: 'H|0⟩ ➔ |+⟩ STATE (IN-PHASE)',
          leftContent: 'Positive phase: (|0⟩ + |1⟩)/√2\nPoint on the +X axis of the Bloch sphere.\nConstructive interference in algorithms.',
          rightTitle: 'H|1⟩ ➔ |−⟩ STATE (OUT-OF-PHASE)',
          rightContent: 'Negative relative phase: (|0⟩ - |1⟩)/√2\nPoint on the -X axis of the Bloch sphere.\nDestructive interference cancels wrong paths.',
        },
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[1] q;

// Apply Hadamard gate to create superposition
h q[0];
`,
        starterCircuitGates: [{ name: 'h', qubit: 0, step: 0 }],
        availableGates: ['h', 'x', 'z'],
        numQubits: 1,
        challenge: {
          title: 'Create an Equal Superposition State',
          targetDescription: 'Transform the initialized state |0⟩ into equal superposition state |+⟩ with 50% probability of 0 and 50% probability of 1.',
          mathTarget: '|ψ⟩ = (|0⟩ + |1⟩) / √2',
          requirements: [
            'Apply a single Hadamard (H) gate to qubit q[0]',
            'Achieve 50% ± 0.1% measurement probability for |0⟩ and |1⟩',
            'Verify that statevector is normalized (|α|² + |β|² = 1)',
          ],
          expectedState: '|+⟩',
          expectedProbabilities: { '0': 0.5, '1': 0.5 },
          xpReward: 100,
        },
        hints: [
          'Drag the red [ H ] gate onto wire q[0] at step 0.',
          'In OpenQASM, write `h q[0];`.',
        ],
      },
      {
        id: 's2',
        courseId: 'superposition-gates',
        number: 2,
        title: 'Phase Flip: The Pauli-Z Gate',
        subtitle: 'Relative Phase Without Changing Probabilities',
        duration: '8 min',
        level: 'Foundations · Lesson 2 of 6',
        completed: false,
        conceptHeading: 'Relative Phase & The Pauli-Z Operator',
        conceptBody: [
          'The Hidden Dimension of Quantum States: Classical bits only have magnitude (0 or 1). Quantum states have both magnitude (amplitudes) and relative phase (angles). Phase is invisible to single-qubit computational measurements, yet it controls how quantum waves interfere.',
          'The Pauli-Z gate acts as a phase inverter. It leaves the ground state |0⟩ completely unchanged, but multiplies the excited state |1⟩ by -1 (a π or 180° phase flip):',
          'Z = [ 1   0 ] \n    [ 0  -1 ]',
          'Action on Computational Basis:',
          'Z|0⟩ = |0⟩,   Z|1⟩ = -|1⟩',
          'Action on Superposition (|+) ➔ |−⟩):',
          'Z|+⟩ = Z((|0⟩ + |1⟩)/√2) = (|0⟩ - |1⟩)/√2 = |−⟩',
          'Why Phase Matters: If you measure |+⟩ or |−⟩ in the standard 0/1 basis, you will get exactly 50% 0 and 50% 1 in both cases! However, if you apply another Hadamard gate, |+⟩ interferes constructively to return to |0⟩ (100%), whereas |−⟩ interferes destructively to produce |1⟩ (100%).',
          'Bloch Sphere Geometry: The Z gate performs a 180° rotation around the vertical Z-axis. It pivots points on the equator across the sphere, mapping +X (|+⟩) directly to -X (|−⟩).',
        ],
        keyInsight: 'Phase is the "invisible fingerprint" of quantum states. You cannot see it by measuring, but it controls how quantum waves combine in subsequent operations — constructively or destructively.',
        realWorldApplication: 'Quantum phase kickback (exploiting phase differences) is the core engine behind Shor\'s factoring algorithm and Quantum Phase Estimation — the two most commercially important quantum algorithms.',
        showBlochSphere: true,
        predictionCheckpoint: {
          question: 'What happens to the measurement probabilities P(0) and P(1) when a Pauli-Z gate is applied to |+⟩ = (|0⟩ + |1⟩)/√2?',
          options: ['Probabilities remain unchanged at 50%/50%', 'P(0) becomes 100%', 'P(1) becomes 100%', 'Both probabilities drop to 0%'],
          correctIndex: 0,
          explanation: 'The Z gate flips the phase of |1⟩ to -|1⟩, turning |+⟩ into |−⟩. Since |-1/√2|² = 0.5, the raw computational measurement probabilities remain strictly 50%/50%!'
        },
        calloutComparison: {
          leftTitle: 'COMPUTATIONAL PROBABILITIES',
          leftContent: 'P(0) = 50%, P(1) = 50%\nMeasurement probabilities remain completely invariant under Z.',
          rightTitle: 'QUANTUM PHASE',
          rightContent: 'Phase flips from 0 to π (sign inversion)\nEnables quantum interference when further gates are applied.',
        },
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[1] q;

// Create |+⟩, then apply Z to create |−⟩
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
          title: 'Transform |+⟩ into |−⟩ with a Phase Flip',
          targetDescription: 'Construct a circuit that transforms |0⟩ into |+⟩ with a Hadamard gate, then applies a Pauli-Z gate to produce |−⟩.',
          mathTarget: '|ψ⟩ = (|0⟩ - |1⟩) / √2',
          requirements: [
            'Apply Hadamard (H) gate to q[0] at step 0',
            'Apply Pauli-Z gate to q[0] at step 1',
            'Statevector must have a negative coefficient on |1⟩',
          ],
          expectedState: '|−⟩',
          expectedProbabilities: { '0': 0.5, '1': 0.5 },
          xpReward: 120,
        },
        hints: [
          'First place H on q[0], then place Z on q[0].',
        ],
      },
      {
        id: 's3',
        courseId: 'superposition-gates',
        number: 3,
        title: 'Pauli-X Gate: Quantum Bit Flip (NOT)',
        subtitle: 'Rotating π Radians Around the X-Axis',
        duration: '6 min',
        level: 'Foundations · Lesson 3 of 6',
        completed: false,
        conceptHeading: 'The Pauli-X Operator & Reversible Inversion',
        conceptBody: [
          'The Quantum NOT Gate: The Pauli-X gate is the direct quantum counterpart to the classical NOT logic gate. It swaps the amplitudes of the computational basis states:',
          'X = [ 0  1 ] \n    [ 1  0 ]',
          'Basis State Transformation:',
          'X|0⟩ = |1⟩,   X|1⟩ = |0⟩',
          'Action on a General Qubit State:',
          'X(α|0⟩ + β|1⟩) = β|0⟩ + α|1⟩',
          'Unitary & Self-Inverse (X² = I): In classical computing, gates like AND or OR destroy information (they take 2 inputs and output 1 bit). In quantum computing, all quantum logic gates are strictly unitary and reversible. Applying X twice returns the qubit to its initial state: X · X = X² = I.',
          'Bloch Sphere Geometry: The X gate executes a 180° rotation around the horizontal X-axis. It inverts the North Pole (|0⟩) down to the South Pole (|1⟩), while leaving states on the X-axis (|+⟩ and |−⟩) unchanged up to global phase.',
        ],
        keyInsight: 'The Hadamard gate is self-inverse: H² = I. Applying it twice returns the qubit to its starting state via constructive and destructive wave interference.',
        historicalNote: 'Named after French mathematician Jacques Hadamard (1865–1963), who made seminal contributions to matrix theory and complex analysis.',
        showBlochSphere: true,
        predictionCheckpoint: {
          question: 'If you apply a Hadamard gate to ground state |0⟩, what are the measurement probabilities for outcomes 0 and 1?',
          options: ['100% chance of 0', '50% chance of 0, 50% chance of 1', '100% chance of 1', '75% chance of 0, 25% chance of 1'],
          correctIndex: 1,
          explanation: 'H|0⟩ creates the equal superposition state |+⟩ = (|0⟩ + |1⟩)/√2, giving |1/√2|² = 50% probability for both 0 and 1.'
        },
        calloutComparison: {
          leftTitle: 'CLASSICAL NOT GATE',
          leftContent: 'Flips discrete bit 0 ⇄ 1.\nInformation-dissipating in non-reversible architectures.',
          rightTitle: 'PAULI-X GATE',
          rightContent: 'Swaps statevector amplitudes α ⇄ β.\nReversible unitary rotation around the X-axis on the Bloch sphere.',
        },
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[1] q;

// Apply X gate to flip |0⟩ to |1⟩
x q[0];
`,
        starterCircuitGates: [{ name: 'x', qubit: 0, step: 0 }],
        availableGates: ['h', 'x', 'y', 'z'],
        numQubits: 1,
        challenge: {
          title: 'Prepare Excited State |1⟩ with Pauli-X',
          targetDescription: 'Apply the Pauli-X gate to wire q[0] to invert the ground state |0⟩ into the excited state |1⟩.',
          mathTarget: '|ψ⟩ = |1⟩',
          requirements: [
            'Place a Pauli-X gate on wire q[0]',
            'Verify 100% measurement probability for outcome 1',
            'Statevector amplitude on |0⟩ must be 0, and on |1⟩ must be 1.0',
          ],
          expectedState: '|1⟩',
          expectedProbabilities: { '1': 1.0 },
          xpReward: 100,
        },
        hints: ['Drag the pink [ X ] gate onto wire q[0] at step 0.'],
      },
      {
        id: 's4',
        courseId: 'superposition-gates',
        number: 4,
        title: 'Pauli-Y Gate: Bit & Phase Flip Combined',
        subtitle: 'Complex Amplitudes & Rotation Around the Y-Axis',
        duration: '8 min',
        level: 'Foundations · Lesson 4 of 6',
        completed: false,
        conceptHeading: 'The Pauli-Y Operator & Complex Phase Geometry',
        conceptBody: [
          'Combining Bit Flip and Phase Flip: The Pauli-Y gate performs both a bit flip (swapping |0⟩ and |1⟩) and introduces an imaginary relative phase factor of i (where i = √-1):',
          'Y = [ 0  -i ] \n    [ i   0 ]',
          'Matrix Action on Basis States:',
          'Y|0⟩ = i|1⟩,   Y|1⟩ = -i|0⟩',
          'Why Imaginary Numbers Matter: Quantum amplitudes are complex numbers (α, β ∈ ℂ). The imaginary unit i represents a 90° rotation in the complex phase plane. The Y gate is crucial because it allows quantum statevectors to point in any three-dimensional direction on the Bloch sphere, including the ±Y axes.',
          'Algebraic Relation: The Pauli matrices satisfy the famous Lie algebra relation: Y = iXZ = -iZX. Applying X followed by Z generates Y with an overall global phase of i.',
          'Bloch Sphere Geometry: Applying Y rotates the statevector by 180° around the Y-axis. It swaps North and South poles while maintaining orientation along the Y equator.',
        ],
        calloutComparison: {
          leftTitle: 'REAL ROTATIONS (X & Z)',
          leftContent: 'X rotates around the X-axis (bit flip).\nZ rotates around the Z-axis (phase flip).',
          rightTitle: 'COMPLEX ROTATION (Y)',
          rightContent: 'Y introduces complex imaginary amplitudes.\nRotates the statevector along the equator through the Y-axis.',
        },
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[1] q;

// Apply Pauli-Y gate
y q[0];
`,
        starterCircuitGates: [{ name: 'y', qubit: 0, step: 0 }],
        availableGates: ['h', 'x', 'y', 'z'],
        numQubits: 1,
        challenge: {
          title: 'Execute Pauli-Y Transformation',
          targetDescription: 'Apply the Pauli-Y gate to wire q[0] and observe the 100% transition from ground state |0⟩ to excited state |1⟩ with an imaginary global phase of i.',
          mathTarget: '|ψ⟩ = i|1⟩',
          requirements: [
            'Place a Pauli-Y gate on wire q[0]',
            'Verify outcome measurement probability P(1) = 100%',
          ],
          expectedState: '|1⟩',
          expectedProbabilities: { '1': 1.0 },
          xpReward: 120,
        },
        hints: ['Drag the [ Y ] gate onto wire q[0].'],
      },
      {
        id: 's5',
        courseId: 'superposition-gates',
        number: 5,
        title: 'Phase Rotation: S & T Gates',
        subtitle: 'Quarter-Turn & Eighth-Turn Fractional Phase Shifts',
        duration: '9 min',
        level: 'Foundations · Lesson 5 of 6',
        completed: false,
        conceptHeading: 'The S (Phase) & T (π/8) Unitary Operators',
        conceptBody: [
          'Fractional Phase Shifts: While Pauli-Z rotates phase by a full 180° (π radians), quantum algorithms (like Shor’s period finding and Quantum Phase Estimation) require fine-grained fractional phase rotations.',
          'The S Gate (Phase Gate, √Z): Performs a 90° (π/2 radians) rotation around the Z-axis:',
          'S = [ 1  0 ] \n    [ 0  i ]  ⟹ S² = Z',
          'The T Gate (π/8 Gate, √S): Performs a 45° (π/4 radians) rotation around the Z-axis:',
          'T = [ 1      0     ] \n    [ 0  e^(iπ/4) ]  ⟹ T² = S, T⁴ = Z',
          'The Gateway to Universal Quantum Computing: The Gottesman-Knill Theorem proves that quantum circuits using ONLY Clifford gates {H, S, CNOT, Pauli} can be simulated in polynomial time on classical laptops. Adding the non-Clifford T gate breaks classical simulability and grants Universal Fault-Tolerant Quantum Computing!',
          'Bloch Sphere Trajectory: Applying S to |+⟩ rotates it from the +X axis to the +Y axis on the equator, creating the right-circular polarization state |R⟩ = (|0⟩ + i|1⟩)/√2.',
        ],
        calloutComparison: {
          leftTitle: 'S GATE (PHASE, √Z)',
          leftContent: 'Diagonal: (1, i) · Rotates by +90° around Z-axis.\nMaps |+⟩ (on X-axis) to |R⟩ (on Y-axis).',
          rightTitle: 'T GATE (π/8, √S)',
          rightContent: 'Diagonal: (1, e^(iπ/4)) · Rotates by +45° around Z-axis.\nEssential non-Clifford gate for universal quantum computation.',
        },
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[1] q;

// Create |+⟩, then apply S gate to produce |R⟩ = (|0⟩ + i|1⟩)/√2
h q[0];
s q[0];
`,
        starterCircuitGates: [
          { name: 'h', qubit: 0, step: 0 },
          { name: 's', qubit: 0, step: 1 },
        ],
        availableGates: ['h', 'x', 'y', 'z', 's', 't'],
        numQubits: 1,
        challenge: {
          title: 'Prepare the |R⟩ State Using H and S Gates',
          targetDescription: 'Construct a circuit that applies a Hadamard gate to create |+⟩, followed by an S gate to rotate the relative phase to +90°, creating the right-circular polarization state |R⟩ = (|0⟩ + i|1⟩)/√2.',
          mathTarget: '|ψ⟩ = (|0⟩ + i|1⟩) / √2',
          requirements: [
            'Place Hadamard (H) on q[0] at step 0',
            'Place Phase (S) on q[0] at step 1',
            'Verify 50% probability on both 0 and 1 with relative phase +i',
          ],
          expectedState: '|R⟩',
          expectedProbabilities: { '0': 0.5, '1': 0.5 },
          xpReward: 150,
        },
        hints: ['Place H on q[0] first, then place S on q[0].'],
      },
      {
        id: 's6',
        courseId: 'superposition-gates',
        number: 6,
        title: 'Gate Identities & Quantum Interference',
        subtitle: 'Synthesizing Gates: H·X·H = Z and H·Z·H = X',
        duration: '10 min',
        level: 'Foundations · Lesson 6 of 6',
        completed: false,
        conceptHeading: 'Quantum Gate Equivalences & Basis Transformations',
        conceptBody: [
          'Synthesizing New Gates via Conjugation: In quantum compilers (such as Qiskit transpilers), circuits are optimized by rewriting gate sequences into equivalent forms using unitary identities.',
          'Hadamard Conjugation: The Hadamard gate acts as a basis bridge between the standard Z basis {|0⟩, |1⟩} and the diagonal X basis {|+⟩, |−⟩}:',
          'H · X · H = Z',
          'H · Z · H = X',
          'Step-by-Step Proof of H·X·H = Z:',
          '1. Start with ground state |0⟩: H|0⟩ = |+⟩ = (|0⟩ + |1⟩)/√2',
          '2. Apply bit-flip X to |+⟩: X|+⟩ = X(|0⟩ + |1⟩)/√2 = (|1⟩ + |0⟩)/√2 = |+⟩ (unchanged!)',
          '3. Apply second H to |+⟩: H|+⟩ = |0⟩',
          'Since Z|0⟩ = |0⟩ and Z|1⟩ = -|1⟩, the sandwich sequence H · X · H behaves identically to the single Pauli-Z operator across all inputs.',
          'Why This is Fundamental: This identity proves that phase flips in the computational basis are mathematically equivalent to bit flips in the superposition basis. This principle is the exact engine used in the Deutsch-Jozsa algorithm and Grover’s diffusion operator!',
        ],
        calloutComparison: {
          leftTitle: 'COMPUTATIONAL BASIS (Z)',
          leftContent: 'Basis states: |0⟩, |1⟩\nX flips bits (0 ⇄ 1)\nZ flips phase (+ ⇄ -)',
          rightTitle: 'HADAMARD BASIS (X)',
          rightContent: 'Basis states: |+⟩, |−⟩\nZ flips bits (+ ⇄ -)\nX flips phase (+ ⇄ -)',
        },
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[1] q;

// Verify H·X·H = Z equivalence
h q[0];
x q[0];
h q[0];
`,
        starterCircuitGates: [
          { name: 'h', qubit: 0, step: 0 },
          { name: 'x', qubit: 0, step: 1 },
          { name: 'h', qubit: 0, step: 2 },
        ],
        availableGates: ['h', 'x', 'y', 'z', 's', 't'],
        numQubits: 1,
        challenge: {
          title: 'Implement the Conjugate Identity H·X·H = Z',
          targetDescription: 'Construct the circuit H → X → H on wire q[0]. Verify that when starting from |0⟩, the sequence produces the ground state |0⟩ (because Z|0⟩ = |0⟩).',
          mathTarget: '|ψ⟩ = H · X · H |0⟩ = Z|0⟩ = |0⟩',
          requirements: [
            'Apply H gate at step 0',
            'Apply X gate at step 1',
            'Apply H gate at step 2',
            'Verify 100% measurement probability for outcome 0',
          ],
          expectedState: '|0⟩',
          expectedProbabilities: { '0': 1.0 },
          xpReward: 180,
        },
        hints: ['Place three gates in series on q[0]: H, then X, then H.'],
      },
    ],
  },
  {
    id: 'entanglement-bell',
    number: '03',
    title: 'Quantum Entanglement & Bell States',
    code: 'QF-103',
    level: 'Foundations · Level 3',
    category: 'Quantum Foundations',
    description: 'Explore the non-local correlations of multi-qubit systems, the 4 canonical Bell states, and the EPR paradox.',
    lessonsCount: 5,
    completedLessonsCount: 0,
    status: 'open',
    badgeBg: 'bg-[#edf5ff]',
    badgeBorder: 'border-[#b9d3ff]',
    badgeText: 'text-[#0f62fe]',
    cardBg: 'bg-[#f7faff]',
    cardBorder: 'border-[#b9d3ff]',
    accentColor: '#0f62fe',
    lessons: [
      {
        id: 'e1',
        courseId: 'entanglement-bell',
        number: 1,
        title: 'Introduction to 2-Qubit State Space',
        subtitle: 'Tensor Products & 4-Dimensional Hilbert Space',
        duration: '7 min',
        level: 'Foundations · Lesson 1 of 5',
        completed: false,
        conceptHeading: 'Composite Systems & Tensor Products (⊗)',
        conceptBody: [
          'Exponential Scaling of Quantum Space: When multiple qubits are combined, their state space grows exponentially rather than linearly. While two classical bits can only ever store one pair of values (such as 01), a two-qubit quantum register spans a 4-dimensional Hilbert space.',
          'Analogy: Think of a classical 2-bit register as a single dot on a 2×2 grid. A quantum 2-qubit register is a continuous probability cloud that simultaneously covers all 4 grid cells!',
          'The Composite Computational Basis: The composite state space is mathematically constructed via the Kronecker tensor product (⊗) of the individual 2D spaces: ℂ² ⊗ ℂ² = ℂ⁴.',
          'The 4 orthonormal basis states are:',
          '|00⟩ = |0⟩ ⊗ |0⟩ = [1, 0, 0, 0]ᵀ \n|01⟩ = |0⟩ ⊗ |1⟩ = [0, 1, 0, 0]ᵀ \n|10⟩ = |1⟩ ⊗ |0⟩ = [0, 0, 1, 0]ᵀ \n|11⟩ = |1⟩ ⊗ |1⟩ = [0, 0, 0, 1]ᵀ',
          'A general 2-qubit state is written as a linear combination of all 4 basis states:',
          '|ψ⟩ = c₀₀|00⟩ + c₀₁|01⟩ + c₁₀|10⟩ + c₁₁|11⟩',
          'Normalization: The sum of probabilities over all 4 outcomes must equal 1: |c₀₀|² + |c₀₁|² + |c₁₀|² + |c₁₁|² = 1.',
        ],
        keyInsight: 'The exponential scaling of quantum state space is the fundamental source of quantum computing power. With just 50 qubits, the state space has 2⁵⁰ ≈ 10¹⁵ dimensions — more than any classical supercomputer can fully represent in memory.',
        realWorldApplication: 'Google\'s 2019 "quantum supremacy" experiment used 53 qubits to sample from a distribution in 200 seconds that they claimed would take a classical supercomputer 10,000 years.',
        historicalNote: 'The tensor product structure of composite quantum systems was formalized by John von Neumann in his 1932 book "Mathematical Foundations of Quantum Mechanics".',
        calloutComparison: {
          leftTitle: 'PRODUCT (SEPARABLE) STATES',
          leftContent: '|ψ⟩ = |a⟩ ⊗ |b⟩\nCan be factored into individual qubit states.\nNo quantum entanglement between wires.',
          rightTitle: 'ENTANGLED STATES',
          rightContent: '|ψ⟩ ≠ |a⟩ ⊗ |b⟩\nCannot be described independently.\nMeasuring one qubit instantly determines the other!',
        },
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[2] q;

// Apply X to both wires to create |11⟩
x q[0];
x q[1];
`,
        starterCircuitGates: [
          { name: 'x', qubit: 0, step: 0 },
          { name: 'x', qubit: 1, step: 0 },
        ],
        availableGates: ['h', 'x', 'cx'],
        numQubits: 2,
        challenge: {
          title: 'Prepare State |11⟩ on 2 Qubits',
          targetDescription: 'Apply bit-flip gates to transform the initial state |00⟩ into |11⟩.',
          mathTarget: '|ψ⟩ = |11⟩',
          requirements: [
            'Apply Pauli-X to wire q[0]',
            'Apply Pauli-X to wire q[1]',
            'Verify 100% measurement probability of outcome 11',
          ],
          expectedState: '|11⟩',
          expectedProbabilities: { '11': 1.0 },
          xpReward: 150,
        },
        hints: ['Place an X gate on each wire: q[0] and q[1].'],
      },
      {
        id: 'e2',
        courseId: 'entanglement-bell',
        number: 2,
        title: 'The CNOT Gate: Conditional Entangling Logic',
        subtitle: 'The Controlled-NOT 2-Qubit Entangler',
        duration: '8 min',
        level: 'Foundations · Lesson 2 of 5',
        completed: false,
        conceptHeading: 'The Controlled-NOT (CX) Matrix & Control Logic',
        conceptBody: [
          'The Engine of Multi-Qubit Computation: Single-qubit gates can rotate states on individual Bloch spheres, but to generate entanglement and build quantum algorithms, qubits must interact.',
          'The CNOT (Controlled-NOT or CX) gate is the fundamental 2-qubit entangling gate. It uses wire q0 as the "Control" qubit and wire q1 as the "Target" qubit:',
          'CNOT Matrix in Standard Basis:',
          'CNOT = [ 1 0 0 0 ] \n       [ 0 1 0 0 ] \n       [ 0 0 0 1 ] \n       [ 0 0 1 0 ]',
          'Conditional Rule: If the control qubit is |0⟩, the target qubit is left completely unchanged. If the control qubit is |1⟩, the target qubit is flipped (|0⟩ ↔ |1⟩):',
          '|00⟩ ➤ |00⟩ \n|01⟩ ➤ |01⟩ \n|10⟩ ➤ |11⟩ (Control is 1 ⟹ target flips) \n|11⟩ ➤ |10⟩ (Control is 1 ⟹ target flips)',
          'Analogy: Think of CNOT like a light switch controlled by a motion sensor. If the sensor detects someone (control = |1⟩), the light toggles. If nobody is detected (control = |0⟩), the light stays unchanged.',
        ],
        keyInsight: 'CNOT is the ONLY 2-qubit gate you need (combined with single-qubit rotations) to build any quantum circuit. Any quantum algorithm can be decomposed into CNOT + single-qubit gates — this is called universality.',
        realWorldApplication: 'CNOT gates are the most error-prone operation on current quantum hardware. IBM\'s Eagle processor achieves ~99.5% CNOT fidelity, meaning about 1 in 200 CNOT operations produces an error.',
        calloutComparison: {
          leftTitle: 'CONTROL QUBIT (|0⟩)',
          leftContent: 'No action performed on target.\nTarget qubit retains its exact input state.',
          rightTitle: 'CONTROL QUBIT (|1⟩)',
          rightContent: 'Bit-flip (X) applied to target.\nTransforms target basis state |0⟩ ↔ |1⟩.',
        },
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[2] q;

// Initialize q0 to |1⟩, then apply CX
x q[0];
cx q[0], q[1];
`,
        starterCircuitGates: [
          { name: 'x', qubit: 0, step: 0 },
          { name: 'cx', qubit: 0, step: 1 },
        ],
        availableGates: ['h', 'x', 'cx'],
        numQubits: 2,
        challenge: {
          title: 'Execute CNOT with Active Control',
          targetDescription: 'Prepare control wire q[0] in state |1⟩ using an X gate, then apply CNOT to flip target wire q[1] into state |1⟩, yielding state |11⟩.',
          mathTarget: '|ψ⟩ = |11⟩',
          requirements: [
            'Apply X to control wire q[0]',
            'Apply CNOT with control q[0] and target q[1]',
            'Verify final state is 100% |11⟩',
          ],
          expectedState: '|11⟩',
          expectedProbabilities: { '11': 1.0 },
          xpReward: 160,
        },
        hints: ['Place X on q[0] at step 0, then place CNOT at step 1.'],
      },
      {
        id: 'e3',
        courseId: 'entanglement-bell',
        number: 3,
        title: 'Creating the Bell State |Φ⁺⟩',
        subtitle: 'Maximally Entangled 2-Qubit State (EPR Pair)',
        duration: '9 min',
        level: 'Foundations · Lesson 3 of 5',
        completed: false,
        conceptHeading: 'The H + CNOT Entanglement Recipe',
        conceptBody: [
          'What is Quantum Entanglement? Entanglement is the non-local correlation between qubits that cannot be reproduced by any classical hidden-variable theory. Measuring one entangled qubit instantaneously determines the measurement outcome of the other qubit, regardless of spatial separation (Einstein’s "spooky action at a distance").',
          'The 2-Step Recipe for Bell State |Φ⁺⟩:',
          '1. Step 1: Apply Hadamard to wire q[0] to create equal superposition on the control qubit: (|0⟩ + |1⟩)/√2 ⊗ |0⟩ = (|00⟩ + |10⟩)/√2.',
          '2. Step 2: Apply CNOT controlled by q[0] onto target q[1]: The |00⟩ component remains |00⟩, while the |10⟩ component flips to |11⟩!',
          'Final Entangled State:',
          '|Φ⁺⟩ = (|00⟩ + |11⟩) / √2',
          'Measuring |Φ⁺⟩: There is a 50% chance of measuring 00 and a 50% chance of measuring 11. Outcomes 01 and 10 have exactly 0% probability. The qubits are 100% correlated!',
          'Einstein\'s "Spooky Action": In 1935, Einstein, Podolsky, and Rosen (EPR) argued this instant correlation meant quantum mechanics was "incomplete". But John Bell proved in 1964 that no classical hidden variable theory can reproduce these correlations — quantum entanglement is real and fundamentally non-classical.',
        ],
        keyInsight: 'Entanglement does NOT transmit information faster than light. The correlations only become apparent when Alice and Bob compare their measurement results using classical communication.',
        realWorldApplication: 'Quantum entanglement is the backbone of quantum internet research. China\'s Micius satellite (2017) distributed entangled photon pairs over 1,200 km, enabling secure quantum key distribution between Beijing and Vienna.',
        historicalNote: 'The Bell State |Φ⁺⟩ is named after physicist John Stewart Bell, whose 1964 Bell inequalities experimentally disproved Einstein\'s local hidden variable theory. Alain Aspect confirmed this in 1982, earning the 2022 Nobel Prize.',
        illustrationUrl: '/images/lessons/entanglement.jpg',
        illustrationCaption: 'Quantum Entanglement: Non-local quantum correlations between Alice and Bob sharing a maximally entangled Bell pair.',
        calloutComparison: {
          leftTitle: 'MEASURING QUBIT 0 = 0',
          leftContent: 'Wavefunction collapses to |00⟩.\nQubit 1 is guaranteed to measure 0 with 100% certainty!',
          rightTitle: 'MEASURING QUBIT 0 = 1',
          rightContent: 'Wavefunction collapses to |11⟩.\nQubit 1 is guaranteed to measure 1 with 100% certainty!',
        },
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[2] q;

// Bell state |Φ⁺⟩ circuit: H on q[0], then CX
h q[0];
cx q[0], q[1];
`,
        starterCircuitGates: [
          { name: 'h', qubit: 0, step: 0 },
          { name: 'cx', qubit: 0, step: 1 },
        ],
        availableGates: ['h', 'x', 'z', 'cx'],
        numQubits: 2,
        challenge: {
          title: 'Construct the Canonical Bell State |Φ⁺⟩',
          targetDescription: 'Build the standard entanglement circuit using a Hadamard gate on wire q[0] followed by a CNOT gate with control q[0] and target q[1].',
          mathTarget: '|Φ⁺⟩ = (|00⟩ + |11⟩) / √2',
          requirements: [
            'Apply H on wire q[0] at step 0',
            'Apply CNOT across q[0] and q[1] at step 1',
            'Achieve 50% probability on 00 and 50% probability on 11',
            'Outcomes 01 and 10 must have 0% probability',
          ],
          expectedState: '|Φ⁺⟩',
          expectedProbabilities: { '00': 0.5, '11': 0.5 },
          xpReward: 200,
        },
        hints: ['Place H on wire q[0], then place CNOT (⊕) spanning from q[0] to q[1].'],
      },
      {
        id: 'e4',
        courseId: 'entanglement-bell',
        number: 4,
        title: 'The 4 Maximally Entangled Bell States',
        subtitle: 'The Orthonormal Bell Basis for 2-Qubit Hilbert Space',
        duration: '10 min',
        level: 'Foundations · Lesson 4 of 5',
        completed: false,
        conceptHeading: 'The 4 Canonical Bell Basis States & Parity',
        conceptBody: [
          'The Orthonormal Bell Basis: Just as single qubits have the standard computational basis {|0⟩, |1⟩}, two-qubit entangled systems can be completely described by 4 mutually orthogonal, maximally entangled Bell states.',
          '1. Phi-Plus: |Φ⁺⟩ = (|00⟩ + |11⟩) / √2   (Prepared via H on q0, CX)',
          '2. Phi-Minus: |Φ⁻⟩ = (|00⟩ - |11⟩) / √2   (Prepared via X on q0, H on q0, CX)',
          '3. Psi-Plus: |Ψ⁺⟩ = (|01⟩ + |10⟩) / √2   (Prepared via X on q1, H on q0, CX)',
          '4. Psi-Minus (Singlet): |Ψ⁻⟩ = (|01⟩ - |10⟩) / √2   (Prepared via X on q0, X on q1, H on q0, CX)',
          'Parity Classification: |Φ⁺⟩ and |Φ⁻⟩ have Even Parity (both qubits always measure identical values: 00 or 11). |Ψ⁺⟩ and |Ψ⁻⟩ have Odd Parity (the qubits always measure opposite values: 01 or 10).',
          'Why the Bell Basis Matters: Any arbitrary 2-qubit state can be written as a linear combination of these 4 states. They are the foundational currency for quantum teleportation and superdense coding!',
        ],
        keyInsight: 'The 4 Bell states form a complete orthonormal basis for all 2-qubit entangled states. This means any quantum communication protocol — teleportation, superdense coding, entanglement swapping — is fundamentally built on these 4 states.',
        calloutComparison: {
          leftTitle: 'EVEN PARITY (|Φ⁺⟩, |Φ⁻⟩)',
          leftContent: 'Measurement outcomes: 00 or 11 (100% correlated)\nPhase difference: + on |Φ⁺⟩ vs - on |Φ⁻⟩.',
          rightTitle: 'ODD PARITY (|Ψ⁺⟩, |Ψ⁻⟩)',
          rightContent: 'Measurement outcomes: 01 or 10 (100% anti-correlated)\n|Ψ⁻⟩ is invariant under all coordinate rotations (Singlet State).',
        },
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[2] q;

// Construct |Φ⁻⟩ = (|00⟩ - |11⟩)/√2
x q[0];
h q[0];
cx q[0], q[1];
`,
        starterCircuitGates: [
          { name: 'x', qubit: 0, step: 0 },
          { name: 'h', qubit: 0, step: 1 },
          { name: 'cx', qubit: 0, step: 2 },
        ],
        availableGates: ['h', 'x', 'z', 'cx'],
        numQubits: 2,
        challenge: {
          title: 'Prepare the Phi-Minus Bell State |Φ⁻⟩',
          targetDescription: 'Apply an X gate to wire q[0], followed by a Hadamard on q[0], and then a CNOT from q[0] to q[1] to synthesize the negative-phase Bell state |Φ⁻⟩.',
          mathTarget: '|Φ⁻⟩ = (|00⟩ - |11⟩) / √2',
          requirements: [
            'Place X on wire q[0] at step 0',
            'Place H on wire q[0] at step 1',
            'Place CNOT from q[0] to q[1] at step 2',
            'Verify 50% probability on 00 and 50% probability on 11 with -1 amplitude on |11⟩',
          ],
          expectedState: '|Φ⁻⟩',
          expectedProbabilities: { '00': 0.5, '11': 0.5 },
          xpReward: 220,
        },
        hints: ['Sequence on wire q[0]: X, then H, then CNOT targeting q[1].'],
      },
      {
        id: 'e5',
        courseId: 'entanglement-bell',
        number: 5,
        title: 'Quantum Teleportation & EPR Protocols',
        subtitle: 'Transmitting Unknown Quantum States via Shared Entanglement',
        duration: '12 min',
        level: 'Foundations · Lesson 5 of 5',
        completed: false,
        conceptHeading: 'Bell-State Measurement & Quantum Teleportation',
        conceptBody: [
          'What is Quantum Teleportation? The No-Cloning Theorem strictly forbids copying an unknown quantum state. However, using pre-shared entanglement plus 2 classical bits, Alice can transfer an unknown quantum state to Bob without physically sending the qubit!',
          'The Key Sub-Circuit — Bell-State Analyzer: The heart of the teleportation protocol is the Bell-State Measurement. It takes two qubits and projects them into one of the 4 Bell basis states using just two gates:',
          '1. Apply CNOT from q[0] to q[1] — this "disentangles" the Bell pair correlations into computational basis information.',
          '2. Apply Hadamard to q[0] — this converts phase information into amplitude information, making it measurable.',
          'After this circuit, measuring q[0] and q[1] reveals which of the 4 Bell states the pair was in — enabling Bob to apply the correct Pauli correction.',
          'The Full 3-Qubit Protocol (Conceptual Overview):',
          '1. Alice and Bob pre-share a Bell pair |Φ⁺⟩ across qubits q[1] and q[2].',
          '2. Alice performs the Bell-State Analyzer on her unknown qubit q[0] and her half of the pair q[1].',
          '3. Alice measures and sends 2 classical bits to Bob.',
          '4. Bob applies X^(m1) · Z^(m0) corrections to q[2], perfectly recovering |ψ⟩!',
          'In this workspace, you will build the Bell-State Analyzer sub-circuit (Steps 1-2) on 2 qubits.',
        ],
        keyInsight: 'Teleportation does NOT violate relativity: the quantum state is destroyed at Alice\'s location and reconstructed at Bob\'s. The 2 classical bits (which travel at most at light speed) are essential — without them, Bob\'s qubit is random noise.',
        realWorldApplication: 'In 2022, researchers at QuTech (Delft) demonstrated quantum teleportation across a 3-node quantum network. Quantum teleportation is a fundamental building block for the future quantum internet.',
        historicalNote: 'Quantum teleportation was first theorized by Bennett, Brassard, Crépeau, Jozsa, Peres, and Wootters in 1993, and experimentally demonstrated by Anton Zeilinger\'s group in 1997.',
        calloutComparison: {
          leftTitle: 'ALICE (ENCODING)',
          leftContent: 'Applies CNOT(q0, q1) then H(q0).\nDestroys local state |ψ⟩ during measurement.',
          rightTitle: 'BOB (DECODING & CORRECTION)',
          rightContent: 'Receives 2 classical bits (m0, m1).\nApplies X and Z corrections to recover |ψ⟩.',
        },
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[2] q;

// Bell-State Analyzer circuit: CNOT followed by H
cx q[0], q[1];
h q[0];
`,
        starterCircuitGates: [
          { name: 'cx', qubit: 0, step: 0 },
          { name: 'h', qubit: 0, step: 1 },
        ],
        availableGates: ['h', 'x', 'z', 'cx'],
        numQubits: 2,
        challenge: {
          title: 'Implement the Bell-State Measurement Analyzer',
          targetDescription: 'Construct the Bell analyzer on wires q[0] and q[1] using a CNOT gate from q[0] to q[1] followed by a Hadamard on q[0].',
          mathTarget: 'Bell Analyzer: H(q0) · CX(q0, q1)',
          requirements: [
            'Place CNOT from q[0] to q[1] at step 0',
            'Place Hadamard (H) on q[0] at step 1',
            'Verify equal 25% superposition over all 4 basis states when initialized in superposition',
          ],
          expectedState: 'Bell-Measured',
          expectedProbabilities: { '00': 0.5, '01': 0.5 },
          xpReward: 250,
        },
        hints: ['Place CNOT at step 0, then place H on wire q[0] at step 1.'],
      },
    ],
  },
  {
    id: 'grover-search',
    number: '04',
    title: "Grover's Search Algorithm",
    code: 'QA-201',
    level: 'Algorithms · Level 4',
    category: 'Quantum Algorithms',
    description: 'Understand quadratic quantum speedup O(√N), oracle construction, amplitude amplification, and phase inversion.',
    lessonsCount: 7,
    completedLessonsCount: 0,
    status: 'open',
    badgeBg: 'bg-[#f3e8ff]',
    badgeBorder: 'border-[#d8b4fe]',
    badgeText: 'text-[#6929c4]',
    cardBg: 'bg-[#faf5ff]',
    cardBorder: 'border-[#d8b4fe]',
    accentColor: '#6929c4',
    lessons: [
      {
        id: 'g1',
        courseId: 'grover-search',
        number: 1,
        title: 'The Unstructured Search Problem & Quantum Oracles',
        subtitle: 'Marking Target States with Phase Inversion',
        duration: '9 min',
        level: 'Algorithms · Lesson 1 of 7',
        completed: false,
        conceptHeading: 'The Quadratic Speedup & Phase Inversion Oracles',
        conceptBody: [
          'The Classical vs Quantum Search Challenge: Searching for a specific item in an unsorted database of N elements classically requires O(N) queries on average. Grover’s algorithm solves this in O(√N) queries — offering a proven quadratic quantum speedup.',
          'The Quantum Oracle (U_ω): The search problem is encoded as a boolean black-box function f(x) where f(ω) = 1 for the target item, and f(x) = 0 for all other items.',
          'Phase Inversion Oracle Action:',
          'U_ω|x⟩ = (-1)^(f(x)) |x⟩',
          'The oracle does not measure or read the item. Instead, it marks the target solution by flipping its quantum phase by 180° (multiplying by -1) while leaving non-target states with positive phase (+1).',
          'Why Phase Marking Works: Although measuring the marked state directly still yields uniform probabilities, the negative phase enables the Diffusion Operator to amplify the marked item’s amplitude constructively!',
          'Concrete Example: Imagine searching for one name in a phonebook with 1 million entries. Classically, you flip through ~500,000 pages on average. Grover\'s algorithm finds it in ~1,000 quantum queries — a 500× speedup!',
        ],
        keyInsight: 'Grover\'s √N speedup is provably optimal — no quantum algorithm can search an unstructured database faster. This was proved by Bennett, Bernstein, Brassard, and Vazirani (BBBV theorem).',
        realWorldApplication: 'Grover\'s algorithm threatens symmetric encryption: a 256-bit AES key provides only 128-bit security against a quantum attacker, since Grover reduces brute-force search from 2²⁵⁶ to 2¹²⁸ operations.',
        historicalNote: 'Lov Kumar Grover, a Bell Labs researcher from India, discovered this algorithm in 1996. It remains one of only two known quantum speedups for general problems (the other being Shor\'s).',
        calloutComparison: {
          leftTitle: 'UNMARKED STATES (|x ≠ ω⟩)',
          leftContent: 'f(x) = 0 ⟹ Phase is unchanged (+1)\nAmplitudes stay positive above the mean.',
          rightTitle: 'MARKED TARGET STATE (|ω⟩)',
          rightContent: 'f(ω) = 1 ⟹ Phase is inverted (-1)\nAmplitude flips below the average mean for amplification.',
        },
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[2] q;

// Initialize equal superposition across all 4 basis states
h q[0];
h q[1];
`,
        starterCircuitGates: [
          { name: 'h', qubit: 0, step: 0 },
          { name: 'h', qubit: 1, step: 0 },
        ],
        availableGates: ['h', 'x', 'z', 'cz'],
        numQubits: 2,
        challenge: {
          title: 'Prepare 2-Qubit Uniform Superposition',
          targetDescription: 'Apply Hadamard gates to both wires to prepare an equal superposition over all 4 computational states.',
          mathTarget: '|ψ⟩ = (|00⟩ + |01⟩ + |10⟩ + |11⟩) / 2',
          requirements: [
            'Apply Hadamard (H) to wire q[0]',
            'Apply Hadamard (H) to wire q[1]',
            'Verify equal 25% probability across all 4 basis states',
          ],
          expectedState: '|++⟩',
          expectedProbabilities: { '00': 0.25, '01': 0.25, '10': 0.25, '11': 0.25 },
          xpReward: 200,
        },
        hints: ['Place an H gate on wire q[0] and another H gate on wire q[1].'],
      },
      {
        id: 'g2',
        courseId: 'grover-search',
        number: 2,
        title: 'Phase Inversion Oracle for State |11⟩',
        subtitle: 'The Controlled-Z (CZ) Phase Marking Operator',
        duration: '9 min',
        level: 'Algorithms · Lesson 2 of 7',
        completed: false,
        conceptHeading: 'Controlled-Phase Oracles & The CZ Matrix',
        conceptBody: [
          'How to Mark a Target State: Suppose the secret target item we want to find in our 4-item database is |11⟩ (index 3).',
          'The Controlled-Z (CZ) gate acts as the exact phase oracle for target |11⟩:',
          'CZ Matrix = diag(1, 1, 1, -1)',
          'When applied to the uniform superposition |s⟩ = (|00⟩ + |01⟩ + |10⟩ + |11⟩)/2, CZ multiplies |11⟩ by -1 while leaving all other states positive:',
          'CZ|s⟩ = (|00⟩ + |01⟩ + |10⟩ - |11⟩) / 2',
          'Notice that measuring immediately still yields 25% for all states (|±1/2|² = 1/4). The magic happens in the next step: the Diffusion Operator!',
          'Important Subtlety: The CZ gate marks |11⟩ because it\'s the only basis state where BOTH qubits are |1⟩. To mark a different target (like |01⟩), you would need a different oracle circuit — but the Diffusion Operator remains the same for all targets.',
        ],
        keyInsight: 'The oracle encodes the "answer" into the quantum state through phase, not measurement. This is the key quantum trick: information is stored in the sign (±) of amplitudes, which classical computers cannot access.',
        calloutComparison: {
          leftTitle: 'BEFORE ORACLE (|s⟩)',
          leftContent: 'All amplitudes = +0.50\nMean average amplitude = +0.50',
          rightTitle: 'AFTER CZ ORACLE',
          rightContent: 'Amplitudes: +0.50, +0.50, +0.50, -0.50\nMean drops from +0.50 down to +0.25!',
        },
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[2] q;

// Equal superposition + CZ Oracle for |11⟩
h q[0];
h q[1];
cz q[0], q[1];
`,
        starterCircuitGates: [
          { name: 'h', qubit: 0, step: 0 },
          { name: 'h', qubit: 1, step: 0 },
          { name: 'cz', qubit: 0, step: 1 },
        ],
        availableGates: ['h', 'x', 'z', 'cz'],
        numQubits: 2,
        challenge: {
          title: 'Mark Target State |11⟩ with Controlled-Z',
          targetDescription: 'Prepare the uniform superposition using H gates, then apply a Controlled-Z (CZ) oracle to flip the relative phase of |11⟩ to -1.',
          mathTarget: '|ψ⟩ = (|00⟩ + |01⟩ + |10⟩ - |11⟩) / 2',
          requirements: [
            'Apply H to q[0] and q[1] at step 0',
            'Apply CZ across q[0] and q[1] at step 1',
            'Verify amplitude on |11⟩ is negative while maintaining 25% probabilities',
          ],
          expectedState: 'Marked-|11⟩',
          expectedProbabilities: { '00': 0.25, '01': 0.25, '10': 0.25, '11': 0.25 },
          xpReward: 220,
        },
        hints: ['Place H on q[0] and q[1], then place CZ spanning across both wires.'],
      },
      {
        id: 'g3',
        courseId: 'grover-search',
        number: 3,
        title: 'The Grover Diffusion Operator (Inversion About the Mean)',
        subtitle: 'Amplifying the Marked State Amplitude',
        duration: '10 min',
        level: 'Algorithms · Lesson 3 of 7',
        completed: false,
        conceptHeading: 'Inversion About the Mean & Amplitude Amplification',
        conceptBody: [
          'What is the Diffusion Operator? The Grover Diffusion Operator D reflects all quantum state amplitudes about their average mean: D = 2|s⟩⟨s| - I.',
          'Mathematical Rule for Each Amplitude α_i:',
          'α_i ➔ 2 · μ - α_i   (where μ is the average mean amplitude)',
          'How the Marked State Gets Boosted:',
          '1. Unmarked states have amplitude +0.50 (above the mean μ = +0.25). Their new amplitude is 2(0.25) - 0.50 = 0.00!',
          '2. The marked state |11⟩ has amplitude -0.50 (below the mean). Its new amplitude is 2(0.25) - (-0.50) = +1.00 (100% Probability!)',
          'Circuit Construction of D: D = H ➤ X ➤ CZ ➤ X ➤ H (applied across all qubits).',
          'Geometric Interpretation: On the 2D plane spanned by the target state |ω⟩ and the uniform superposition |s⟩, each Grover iteration rotates the state vector by an angle of 2θ toward |ω⟩, where sin(θ) = 1/√N. After π/(4θ) iterations, the state is nearly aligned with |ω⟩.',
        ],
        keyInsight: 'The Diffusion Operator is NOT searching — it\'s performing constructive interference. Amplitudes below the mean get boosted (constructive), amplitudes above the mean get suppressed (destructive). This is the same wave physics that makes noise-canceling headphones work!',
        realWorldApplication: 'Amplitude amplification is used in quantum finance for Monte Carlo simulations, where Grover-like operators provide quadratic speedups for option pricing and risk analysis.',
        historicalNote: 'The "Inversion about the Mean" was a breakthrough by Lov Grover, transforming the simple phase inversion oracle into a powerful algorithm for global state manipulation.',
        illustrationUrl: '/images/lessons/grover_amplification.jpg',
        illustrationCaption: 'Amplitude Amplification: Uniform 25% distribution amplified to 100% target probability via phase inversion and diffusion.',
        calloutComparison: {
          leftTitle: 'UNMARKED STATES (|00⟩, |01⟩, |10⟩)',
          leftContent: 'Amplitude cancels out from +0.50 to 0.00.\nMeasurement probability collapses to 0%.',
          rightTitle: 'MARKED TARGET STATE (|11⟩)',
          rightContent: 'Amplitude surges from -0.50 to +1.00.\nMeasurement probability reaches exactly 100%!',
        },
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[2] q;

// Grover Diffusion Operator: H -> X -> CZ -> X -> H
h q[0];
h q[1];
x q[0];
x q[1];
cz q[0], q[1];
x q[0];
x q[1];
h q[0];
h q[1];
`,
        starterCircuitGates: [
          { name: 'h', qubit: 0, step: 0 },
          { name: 'h', qubit: 1, step: 0 },
          { name: 'x', qubit: 0, step: 1 },
          { name: 'x', qubit: 1, step: 1 },
          { name: 'cz', qubit: 0, step: 2 },
          { name: 'x', qubit: 0, step: 3 },
          { name: 'x', qubit: 1, step: 3 },
          { name: 'h', qubit: 0, step: 4 },
          { name: 'h', qubit: 1, step: 4 },
        ],
        availableGates: ['h', 'x', 'z', 'cz'],
        numQubits: 2,
        challenge: {
          title: 'Implement the Grover Diffusion Operator',
          targetDescription: 'Construct the full 2-qubit Diffusion Operator D = H · X · CZ · X · H across wires q[0] and q[1].',
          mathTarget: 'D = 2|s⟩⟨s| - I',
          requirements: [
            'Apply H on both wires',
            'Apply X on both wires',
            'Apply CZ across both wires',
            'Apply X on both wires',
            'Apply H on both wires',
          ],
          expectedState: '|00⟩',
          expectedProbabilities: { '00': 1.0 },
          xpReward: 250,
        },
        hints: ['Follow the sandwich pattern: H, X, CZ, X, H on both wires.'],
      },
      {
        id: 'g4',
        courseId: 'grover-search',
        number: 4,
        title: 'Complete 2-Qubit Grover Search Circuit',
        subtitle: '100% Deterministic Search in a Single Iteration',
        duration: '11 min',
        level: 'Algorithms · Lesson 4 of 7',
        completed: false,
        conceptHeading: 'The End-to-End Grover Search Algorithm',
        conceptBody: [
          'The Miracle of N = 4: For a 2-qubit database of 4 items, Grover’s algorithm finds the target state with EXACTLY 100.0% probability in just ONE single query (k = 1)!',
          'Full Algorithm Execution Sequence:',
          '1. State Initialization: Start in |00⟩.',
          '2. Uniform Superposition: Apply H on q[0] and q[1] ⟹ |s⟩.',
          '3. Oracle Query (U_ω): Apply CZ to mark target |11⟩ ⟹ (|00⟩ + |01⟩ + |10⟩ - |11⟩)/2.',
          '4. Diffusion Operator (D): Apply H ➔ X ➔ CZ ➔ X ➔ H.',
          '5. Final Measurement: The state collapses to |11⟩ with 100% fidelity!',
          'Comparison to Classical: Classically, searching 4 unsorted boxes requires inspecting up to 4 boxes (average 2.25). Grover does it in 1 quantum step!',
        ],
        keyInsight: 'For N = 4 database items, Grover\'s algorithm achieves 100% success probability in a single iteration. This is a rare case of exact quantum search without any probabilistic residual error.',
        realWorldApplication: 'Hardware implementations of 2-qubit Grover search have been demonstrated on IBM Quantum, Rigetti, and IonQ trapped-ion processors with >90% experimental fidelity.',
        historicalNote: 'Grover\'s algorithm was first physically demonstrated on NMR quantum computers in 1998 by Chuang, Gershenfeld, and Kubinec at MIT.',
        illustrationUrl: '/images/lessons/grover_amplification.jpg',
        illustrationCaption: 'Complete Grover Circuit: Superposition + Phase Oracle + Diffusion leads to 100% deterministic measurement.',
        predictionCheckpoint: {
          question: 'Classically, searching an unsorted database of N = 4 items takes up to 4 checks. How many quantum queries does Grover\'s algorithm need?',
          options: ['4 queries', '2 queries', 'Exactly 1 query (100% deterministic)', '0 queries'],
          correctIndex: 2,
          explanation: 'For N = 4, Grover\'s optimal iteration count is k = (π/4)√4 = 1.57 ≈ 1. In exactly 1 quantum query, the probability of measuring the target state reaches 100.0%!'
        },
        calloutComparison: {
          leftTitle: 'CLASSICAL QUERY COMPLEXITY',
          leftContent: 'Worst-case: 4 queries\nAverage-case: 2.25 queries\nStrictly sequential linear search O(N).',
          rightTitle: 'QUANTUM SPEEDUP',
          rightContent: 'Exact 1 query on N = 4!\n100% deterministic target discovery via constructive interference.',
        },
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[2] q;

// 1. Uniform Superposition
h q[0];
h q[1];

// 2. Oracle for |11⟩
cz q[0], q[1];

// 3. Diffusion Operator
h q[0];
h q[1];
x q[0];
x q[1];
cz q[0], q[1];
x q[0];
x q[1];
h q[0];
h q[1];
`,
        starterCircuitGates: [
          { name: 'h', qubit: 0, step: 0 },
          { name: 'h', qubit: 1, step: 0 },
          { name: 'cz', qubit: 0, step: 1 },
          { name: 'h', qubit: 0, step: 2 },
          { name: 'h', qubit: 1, step: 2 },
          { name: 'x', qubit: 0, step: 3 },
          { name: 'x', qubit: 1, step: 3 },
          { name: 'cz', qubit: 0, step: 4 },
          { name: 'x', qubit: 0, step: 5 },
          { name: 'x', qubit: 1, step: 5 },
          { name: 'h', qubit: 0, step: 6 },
          { name: 'h', qubit: 1, step: 6 },
        ],
        availableGates: ['h', 'x', 'z', 'cz'],
        numQubits: 2,
        challenge: {
          title: 'Execute Complete Grover Search for |11⟩',
          targetDescription: 'Construct the full Grover search circuit: Superposition (H) + Oracle (CZ) + Diffusion (H-X-CZ-X-H) to measure target |11⟩ with 100% probability.',
          mathTarget: '|ψ⟩ = |11⟩ (100% Probability)',
          requirements: [
            'Initialize with H on both wires',
            'Apply CZ Oracle at step 1',
            'Apply full Diffusion sequence on both wires',
            'Achieve 100% measurement probability for outcome 11',
          ],
          expectedState: '|11⟩',
          expectedProbabilities: { '11': 1.0 },
          xpReward: 300,
        },
        hints: ['Step sequence: Superposition (H) ➔ Oracle (CZ) ➔ Diffusion (H, X, CZ, X, H).'],
      },
      {
        id: 'g5',
        courseId: 'grover-search',
        number: 5,
        title: 'Searching for Arbitrary Target States (|00⟩, |01⟩, |10⟩)',
        subtitle: 'Synthesizing Custom Oracles with Bit-Flip Wrapping',
        duration: '10 min',
        level: 'Algorithms · Lesson 5 of 7',
        completed: false,
        conceptHeading: 'Custom Oracle Construction for Any Database Key',
        conceptBody: [
          'How to Search for Keys Other Than |11⟩: The CZ gate naturally marks |11⟩ because it only activates when both control and target qubits are 1.',
          'To search for any arbitrary target state |x_0 x_1⟩, we wrap the CZ gate with Pauli-X bit flips on wires where the target bit is 0:',
          '1. Target |11⟩: CZ',
          '2. Target |10⟩: X on q[1] ➔ CZ ➔ X on q[1]',
          '3. Target |01⟩: X on q[0] ➔ CZ ➔ X on q[0]',
          '4. Target |00⟩: X on both wires ➔ CZ ➔ X on both wires',
          'By transforming the desired target into |11⟩ before CZ and un-flipping afterwards, Grover’s algorithm can locate ANY item in the database!',
        ],
        keyInsight: 'Wrapping the CZ oracle in Pauli-X gates transforms the target state into |11⟩ during the oracle query, then restores the original basis encoding — a universal technique for constructing arbitrary boolean quantum oracles.',
        realWorldApplication: 'Oracle compilation is a core task in quantum compilers like Qiskit and Cirq, automatically transforming high-level classical boolean expressions into gate-efficient quantum circuits.',
        calloutComparison: {
          leftTitle: 'TARGET |00⟩ ORACLE',
          leftContent: 'Wrap both wires in X gates around CZ:\nX(q0)·X(q1) ➔ CZ ➔ X(q0)·X(q1)',
          rightTitle: 'TARGET |01⟩ ORACLE',
          rightContent: 'Wrap wire 0 in X gates around CZ:\nX(q0) ➔ CZ ➔ X(q0)',
        },
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[2] q;

// Superposition + Oracle for |00⟩ + Diffusion
h q[0];
h q[1];

// Oracle for |00⟩
x q[0];
x q[1];
cz q[0], q[1];
x q[0];
x q[1];

// Diffusion
h q[0];
h q[1];
x q[0];
x q[1];
cz q[0], q[1];
x q[0];
x q[1];
h q[0];
h q[1];
`,
        starterCircuitGates: [
          { name: 'h', qubit: 0, step: 0 },
          { name: 'h', qubit: 1, step: 0 },
          { name: 'x', qubit: 0, step: 1 },
          { name: 'x', qubit: 1, step: 1 },
          { name: 'cz', qubit: 0, step: 2 },
          { name: 'x', qubit: 0, step: 3 },
          { name: 'x', qubit: 1, step: 3 },
        ],
        availableGates: ['h', 'x', 'z', 'cz'],
        numQubits: 2,
        challenge: {
          title: 'Search for Target State |00⟩',
          targetDescription: 'Construct a customized Grover circuit that uses an X-wrapped oracle to locate target item |00⟩ with 100% probability.',
          mathTarget: '|ψ⟩ = |00⟩ (100% Probability)',
          requirements: [
            'Apply H to both wires at step 0',
            'Apply X to both wires, then CZ, then X to both wires (Oracle for |00⟩)',
            'Apply full Diffusion sequence',
            'Verify outcome measurement P(00) = 100%',
          ],
          expectedState: '|00⟩',
          expectedProbabilities: { '00': 1.0 },
          xpReward: 280,
        },
        hints: ['Wrap CZ with X gates on both wires to mark state |00⟩.'],
      },
      {
        id: 'g6',
        courseId: 'grover-search',
        number: 6,
        title: 'Geometric Interpretation & Optimal Iterations',
        subtitle: 'Rotation in the 2D Subspace & The Over-Rotation Hazard',
        duration: '10 min',
        level: 'Algorithms · Lesson 6 of 7',
        completed: false,
        conceptHeading: 'Grover Rotations & The Optimal Stopping Point',
        conceptBody: [
          '2D Subspace Geometry: Grover’s algorithm can be visualized as a rotation in a 2-dimensional plane spanned by the uniform superposition |s⟩ and the target solution |ω⟩.',
          'Each Grover iteration (G = D · U_ω) rotates the statevector towards the target by an angle of θ = 2 arcsin(1/√N) ≈ 2/√N.',
          'Optimal Iteration Formula:',
          'k ≈ (π / 4) · √N',
          'The Over-Rotation Hazard: Quantum search is NOT like classical search where more steps always give better results! If you run Grover past the optimal iteration count k, the statevector continues rotating PAST the target state, and success probability DROPS back towards zero!',
        ],
        keyInsight: 'Unlike classical algorithms where running longer always improves or maintains accuracy, Grover\'s statevector rotates continuously in Hilbert space. Over-rotation is a purely quantum phenomenon.',
        realWorldApplication: 'Quantum algorithm designers must compute the exact optimal iteration count k ≈ (π/4)√N before execution to prevent probability dissipation.',
        calloutComparison: {
          leftTitle: 'OPTIMAL ITERATIONS (k ≈ π/4 √N)',
          leftContent: 'Statevector aligns precisely with target |ω⟩.\nSuccess probability reaches maximum peak (≈ 100%).',
          rightTitle: 'OVER-ROTATION HAZARD',
          rightContent: 'Running extra iterations rotates past |ω⟩.\nSuccess probability oscillates and collapses to zero!',
        },
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[2] q;

// Verify 1 optimal iteration for N=4
h q[0];
h q[1];
cz q[0], q[1];
h q[0];
h q[1];
x q[0];
x q[1];
cz q[0], q[1];
x q[0];
x q[1];
h q[0];
h q[1];
`,
        starterCircuitGates: [
          { name: 'h', qubit: 0, step: 0 },
          { name: 'h', qubit: 1, step: 0 },
        ],
        availableGates: ['h', 'x', 'z', 'cz'],
        numQubits: 2,
        challenge: {
          title: 'Calculate & Execute Optimal Iteration Count',
          targetDescription: 'For N = 4 database items, verify that k = (π/4)·√4 = 1.57 ≈ 1 iteration yields the maximum 100% success probability.',
          mathTarget: 'k_opt = round((π/4) · √4) = 1 Iteration',
          requirements: [
            'Execute exactly 1 Grover iteration on 2 qubits',
            'Verify maximum fidelity on target state |11⟩',
          ],
          expectedState: '|11⟩',
          expectedProbabilities: { '11': 1.0 },
          xpReward: 260,
        },
        hints: ['1 iteration is optimal for 2 qubits (N = 4).'],
      },
      {
        id: 'g7',
        courseId: 'grover-search',
        number: 7,
        title: 'Amplitude Amplification & Quantum Counting',
        subtitle: 'Generalizing Grover to Unstructured Problems & OpenQASM 3.0',
        duration: '12 min',
        level: 'Algorithms · Lesson 7 of 7',
        completed: false,
        conceptHeading: 'Generalized Amplitude Amplification & Beyond',
        conceptBody: [
          'From Search to General Quantum Speedups: Grover’s algorithm is a special case of a broader technique called Amplitude Amplification (Brassard et al., 2000).',
          'Any quantum algorithm with a small probability p of success can be amplified to near 100% certainty in O(1/√p) steps, compared to classical O(1/p) repetition!',
          'Key Applications:',
          '1. Quantum Counting: Combining Grover with Quantum Phase Estimation (QPE) allows counting the exact number of solutions M in an unsorted database in O(√(N/M)) queries.',
          '2. Collision Finding & Element Distinctness: Finding duplicate items in O(N^(2/3)) queries (Brassard-Høyer-Tapp).',
          '3. Boolean Satisfiability (3-SAT): Accelerating NP-complete constraint satisfaction solvers.',
        ],
        keyInsight: 'Amplitude Amplification generalizes Grover\'s search to any quantum heuristic algorithm: if an algorithm has a success probability p, amplitude amplification boosts it to ~100% in O(1/√p) iterations.',
        realWorldApplication: 'Used in quantum chemistry algorithms (VQE / QPE) to amplify the ground state overlap when preparing molecular trial states.',
        historicalNote: 'Gilles Brassard, Peter Høyer, Michele Mosca, and Alain Tapp generalized Grover\'s search into Amplitude Amplification in their milestone 2000 paper.',
        calloutComparison: {
          leftTitle: 'CLASSICAL REPETITION',
          leftContent: 'Success probability p ⟹ requires O(1/p) runs.\nExponentially expensive for small p.',
          rightTitle: 'AMPLITUDE AMPLIFICATION',
          rightContent: 'Success probability p ⟹ requires O(1/√p) runs.\nQuadratic speedup on arbitrary quantum subroutines!',
        },
        starterQasm: `OPENQASM 3.0;
include "stdgates.inc";

qubit[2] q;

// Master Grover Circuit: Statevector Amplification
h q[0];
h q[1];
cz q[0], q[1];
h q[0];
h q[1];
x q[0];
x q[1];
cz q[0], q[1];
x q[0];
x q[1];
h q[0];
h q[1];
`,
        starterCircuitGates: [
          { name: 'h', qubit: 0, step: 0 },
          { name: 'h', qubit: 1, step: 0 },
          { name: 'cz', qubit: 0, step: 1 },
          { name: 'h', qubit: 0, step: 2 },
          { name: 'h', qubit: 1, step: 2 },
          { name: 'x', qubit: 0, step: 3 },
          { name: 'x', qubit: 1, step: 3 },
          { name: 'cz', qubit: 0, step: 4 },
          { name: 'x', qubit: 0, step: 5 },
          { name: 'x', qubit: 1, step: 5 },
          { name: 'h', qubit: 0, step: 6 },
          { name: 'h', qubit: 1, step: 6 },
        ],
        availableGates: ['h', 'x', 'z', 'cz'],
        numQubits: 2,
        challenge: {
          title: 'Master Amplitude Amplification Challenge',
          targetDescription: 'Synthesize the complete amplitude amplification sequence to amplify marked state |11⟩ from 25% up to 100% fidelity.',
          mathTarget: '|ψ⟩ = |11⟩ (Amplify 25% ➔ 100%)',
          requirements: [
            'Construct full Grover iteration in OpenQASM 3.0',
            'Verify 100% measurement probability for outcome 11',
            'Earn your Course 4 Mastery Badge',
          ],
          expectedState: '|11⟩',
          expectedProbabilities: { '11': 1.0 },
          xpReward: 350,
        },
        hints: ['Run the complete Superposition + Oracle + Diffusion sequence.'],
      },
    ],
  },
];
