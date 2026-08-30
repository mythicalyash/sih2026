# Deutsch-Jozsa Algorithm (Concept & Advantage)

**Category:** Algorithms | **Est. Reading Time:** 15 min

## Learning Objectives

- Formulate the black-box oracle problem for constant vs. balanced boolean functions.
- Understand the phase kickback mechanism and multi-qubit interference.
- Analyze the exponential separation in query complexity between classical and quantum solutions.

---

## 1. The Oracle Problem

The **Deutsch-Jozsa algorithm** (proposed by David Deutsch and Richard Jozsa in 1992) was one of the earliest demonstrations of an exponential quantum speedup over deterministic classical computation.

**Problem Statement:** We are given an unknown boolean function (an **oracle**) $f: \{0, 1\}^n \to \{0, 1\}$ with the promise that it is either:
- **Constant:** It returns the same output ($0$ for all $x$, or $1$ for all $x$).
- **Balanced:** It returns $0$ for exactly half of the inputs ($2^{n-1}$) and $1$ for the remaining half.

**The Goal:** Determine whether $f$ is constant or balanced with 100% certainty using the minimum number of oracle queries.

## 2. Classical vs. Quantum Query Complexity

**Classical Complexity:** In the worst case, a deterministic classical algorithm must query more than half the inputs:

$$Q_{\text{classical}} = 2^{n-1} + 1 \quad \text{queries}$$

For $n = 64$, this requires $> 9 \times 10^{18}$ queries—computationally intractable.

**Quantum Complexity:** The Deutsch-Jozsa algorithm determines the property with **exactly 1 query** ($Q_{\text{quantum}} = 1$), regardless of input size $n$. This establishes an exact exponential speedup in query complexity.

## 3. Algorithm Circuit and Phase Kickback

The algorithm operates as follows:
1. Initialize $n$ data qubits in state $|0\rangle^{\otimes n}$ and 1 ancillary target qubit in state $|1\rangle$.
2. Apply Hadamard gates to all qubits, creating data state $\frac{1}{\sqrt{2^n}}\sum |x\rangle$ and ancilla state $|-\rangle = \frac{|0\rangle - |1\rangle}{\sqrt{2}}$.
3. Query the oracle $U_f |x\rangle|y\rangle = |x\rangle|y \oplus f(x)\rangle$. Through **phase kickback**, the target stays in state $|-\rangle$ while the function value is kicked back as a phase onto the data register:
   $$\frac{1}{\sqrt{2^n}}\sum_{x=0}^{2^n-1} (-1)^{f(x)} |x\rangle$$
4. Apply a final Hadamard layer $H^{\otimes n}$ to the data register and measure in the computational basis.

If $f$ is constant, all components interfere constructively into state $|00\dots 0\rangle$ with probability 1. If $f$ is balanced, destructive interference ensures amplitude at $|00\dots 0\rangle$ is precisely 0.

## Key Equations & Formulas

### Phase Kickback in Oracle Evaluation
*Evaluation transfers function value f(x) into phase amplitudes*

$$
U_f \left( \frac{1}{\sqrt{2^n}}\sum_{x} |x\rangle \right) |-\rangle = \left( \frac{1}{\sqrt{2^n}}\sum_{x} (-1)^{f(x)} |x\rangle \right) |-\rangle
$$

### Final State Before Measurement
*Interference pattern across all 2^n basis states*

$$
|\psi_{\text{final}}\rangle = \sum_{z=0}^{2^n-1} \left( \frac{1}{2^n}\sum_{x=0}^{2^n-1} (-1)^{f(x) + x \cdot z} \right) |z\rangle
$$

### Query Complexity Comparison
*Exponential query complexity advantage*

$$
Q_{\text{quantum}} = 1 \quad \ll \quad Q_{\text{classical, exact}} = 2^{n-1} + 1
$$

## Summary & Key Takeaways

- The Deutsch-Jozsa algorithm determines if a boolean function is constant or balanced.
- Deterministic classical algorithms require $2^{n-1} + 1$ queries in the worst case, while quantum requires just 1 query.
- Phase kickback translates bit-flip function evaluations into phase factors $(-1)^{f(x)}$.
- Interference from the final Hadamard layer causes constant functions to yield all-zeros $|0\dots 0\rangle$, while balanced functions guarantee at least one non-zero bit.

## Practice Questions & Self-Assessment

### Question 1

If after running Deutsch-Jozsa on 5 qubits we measure the output "00100", what can we conclude about the function f?

A) The function is constant.
B) The function is balanced.
C) The run was inconclusive; run it again.
D) The function is both constant and balanced.

**Answer:** The function f is definitively balanced.

**Explanation:** For a constant function, the probability of measuring anything other than |00000⟩ is exactly 0. Observing any non-zero measurement outcome (like 00100) proves with 100% certainty that f is balanced.

### Question 2

What crucial role does the ancillary qubit initialized in state |−⟩ play in the Deutsch-Jozsa algorithm?

A) It enables phase kickback, transforming bit-addition into phase multiplication (-1)^f(x).
B) It acts as an error correction stabilizer.
C) It stores the classical binary output of f(x).
D) It prevents decoherence on the data register.

**Answer:** It enables phase kickback.

**Explanation:** Because X|-⟩ = -|-⟩, evaluating U_f |x⟩|-⟩ = |x⟩|0 ⊕ f(x)⟩ - |x⟩|1 ⊕ f(x)⟩ = (-1)^f(x)|x⟩|-⟩. Without the ancilla in |−⟩, the phase kickback would not occur.

## References & Pedagogical Sources

- Qiskit Textbook: "Deutsch-Jozsa Algorithm" (IBM Quantum)
- Deutsch, D. & Jozsa, R. (1992). "Rapid solution of problems by quantum computation". Proc. R. Soc. Lond. A
- Nielsen & Chuang: Section 1.4.3 (Deutsch-Jozsa Algorithm)
