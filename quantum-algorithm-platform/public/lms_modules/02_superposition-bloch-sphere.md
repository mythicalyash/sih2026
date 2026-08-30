# Superposition & the Bloch Sphere

**Category:** Foundations | **Est. Reading Time:** 15 min

## Learning Objectives

- Explain the physical meaning of quantum superposition and relative phase.
- Derive the spherical parameterization of a single qubit $(\theta, \phi)$.
- Map pure states, equatorial superpositions ($|+\rangle, |-\rangle, |+i\rangle, |-i\rangle$), and rotations onto the 3D Bloch sphere.

---

## 1. The Physical Essence of Superposition

Quantum **superposition** is fundamentally distinct from classical statistical mixture or uncertainty. A classical coin under a cup is either heads or tails; your ignorance is epistemic. A qubit in superposition, however, physically occupies an indeterminate state that carries quantum coherence.

Superposition allows quantum algorithms to process computational paths simultaneously. However, superposition alone is not the whole story: relative complex phases between terms govern constructive and destructive interference, determining which computational paths are amplified and which cancel out.

## 2. Parameterizing the Single Qubit State

Since $|\alpha|^2 + |\beta|^2 = 1$ and an overall global phase is physically unobservable, we can parameterize any arbitrary pure single-qubit state using two real angles $\theta$ and $\phi$:

$$|\psi\rangle = \cos\left(\frac{\theta}{2}\right)|0\rangle + e^{i\phi}\sin\left(\frac{\theta}{2}\right)|1\rangle$$

where:
- $\theta \in [0, \pi]$ is the polar angle (colatitude), controlling the relative population between $|0\rangle$ and $|1\rangle$.
- $\phi \in [0, 2\pi)$ is the azimuthal angle (longitude), specifying the **relative phase** between the two basis states.

## 3. Geometry of the Bloch Sphere

The **Bloch sphere** is a unit sphere in $\mathbb{R}^3$ providing a 1-to-1 visual representation for every pure single-qubit state:

- **North Pole** $(\theta = 0)$: $|0\rangle$
- **South Pole** $(\theta = \pi)$: $|1\rangle$
- **Equator** $(\theta = \pi/2)$: Equal superpositions with varying relative phase:
  - Along $+X$ axis $(\phi = 0)$: $|+\rangle = \frac{|0\rangle + |1\rangle}{\sqrt{2}}$
  - Along $-X$ axis $(\phi = \pi)$: $|-\rangle = \frac{|0\rangle - |1\rangle}{\sqrt{2}}$
  - Along $+Y$ axis $(\phi = \pi/2)$: $|+i\rangle = \frac{|0\rangle + i|1\rangle}{\sqrt{2}}$
  - Along $-Y$ axis $(\phi = 3\pi/2)$: $|-i\rangle = \frac{|0\rangle - i|1\rangle}{\sqrt{2}}$

Every unitary single-qubit operation corresponds to a rigid 3D rotation of the state vector on this sphere around a specific axis.

## Key Equations & Formulas

### Bloch Sphere State Parameterization
*Canonical spherical coordinates representation of a pure qubit*

$$
|\psi\rangle = \cos\left(\frac{\theta}{2}\right)|0\rangle + e^{i\phi}\sin\left(\frac{\theta}{2}\right)|1\rangle
$$

### Bloch Vector Coordinates
*Cartesian unit vector on the surface of the Bloch sphere*

$$
\vec{r} = (x, y, z) = (\sin\theta\cos\phi, \sin\theta\sin\phi, \cos\theta)
$$

### Equatorial Basis States (X and Y bases)
*Equal superposition eigenstates of Pauli X and Pauli Y*

$$
|\pm\rangle = \frac{|0\rangle \pm |1\rangle}{\sqrt{2}}, \quad |\pm i\rangle = \frac{|0\rangle \pm i|1\rangle}{\sqrt{2}}
$$

## Summary & Key Takeaways

- Superposition is a coherent linear combination of states, not a classical probabilistic mixture.
- A pure state is uniquely defined on the Bloch sphere by polar angle $\theta \in [0,\pi]$ and azimuthal phase $\phi \in [0,2\pi)$.
- The poles correspond to computational states $|0\rangle$ and $|1\rangle$, while the equator hosts balanced superpositions ($|+\rangle, |-\rangle$).
- Single-qubit quantum gates act as geometric rotations of the Bloch vector.

## Practice Questions & Self-Assessment

### Question 1

Which Bloch sphere coordinates (θ, φ) correspond to the state |−⟩ = (|0⟩ - |1⟩)/√2?

A) θ = π/2, φ = 0
B) θ = π/2, φ = π
C) θ = π, φ = 0
D) θ = π/2, φ = π/2

**Answer:** θ = π/2 and φ = π.

**Explanation:** For equal amplitude weighting, cos(θ/2) = sin(θ/2) = 1/√2 ⇒ θ/2 = π/4 ⇒ θ = π/2. The minus sign represents a relative phase factor e^(iφ) = -1 = e^(iπ), so φ = π.

### Question 2

Why are orthogonal quantum states (like |0⟩ and |1⟩) separated by 180° on the Bloch sphere rather than 90°?

A) Because the parameterization uses half-angles (θ/2), doubling geometric angles on the sphere.
B) Because the Bloch sphere only represents mixed states.
C) Due to relativistic Lorentz contraction of Hilbert space.
D) Because orthogonality is lost when converting to spherical coordinates.

**Answer:** The factor of θ/2 in the state definition maps the Hilbert space angle [0, π/2] to Bloch sphere polar angle [0, π].

**Explanation:** Inner product ⟨0|1⟩ = 0 is orthogonal in 2D complex space, but corresponds to the opposite antipodal poles (z = +1 and z = -1) separated by angle π on the 3D unit sphere.

## References & Pedagogical Sources

- Qiskit Textbook: "Single Qubit Gates" & "The Bloch Sphere" (IBM Quantum)
- MIT OpenCourseWare 8.05: Quantum Physics II — Two-State Systems (Prof. Barton Zwiebach)
- Nielsen & Chuang: Quantum Computation and Quantum Information (Chapter 1)
