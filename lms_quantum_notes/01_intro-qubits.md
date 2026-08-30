# Introduction to Quantum States & Qubits

**Category:** Foundations | **Est. Reading Time:** 12 min

## Learning Objectives

- Contrast classical binary bits with quantum two-level systems (qubits).
- Understand statevector representation and Dirac ket notation $|\psi\rangle$.
- Apply state normalization and compute measurement probabilities using complex probability amplitudes.

---

## 1. From Classical Bits to Qubits

In classical computing, the fundamental atom of information is the binary digit (**bit**), physically realized as discrete high or low voltage levels representing either $0$ or $1$. A classical system is deterministic and mutually exclusive: at any instant, an inspected bit is definitively in one state.

Quantum computing introduces the **qubit** (quantum bit), an idealized two-level quantum mechanical system. Unlike a classical bit, a qubit can occupy state $|0\rangle$, state $|1\rangle$, or any arbitrary continuous complex linear combination of both. Physical realizations include the spin-$1/2$ magnetic dipole of an electron, circular polarization modes of single photons, or the quantized flux and charge states of superconducting transmon circuits cooled to millikelvin temperatures.

## 2. Dirac Notation and the Statevector

We represent quantum states using Paul Dirac's **bra-ket notation**. A statevector is written as a column vector (a *ket*) $|\psi\rangle$ in a two-dimensional complex Hilbert space $\mathbb{C}^2$:

$$|\psi\rangle = \alpha |0\rangle + \beta |1\rangle = \alpha \begin{pmatrix} 1 \\ 0 \end{pmatrix} + \beta \begin{pmatrix} 0 \\ 1 \end{pmatrix} = \begin{pmatrix} \alpha \\ \beta \end{pmatrix}$$

Here, $|0\rangle$ and $|1\rangle$ form the canonical orthonormal **computational basis**, analogous to Cartesian basis vectors $\hat{x}$ and $\hat{y}$. The coefficients $\alpha, \beta \in \mathbb{C}$ are **probability amplitudes**. While the amplitudes themselves are complex numbers carrying phase information, the probability $P$ of measuring a specific basis state upon projective readout is given by the squared magnitude of its amplitude: $P(0) = |\alpha|^2$ and $P(1) = |\beta|^2$.

## 3. Normalization and Conservation of Probability

Because physical measurement must yield a definitive outcome with total certainty, the sum of all mutually exclusive measurement probabilities must equal 1. This imposes the fundamental **normalization condition**:

$$|\alpha|^2 + |\beta|^2 = 1$$

Geometric vectors representing pure quantum states are unit vectors on the unit sphere in $\mathbb{C}^2$. Furthermore, an overall global phase factor $e^{i\gamma}$ does not affect measurement statistics ($|e^{i\gamma}\alpha|^2 = |\alpha|^2$), meaning states $|\psi\rangle$ and $e^{i\gamma}|\psi\rangle$ represent identical physical realities.

## Key Equations & Formulas

### General Qubit Statevector
*Linear combination of computational basis states with complex amplitudes*

$$
|\psi\rangle = \alpha |0\rangle + \beta |1\rangle = \begin{pmatrix} \alpha \\ \beta \end{pmatrix}
$$

### Normalization Constraint
*Conservation of total measurement probability*

$$
\langle\psi|\psi\rangle = |\alpha|^2 + |\beta|^2 = 1
$$

### Basis Vector Definitions
*Standard orthonormal Z-basis*

$$
|0\rangle = \begin{pmatrix} 1 \\ 0 \end{pmatrix}, \quad |1\rangle = \begin{pmatrix} 0 \\ 1 \end{pmatrix}
$$

## Summary & Key Takeaways

- A classical bit is restricted to discrete states {0, 1}, whereas a qubit exists as a normalized statevector in a 2D complex Hilbert space.
- Dirac notation denotes statevectors as kets $|\psi\rangle$ and dual vectors as bras $\langle\psi|$.
- Complex probability amplitudes $\alpha, \beta$ determine measurement probabilities via $P(0) = |\alpha|^2$ and $P(1) = |\beta|^2$.
- The normalization condition $|\alpha|^2 + |\beta|^2 = 1$ ensures conservation of probability.

## Practice Questions & Self-Assessment

### Question 1

Given the unnormalized quantum state $|\psi\rangle = 3|0\rangle - 4i|1\rangle$, what is the normalized statevector and the probability of measuring $|1\rangle$?

A) Normalized: (3/5)|0⟩ - (4i/5)|1⟩, Probability P(1) = 16/25 (64%)
B) Normalized: (3/7)|0⟩ - (4i/7)|1⟩, Probability P(1) = 4/7 (57%)
C) Normalized: (3/√7)|0⟩ - (4i/√7)|1⟩, Probability P(1) = 16/49 (32%)
D) Normalized: (1/2)|0⟩ - (√3/2)i|1⟩, Probability P(1) = 3/4 (75%)

**Answer:** Normalized state: |ψ⟩ = (3/5)|0⟩ - (4i/5)|1⟩; P(1) = 16/25 = 0.64 (64%).

**Explanation:** Compute the norm: ||ψ|| = √(3² + |-4i|²) = √(9 + 16) = √25 = 5. Dividing each amplitude by 5 yields α = 3/5 and β = -4i/5. The probability of measuring 1 is |β|² = |-4i/5|² = (4/5)² = 16/25 = 64%.

### Question 2

Why does an overall global phase factor e^(iγ) have no observable physical consequence?

A) Because quantum computers only operate with real numbers.
B) Because measurement probabilities depend on |e^(iγ) α|² = |e^(iγ)|² |α|² = 1 · |α|² = |α|².
C) Because global phase cancels only when applying a Hadamard gate.
D) Because global phase is eliminated by environmental decoherence immediately.

**Answer:** Measurement probabilities and expectation values depend on the absolute square of inner products, where |e^(iγ)|² = 1.

**Explanation:** For any observable operator A, ⟨ψ| e^(-iγ) A e^(iγ) |ψ⟩ = ⟨ψ| A |ψ⟩. Thus, all statistical observables remain identical under global phase transformations.

## References & Pedagogical Sources

- Qiskit Textbook: "The Atoms of Computation" & "Representing Qubit States" (IBM Quantum)
- MIT OpenCourseWare 8.04: Quantum Physics I (Prof. Barton Zwiebach)
- OpenStax University Physics Volume 3: Chapter 7 (Quantum Mechanics)
