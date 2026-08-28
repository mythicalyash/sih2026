# Quantum Computing Education Platform Backend

A high-performance quantum computing simulation and verification backend built with **FastAPI**, **Qiskit**, **Qiskit Aer**, **PennyLane**, and **qBraid**.

---

## Features
- **Bi-Directional Circuit IR**: JSON schema that maps 1:1 to Qiskit `QuantumCircuit` and supports single, multi-qubit, rotation, and measurement operations.
- **Execution Engine**: Statevector and shot-based simulation using Qiskit Aer.
- **Cross-Backend Equivalence Verification**: Verifies circuit execution between Qiskit Aer and PennyLane (`default.qubit`) via qBraid with strict tolerance checks ($\Delta P \le 10^{-4}$, Fidelity $\ge 0.999$).
- **Algorithm Library**: Pre-built implementations for:
  - Deutsch-Jozsa (Constant vs Balanced oracle)
  - Bernstein-Vazirani (recovers hidden secret bitstring)
  - Grover's Search (amplitude amplification)
  - Quantum Fourier Transform (QFT)
  - Quantum Teleportation (arbitrary state reconstruction)
  - Superdense Coding (2 classical bits via 1 qubit)
- **Quirk Importer**: Converts Quirk export JSON and Quirk `#circuit=` URLs directly into Circuit IR.
- **State Analytics**:
  - Exact Pauli expectation values $\langle X \rangle, \langle Y \rangle, \langle Z \rangle$ and purity $r$ computed via partial trace density matrices.
  - Computational basis probability distribution.
  - Statevector amplitude decomposition (real, imag, magnitude, phase).
- **AI Tutor Engine**: Deterministic circuit checks (unmeasured qubits, empty circuits, index bounds, self-canceling gates) with automated diagnostic insights.

---

## Setup & Running

### 1. Install Dependencies
Using `uv` (recommended):
```bash
uv venv backend/.venv --python 3.12
source backend/.venv/bin/activate
uv pip install -r backend/requirements.txt
```

### 2. Run Test Suite
```bash
PYTHONPATH=. backend/.venv/bin/pytest -v backend/tests/
```

### 3. Start Backend Server
```bash
backend/.venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be available at `http://localhost:8000/docs`.

---

## Example `curl` API Calls

### 1. Health Check
```bash
curl -X GET http://localhost:8000/health
```

### 2. Execute Circuit (`POST /execute`)
Execute a Bell State ($H \to CX$):
```bash
curl -X POST http://localhost:8000/execute \
  -H "Content-Type: application/json" \
  -d '{
    "circuit": {
      "num_qubits": 2,
      "gates": [
        { "name": "h", "qubits": [0] },
        { "name": "cx", "qubits": [0, 1] }
      ]
    },
    "shots": 1024,
    "include_statevector": true
  }'
```

### 3. Cross-Backend Verification (`POST /execute/compare`)
Compare Qiskit Aer and PennyLane execution:
```bash
curl -X POST http://localhost:8000/execute/compare \
  -H "Content-Type: application/json" \
  -d '{
    "circuit": {
      "num_qubits": 2,
      "gates": [
        { "name": "h", "qubits": [0] },
        { "name": "cx", "qubits": [0, 1] }
      ]
    },
    "tolerance": 0.0001
  }'
```

### 4. Bloch Vectors (`POST /state/bloch`)
```bash
curl -X POST http://localhost:8000/state/bloch \
  -H "Content-Type: application/json" \
  -d '{
    "num_qubits": 2,
    "gates": [
      { "name": "h", "qubits": [0] },
      { "name": "x", "qubits": [1] }
    ]
  }'
```

### 5. State Probabilities (`POST /state/probabilities`)
```bash
curl -X POST http://localhost:8000/state/probabilities \
  -H "Content-Type: application/json" \
  -d '{
    "num_qubits": 2,
    "gates": [
      { "name": "h", "qubits": [0] },
      { "name": "cx", "qubits": [0, 1] }
    ]
  }'
```

### 6. Statevector Amplitudes (`POST /state/amplitudes`)
```bash
curl -X POST http://localhost:8000/state/amplitudes \
  -H "Content-Type: application/json" \
  -d '{
    "num_qubits": 2,
    "gates": [
      { "name": "h", "qubits": [0] }
    ]
  }'
```

### 7. List Available Algorithms (`GET /algorithms`)
```bash
curl -X GET http://localhost:8000/algorithms
```

### 8. Fetch Specific Algorithm (`GET /algorithms/{name}`)
```bash
curl -X GET http://localhost:8000/algorithms/grovers_search
```

### 9. Quirk Circuit Importer (`POST /import/quirk`)
```bash
curl -X POST http://localhost:8000/import/quirk \
  -H "Content-Type: application/json" \
  -d '{
    "quirk_json": {
      "cols": [
        ["H"],
        ["•", "X"]
      ]
    }
  }'
```
Or via URL:
```bash
curl -X POST http://localhost:8000/import/quirk \
  -H "Content-Type: application/json" \
  -d '{
    "quirk_url": "https://algassert.com/quirk#circuit=%7B%22cols%22%3A%5B%5B%22H%22%5D%2C%5B%22%E2%80%A2%22%2C%22X%22%5D%5D%7D"
  }'
```

### 10. AI Tutor Diagnostics & Explanation (`POST /tutor/explain`)
```bash
curl -X POST http://localhost:8000/tutor/explain \
  -H "Content-Type: application/json" \
  -d '{
    "circuit": {
      "num_qubits": 2,
      "gates": [
        { "name": "h", "qubits": [0] },
        { "name": "h", "qubits": [0] }
      ]
    },
    "question": "Why does this circuit do nothing?"
  }'
```
