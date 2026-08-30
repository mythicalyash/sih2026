# Measurement & the Born Rule

**Category:** Foundations | **Est. Reading Time:** 14 min

## Learning Objectives

- Formulate projective measurements using Hermitian observables and the Born Rule.
- Compute expectation values $\langle A \rangle$ and post-measurement state collapse.
- Distinguish between computational Z-basis, Hadamard X-basis, and generalized POVM measurements.

---

## 1. The Postulates of Quantum Measurement

While unitary evolution is smooth, continuous, and reversible, measurement in quantum mechanics is inherently non-unitary, stochastic, and irreversible. Physical observables correspond to **Hermitian operators** $A = A^\dagger$, which possess real eigenvalues $\lambda_i$ and an orthonormal set of eigenvectors $|v_i\rangle$ such that:

$$A = \sum_i \lambda_i |v_i\rangle\langle v_i|$$

When an observable $A$ is measured on a state $|\psi\rangle$, the only possible experimental outcome is one of the eigenvalues $\lambda_i$.

## 2. The Born Rule and State Collapse

Formulated by Max Born in 1926, the **Born Rule** states that the probability $P(\lambda_i)$ of measuring eigenvalue $\lambda_i$ is given by the squared inner product projection:

$$P(\lambda_i) = |\langle v_i | \psi \rangle|^2 = \langle \psi | P_i | \psi \rangle$$

where $P_i = |v_i\rangle\langle v_i|$ is the projection operator onto the eigenspace of $\lambda_i$.

Immediately following measurement, the wavefunction experiences **state collapse** (von Neumann projection). The post-measurement state vector jumps instantaneously to the corresponding eigenvector:

$$|\psi'\rangle = \frac{P_i |\psi\rangle}{\sqrt{P(\lambda_i)}} = |v_i\rangle$$

Subsequent measurements of the same observable immediately thereafter will yield outcome $\lambda_i$ with 100% certainty.

## 3. Expectation Values and Changing Measurement Basis

The statistical average of many measurements performed on identically prepared states is the **expectation value** $\langle A \rangle$:

$$\langle A \rangle = \langle \psi | A | \psi \rangle = \sum_i \lambda_i P(\lambda_i)$$

Standard quantum hardware measures solely in the computational $Z$-basis ($\{|0\rangle, |1\rangle\}$). To measure an observable in a different basis (e.g., $X$-basis $\{|+\rangle, |-\rangle\}$), one applies a unitary basis rotation before readout. For instance, applying a Hadamard gate $H$ before Z-measurement effectively measures in the $X$-basis because $H|0\rangle = |+\rangle$ and $H|1\rangle = |-\rangle$.

## Key Equations & Formulas

### The Born Rule
*Probability of obtaining measurement outcome m with projector |m⟩⟨m|*

$$
P(m) = |\langle m | \psi \rangle|^2 = \langle\psi|m\rangle\langle m|\psi\rangle
$$

### Quantum Expectation Value
*Average outcome of measuring Hermitian observable A over an ensemble*

$$
\langle A \rangle = \langle \psi | A | \psi \rangle = \text{Tr}(A |\psi\rangle\langle\psi|)
$$

### Wavefunction Collapse Postulate
*Instantaneous projection of statevector into measured eigenspace*

$$
|\psi\rangle \xrightarrow{\text{Measurement } m} |\psi_m\rangle = \frac{|m\rangle\langle m|\psi\rangle}{\sqrt{P(m)}} = e^{i\theta}|m\rangle
$$

## Summary & Key Takeaways

- Physical observables are represented by Hermitian operators $A = A^\dagger$ with real eigenvalues.
- The Born Rule dictates that measurement probabilities equal the square magnitude of projection amplitudes: $P(m) = |\langle m|\psi\rangle|^2$.
- Measurement irreversibly collapses the statevector into the specific eigenstate associated with the measured eigenvalue.
- Measuring in non-computational bases is achieved by applying unitary basis-change gates prior to standard Z-readout.

## Practice Questions & Self-Assessment

### Question 1

Given the state |ψ⟩ = (1/2)|0⟩ + (√3/2)|1⟩, what is the expectation value ⟨Z⟩ of the Pauli-Z operator?

A) +0.5
B) -0.5
C) 0.0
D) -0.75

**Answer:** ⟨Z⟩ = -0.5.

**Explanation:** Pauli-Z has eigenvalues +1 for |0⟩ and -1 for |1⟩. ⟨Z⟩ = (+1)|1/2|² + (-1)|√3/2|² = 1/4 - 3/4 = -2/4 = -0.5.

### Question 2

How do you measure a physical qubit in the Y-basis using a standard Z-basis readout detector?

A) Apply an S† gate followed by a Hadamard gate (H S†) before measuring in Z.
B) Apply an X gate followed by a CNOT.
C) Apply a T gate directly before measurement.
D) Z-basis detectors can measure Y-basis without any gate rotation.

**Answer:** Apply S† gate then Hadamard gate H (HS†) before measuring.

**Explanation:** S† rotates the Y-axis onto the X-axis (mapping |±i⟩ to |±⟩), and the subsequent Hadamard gate rotates the X-axis onto the Z-axis (mapping |±⟩ to |0⟩, |1⟩).

## References & Pedagogical Sources

- MIT OpenCourseWare 8.04: Quantum Physics I — Observables and Measurement Postulates
- Qiskit Textbook: "Quantum States and Qubits — Measurement" (IBM Quantum)
- OpenStax University Physics Vol 3: Chapter 7.2 (Wavefunction and Probability)
