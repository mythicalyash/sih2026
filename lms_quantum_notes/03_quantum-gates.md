# Quantum Gates (X, H, CNOT, & Universality)

**Category:** Gates & Circuits | **Est. Reading Time:** 16 min

## Learning Objectives

- Understand unitary operators and why quantum evolution must be reversible.
- Represent Pauli gates (X, Y, Z), Hadamard (H), and Phase gates (S, T) as matrices and geometric rotations.
- Analyze multi-qubit entangling gates including CNOT, CZ, and SWAP, and define universal gate sets.

---

## 1. Unitarity and Quantum Reversibility

In closed quantum systems, state evolution is governed by the time-dependent Schrödinger equation. This requires that all quantum logic gates be represented by **unitary operators** $U$. A matrix is unitary if its conjugate transpose $U^\dagger$ is its inverse:

$$U^\dagger U = U U^\dagger = I$$

Unitarity ensures that statevector norms (total probability of 1) are preserved during computation. Because every unitary matrix is invertible, all quantum operations (prior to measurement) are strictly **reversible**—no information is lost.

## 2. Single-Qubit Elementary Gates

Single-qubit gates are represented by $2 \times 2$ unitary matrices:

- **Pauli-X (Quantum NOT / Bit Flip):** Rotates $\pi$ radians around X-axis.
  $$X = \begin{pmatrix} 0 & 1 \\ 1 & 0 \end{pmatrix}, \quad X|0\rangle = |1\rangle, \quad X|1\rangle = |0\rangle$$

- **Pauli-Z (Phase Flip):** Rotates $\pi$ radians around Z-axis, inverting the phase of $|1\rangle$.
  $$Z = \begin{pmatrix} 1 & 0 \\ 0 & -1 \end{pmatrix}, \quad Z|0\rangle = |0\rangle, \quad Z|1\rangle = -|1\rangle$$

- **Pauli-Y:** Combines bit and phase flips ($Y = iXZ$).
  $$Y = \begin{pmatrix} 0 & -i \\ i & 0 \end{pmatrix}$$

- **Hadamard Gate ($H$):** Maps computational basis to equatorial superposition states.
  $$H = \frac{1}{\sqrt{2}}\begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}, \quad H|0\rangle = |+\rangle, \quad H|1\rangle = |-\rangle$$

- **Phase Gates ($S$ and $T$):** Rotate around Z-axis by $\pi/2$ and $\pi/4$ respectively. The $T$-gate ($T = \text{diag}(1, e^{i\pi/4})$) is crucial for fault-tolerant non-Clifford universal computation.

## 3. Multi-Qubit Gates and Universality

Two-qubit gates operate on the 4-dimensional tensor product space $\mathbb{C}^4$. The canonical two-qubit gate is the **Controlled-NOT (CNOT / CX)** gate:

$$\text{CNOT} = \begin{pmatrix} 1 & 0 & 0 & 0 \\ 0 & 1 & 0 & 0 \\ 0 & 0 & 0 & 1 \\ 0 & 0 & 1 & 0 \end{pmatrix}, \quad \text{CNOT}|c, t\rangle = |c, t \oplus c\rangle$$

If the control qubit $|c\rangle$ is $|1\rangle$, the target qubit $|t\rangle$ is inverted; if $|c\rangle$ is $|0\rangle$, $|t\rangle$ is unchanged. When applied to superpositions, CNOT creates quantum entanglement.

The **Solovay-Kitaev Theorem** establishes that any arbitrary $n$-qubit unitary operation can be approximated to arbitrary precision $\epsilon$ using a finite universal gate set, such as $\{H, T, \text{CNOT}\}$.

## Key Equations & Formulas

### Pauli Matrices & Hadamard
*Fundamental single-qubit transformations*

$$
X = \begin{pmatrix} 0 & 1 \\ 1 & 0 \end{pmatrix}, \quad Z = \begin{pmatrix} 1 & 0 \\ 0 & -1 \end{pmatrix}, \quad H = \frac{1}{\sqrt{2}}\begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}
$$

### CNOT Matrix (Control=q0, Target=q1)
*Reversible controlled bit-flip entangling operation*

$$
\text{CNOT} = |0\rangle\langle 0| \otimes I + |1\rangle\langle 1| \otimes X = \begin{pmatrix} 1 & 0 & 0 & 0 \\ 0 & 1 & 0 & 0 \\ 0 & 0 & 0 & 1 \\ 0 & 0 & 1 & 0 \end{pmatrix}
$$

### Hadamard Algebraic Identities
*Hadamard acts as a basis-transformation between X and Z bases*

$$
H^2 = I, \quad HXH = Z, \quad HZH = X
$$

## Summary & Key Takeaways

- Quantum gate operations are represented by unitary matrices satisfying $U^\dagger U = I$, preserving total probability and ensuring reversibility.
- Pauli gates ($X, Y, Z$) execute $\pi$-rotations around the Cartesian axes of the Bloch sphere.
- The Hadamard gate $H$ generates balanced superposition and interchanges $X$ and $Z$ observables ($HXH=Z$).
- The CNOT gate acts on 2 qubits to perform controlled bit flips and is the primary tool for engineering entanglement.

## Practice Questions & Self-Assessment

### Question 1

What state is produced when a Hadamard gate is applied to the state |+⟩?

A) |0⟩
B) |1⟩
C) |−⟩
D) |+i⟩

**Answer:** H|+⟩ = |0⟩.

**Explanation:** Since |+⟩ = H|0⟩ and H is its own inverse (H² = I), applying H to |+⟩ returns H(H|0⟩) = I|0⟩ = |0⟩.

### Question 2

Calculate the output of a CNOT gate with input state (|0⟩ + |1⟩)/√2 ⊗ |0⟩.

A) (|00⟩ + |10⟩)/√2
B) (|00⟩ + |11⟩)/√2
C) (|01⟩ + |10⟩)/√2
D) |11⟩

**Answer:** (|00⟩ + |11⟩)/√2, which is the canonical Bell state |Φ⁺⟩.

**Explanation:** Expanding the input: (|00⟩ + |10⟩)/√2. CNOT leaves |00⟩ unchanged and maps |10⟩ to |11⟩. The result is the entangled state (|00⟩ + |11⟩)/√2.

## References & Pedagogical Sources

- Qiskit Textbook: "Multiple Qubits and Entangled States" (IBM Quantum)
- MIT OpenCourseWare 8.05: Quantum Physics II (Unitary Transformations)
- OpenStax University Physics Vol 3: Modern Physics
