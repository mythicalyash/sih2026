# Shor's Algorithm (Concept & Period Finding)

**Category:** Algorithms | **Est. Reading Time:** 20 min

## Learning Objectives

- Explain how integer factorization reduces to classical order/period finding $a^r \equiv 1 \pmod N$.
- Understand the role of the Quantum Fourier Transform (QFT) and quantum phase estimation in extracting periods.
- Analyze the exponential speedup over classical factoring (General Number Field Sieve) and its cryptographic implications.

---

## 1. Factoring and Cryptographic Vulnerability

Modern public-key cryptography (RSA, Diffie-Hellman) relies on the asymmetry of integer multiplication versus factorization: multiplying two large prime numbers $p \times q = N$ is computationally trivial, but finding $p$ and $q$ given $N$ is believed to be intractable for classical computers. The best classical algorithm, the **General Number Field Sieve (GNFS)**, runs in sub-exponential time:

$$\mathcal{O}\left( \exp\left( \left(\sqrt[3]{\frac{64}{9}} + o(1)\right) (\ln N)^{1/3} (\ln \ln N)^{2/3} \right) \right)$$

Factoring a 2048-bit RSA modulus classically would take billions of CPU years. In 1994, Peter Shor formulated **Shor's Algorithm**, which factors integers in polynomial time $\mathcal{O}((\log N)^3)$, rendering current RSA encryption obsolete once fault-tolerant quantum computers are built.

## 2. Reduction to Period Finding

Shor's key insight was transforming the arithmetic problem of factoring into the problem of finding the **period $r$** of a modular modular exponentiation sequence:

$$f(x) = a^x \pmod N$$

where $a < N$ is a chosen coprime integer ($\gcd(a, N) = 1$). Euler's totient theorem guarantees that the sequence $a^0, a^1, a^2, \dots \pmod N$ repeats periodically with some integer period $r$ such that $a^r \equiv 1 \pmod N$.

Once an even period $r$ is discovered:
$$(a^{r/2} - 1)(a^{r/2} + 1) = a^r - 1 \equiv 0 \pmod N$$

This means $(a^{r/2} - 1)(a^{r/2} + 1)$ is an integer multiple of $N$. Provided $a^{r/2} \not\equiv -1 \pmod N$, the non-trivial factors of $N$ can be calculated efficiently on a classical computer using Euclid's algorithm:

$$p, q = \gcd(a^{r/2} \pm 1, N)$$

## 3. The Quantum Core: QFT and Phase Estimation

While classical computers struggle to find $r$ because they must evaluate points sequentially, a quantum computer creates a superposition of all values $x$:

$$\frac{1}{\sqrt{2^m}}\sum_{x=0}^{2^m-1} |x\rangle |a^x \bmod N\rangle$$

Measuring the second register leaves the first register in a periodic state of the form $\sum_k |x_0 + k r\rangle$.

Applying the **Quantum Fourier Transform (QFT)** transforms periodic amplitude spikes in the computational domain into localized interference peaks in the frequency domain centered around multiples of $2^m / r$. Continued fraction analysis on the measured outcome reveals the exact integer period $r$ with high probability in polynomial time.

## Key Equations & Formulas

### Modular Order Periodicity
*Algebraic foundation reducing factoring to period finding*

$$
a^r \equiv 1 \pmod N \implies (a^{r/2}-1)(a^{r/2}+1) = k N
$$

### Quantum Fourier Transform (QFT)
*Unitary transformation mapping period into sharp frequency peaks*

$$
\text{QFT}|j\rangle = \frac{1}{\sqrt{2^n}}\sum_{k=0}^{2^n-1} e^{2\pi i j k / 2^n}|k\rangle
$$

### Complexity Comparison (Shor vs. Classical GNFS)
*True exponential speedup from exponential to polynomial time*

$$
T_{\text{Shor}} = \mathcal{O}\left( (\log N)^2 \log \log N \right) \quad \ll \quad T_{\text{Classical GNFS}} = e^{\mathcal{O}((\log N)^{1/3})}
$$

## Summary & Key Takeaways

- Shor's algorithm achieves an exponential polynomial-time speedup $\mathcal{O}((\log N)^3)$ for integer factorization.
- The number-theoretic problem of factoring is reduced to finding the period $r$ of the modular function $f(x) = a^x \bmod N$.
- The Quantum Fourier Transform (QFT) extracts the period $r$ through constructive interference in the frequency spectrum.
- Factors of $N$ are computed classically from $r$ using Euclid's greatest common divisor algorithm: $\gcd(a^{r/2} \pm 1, N)$.

## Practice Questions & Self-Assessment

### Question 1

Suppose we wish to factor N = 15 with chosen coprime base a = 7. If period finding yields r = 4, what factors of 15 are revealed by computing gcd(a^(r/2) ± 1, N)?

A) Factors 3 and 5
B) Factors 2 and 7
C) Factors 1 and 15
D) Factors 4 and 6

**Answer:** Factors 3 and 5.

**Explanation:** With a = 7 and r = 4: a^(r/2) = 7² = 49. Then: gcd(49 - 1, 15) = gcd(48, 15) = 3; and gcd(49 + 1, 15) = gcd(50, 15) = 5. The non-trivial prime factors of 15 are 3 and 5.

### Question 2

Why does Shor's algorithm require a Quantum Fourier Transform instead of classical FFT?

A) Because QFT acts simultaneously on all 2^n quantum amplitudes in O(n²) gate depth without measuring individual elements.
B) Because classical FFT only works on power-of-10 data.
C) Because QFT eliminates quantum decoherence entirely.
D) Because classical FFT cannot calculate complex numbers.

**Answer:** QFT operates on the 2^n superposition amplitudes in polynomial O(n²) time.

**Explanation:** Classical FFT takes O(N log N) = O(2^n · n) steps on 2^n data points. The QFT operates unitarily on the 2^n amplitudes using only O(n²) = O((log N)²) quantum gates, delivering the exponential speedup.

## References & Pedagogical Sources

- Qiskit Textbook: "Shor's Algorithm" & "Quantum Fourier Transform" (IBM Quantum)
- Shor, P. W. (1994). "Algorithms for quantum computation: discrete logarithms and factoring". IEEE FOCS
- MIT OpenCourseWare 8.05 / Nielsen & Chuang: Chapter 5 (The Quantum Fourier Transform)
