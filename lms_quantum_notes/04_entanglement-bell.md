# Quantum Entanglement & Bell States

**Category:** Foundations | **Est. Reading Time:** 15 min

## Learning Objectives

- Differentiate mathematically between separable product states and non-separable entangled states.
- Construct and characterize the four maximally entangled two-qubit Bell states.
- Understand the Einstein-Podolsky-Rosen (EPR) paradox and the significance of Bell inequality violations.

---

## 1. Separability vs. Entanglement

For a composite system of two qubits $A$ and $B$, the combined statevector lives in the tensor product Hilbert space $\mathcal{H}_A \otimes \mathcal{H}_B \cong \mathbb{C}^4$. 

A composite state $|\psi\rangle_{AB}$ is **separable** (a product state) if and only if it can be factored into individual single-qubit states:

$$|\psi\rangle_{AB} = |\phi\rangle_A \otimes |\chi\rangle_B$$

When a joint state cannot be decomposed in this manner, the qubits are **entangled**. In an entangled state, individual qubits have no well-defined standalone quantum state; the complete physical description exists exclusively in the correlations between the constituent subsystems.

## 2. The Four Maximally Entangled Bell States

The **Bell basis** comprises four orthonormal, maximally entangled two-qubit states that span the entire 4D space:

$$\begin{aligned}
|\Phi^+\rangle &= \frac{|00\rangle + |11\rangle}{\sqrt{2}}, \quad &|\Phi^-\rangle &= \frac{|00\rangle - |11\rangle}{\sqrt{2}} \\
|\Psi^+\rangle &= \frac{|01\rangle + |10\rangle}{\sqrt{2}}, \quad &|\Psi^-\rangle &= \frac{|01\rangle - |10\rangle}{\sqrt{2}}
\end{aligned}$$

To prepare the canonical Bell state $|\Phi^+\rangle$ on a quantum circuit:
1. Initialize two qubits in ground state $|00\rangle$.
2. Apply a Hadamard gate to qubit 0: $\frac{|0\rangle + |1\rangle}{\sqrt{2}} \otimes |0\rangle = \frac{|00\rangle + |10\rangle}{\sqrt{2}}$.
3. Apply a CNOT gate with qubit 0 as control and qubit 1 as target $\rightarrow \frac{|00\rangle + |11\rangle}{\sqrt{2}}$.

## 3. EPR Paradox and Bell Inequality Violation

In 1935, Einstein, Podolsky, and Rosen (EPR) posited that if quantum mechanics were complete, entangled measurements would imply "spooky action at a distance," suggesting the existence of local hidden variables.

In 1964, John Stewart Bell proved mathematically that any physical theory based on **local realism** must satisfy strict statistical bounds (the **Bell-CHSH inequality**, $|S| \le 2$). Quantum mechanics predicts a maximal violation up to the **Tsirelson bound** $S = 2\sqrt{2} \approx 2.828$. Decades of loophole-free experimental tests (honored by the 2022 Nobel Prize in Physics) proved local hidden variables false: entanglement represents an intrinsic, non-local feature of nature.

## Key Equations & Formulas

### The Four Bell States
*Complete orthonormal basis of maximally entangled two-qubit states*

$$
|\Phi^{\pm}\rangle = \frac{|00\rangle \pm |11\rangle}{\sqrt{2}}, \quad |\Psi^{\pm}\rangle = \frac{|01\rangle \pm |10\rangle}{\sqrt{2}}
$$

### Bell-CHSH Inequality & Quantum Bound
*Definitive mathematical proof of non-classical correlations*

$$
|S_{\text{classical}}| \le 2 \quad \xrightarrow{\text{Quantum}} \quad S_{\text{quantum}} = 2\sqrt{2} \approx 2.828
$$

### Entanglement Witness / Circuit Preparation
*Standard circuit recipe for generating EPR pairs*

$$
\text{CNOT}_{0\to 1}(H \otimes I)|00\rangle = |\Phi^+\rangle
$$

## Summary & Key Takeaways

- Entangled states are non-separable quantum states that cannot be factored as $|\psi\rangle_A \otimes |\phi\rangle_B$.
- The four Bell states constitute a maximally entangled orthonormal basis for two-qubit systems.
- Measuring one entangled qubit instantaneously determines the collapsed state of the partner qubit across arbitrary spacelike separations.
- Experimental violations of Bell inequalities confirm that nature cannot be described by local hidden-variable theories.

## Practice Questions & Self-Assessment

### Question 1

If two qubits are in the Bell state |Ψ⁺⟩ = (|01⟩ + |10⟩)/√2 and Alice measures qubit A in the computational basis obtaining outcome "0", what is the post-measurement state of qubit B?

A) Qubit B is in state |0⟩ with certainty.
B) Qubit B is in state |1⟩ with certainty.
C) Qubit B remains in superposition (|0⟩ + |1⟩)/√2.
D) Qubit B has an equal 50% chance of collapsing to |0⟩ or |1⟩.

**Answer:** Qubit B collapses to |1⟩ with 100% certainty.

**Explanation:** In the state |Ψ⁺⟩ = (|01⟩ + |10⟩)/√2, the only branch where qubit A is 0 is |01⟩. Upon projecting Alice's qubit to |0⟩, the joint state collapses to |01⟩, ensuring Bob's qubit is definitively |1⟩.

### Question 2

Which of the following states is a separable (non-entangled) product state?

A) (|00⟩ + |11⟩)/√2
B) (|00⟩ + |01⟩ + |10⟩ + |11⟩)/2
C) (|01⟩ - |10⟩)/√2
D) (|00⟩ - |11⟩)/√2

**Answer:** (|00⟩ + |01⟩ + |10⟩ + |11⟩)/2 is separable.

**Explanation:** Factoring: (|00⟩ + |01⟩ + |10⟩ + |11⟩)/2 = [ (|0⟩+|1⟩)/√2 ] ⊗ [ (|0⟩+|1⟩)/√2 ] = |+⟩ ⊗ |+⟩. Because it factors cleanly into independent single-qubit states, there is zero entanglement.

## References & Pedagogical Sources

- Qiskit Textbook: "Entanglement and Bell Tests" (IBM Quantum)
- MIT OpenCourseWare 8.05: Quantum Physics II — Entanglement and Bell Inequalities
- Aspect, Grangier, & Roger (1982) / Nobel Prize in Physics 2022 Citation
