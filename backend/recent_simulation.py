"""
Recent Simulation Store & Execution Engine
Maintains persistent record of the user's latest quantum simulation experiment,
provides live execution metrics, and powers real-time quick runs on the Home Dashboard.
"""

import json
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, Any

from backend.schemas import (
    CircuitIR,
    GateIR,
    RecentSimulationData,
    SaveRecentSimulationRequest,
    QuickRunSimulationResponse,
)
from backend.engine import run_circuit

STORE_DIR = Path(__file__).parent / "data"
RECENT_SIM_FILE = STORE_DIR / "recent_simulation.json"

_lock = threading.Lock()

def _infer_circuit_name(circuit: CircuitIR) -> str:
    """Intelligently infer human-readable quantum experiment name from circuit gate structure."""
    gates = circuit.gates
    num_q = circuit.num_qubits

    if not gates:
        return f"{num_q}-Qubit Ground State |0...0⟩"

    gate_names = [g.name.lower() for g in gates]

    # Bell state check: H(0) + CX(0, 1) or CX(1, 0)
    if num_q == 2 and len(gates) == 2:
        if gate_names == ["h", "cx"]:
            return "Bell State Experiment (|Φ⁺⟩)"

    # GHZ state check: 3+ qubits, H(0), CX(0,1), CX(1,2)...
    if num_q >= 3 and len(gates) >= num_q and gate_names[0] == "h" and all(n == "cx" for n in gate_names[1:num_q]):
        return f"GHZ {num_q}-Qubit Entanglement"

    # Single qubit superposition / bitflip
    if num_q == 1 and len(gates) == 1:
        if gate_names[0] == "h":
            return "Hadamard Superposition (|+⟩)"
        elif gate_names[0] == "x":
            return "Bit-Flip |1⟩ State"
        elif gate_names[0] in ("y", "z", "s", "t"):
            return f"Pauli-{gates[0].name.upper()} Gate State"

    # Phase kickback check
    if num_q == 2 and any(g.name == "cx" for g in gates) and any(g.name == "h" for g in gates):
        if "x" in gate_names:
            return "Phase Kickback Experiment"

    # Grover check
    if any("oracle" in g.name.lower() or "diffuser" in g.name.lower() for g in gates):
        return f"Grover's Search ({num_q} Qubits)"

    # QFT check
    if any(g.name.lower() in ("qft", "cp", "cz") for g in gates):
        return f"Quantum Fourier Transform ({num_q} Qubits)"

    return f"Custom {num_q}-Qubit Circuit ({len(gates)} gates)"

def _get_default_recent_simulation() -> Dict[str, Any]:
    return {
        "id": "sim-recent-default",
        "name": "Bell State Experiment",
        "circuit": {
            "num_qubits": 2,
            "gates": [
                {"name": "h", "qubits": [0], "params": []},
                {"name": "cx", "qubits": [0, 1], "params": []},
            ],
        },
        "probabilities": {"00": 0.5, "11": 0.5},
        "counts": {"00": 512, "11": 512},
        "shots": 1024,
        "total_accumulated_shots": 1024,
        "backend_name": "Aer Simulator",
        "execution_time_ms": 1.2,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

class RecentSimulationStore:
    def __init__(self):
        STORE_DIR.mkdir(parents=True, exist_ok=True)
        self._data: Dict[str, Any] = self._load()

    def _load(self) -> Dict[str, Any]:
        with _lock:
            if RECENT_SIM_FILE.exists():
                try:
                    with open(RECENT_SIM_FILE, "r", encoding="utf-8") as f:
                        return json.load(f)
                except Exception:
                    pass
            default = _get_default_recent_simulation()
            self._save_unsafe(default)
            return default

    def _save_unsafe(self, data: Dict[str, Any]):
        try:
            with open(RECENT_SIM_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"[WARN] Failed to persist recent simulation: {e}")

    def get_latest(self) -> RecentSimulationData:
        with _lock:
            # Construct CircuitIR
            circ_dict = self._data.get("circuit", {})
            gates = [
                GateIR(
                    name=g.get("name", "h"),
                    qubits=g.get("qubits", [0]),
                    params=g.get("params", []),
                )
                for g in circ_dict.get("gates", [])
            ]
            circuit = CircuitIR(
                num_qubits=circ_dict.get("num_qubits", 2),
                gates=gates,
            )

            return RecentSimulationData(
                id=self._data.get("id", "sim-recent-1"),
                name=self._data.get("name", "Bell State Experiment"),
                circuit=circuit,
                probabilities=self._data.get("probabilities", {"00": 0.5, "11": 0.5}),
                counts=self._data.get("counts"),
                shots=self._data.get("shots", 1024),
                total_accumulated_shots=self._data.get("total_accumulated_shots", 1024),
                backend_name=self._data.get("backend_name", "Aer Simulator"),
                execution_time_ms=self._data.get("execution_time_ms", 1.2),
                timestamp=self._data.get("timestamp", datetime.now(timezone.utc).isoformat()),
            )

    def record_simulation(
        self,
        circuit: CircuitIR,
        probabilities: Optional[Dict[str, float]] = None,
        counts: Optional[Dict[str, int]] = None,
        shots: int = 1024,
        backend_name: str = "Aer Simulator",
        name: Optional[str] = None,
        execution_time_ms: float = 1.2,
    ) -> RecentSimulationData:
        with _lock:
            inferred_name = name or _infer_circuit_name(circuit)
            now_iso = datetime.now(timezone.utc).isoformat()
            
            # Accumulated shots tracker
            prev_total = self._data.get("total_accumulated_shots", 0)
            new_total = prev_total + shots

            # Format gate dictionaries
            gates_data = [
                {"name": g.name, "qubits": g.qubits, "params": g.params or []}
                for g in circuit.gates
            ]

            # If probabilities not provided, compute them from counts or standard execution
            final_probs = probabilities
            if not final_probs and counts and sum(counts.values()) > 0:
                total_c = sum(counts.values())
                final_probs = {k: round(v / total_c, 4) for k, v in counts.items()}

            if not final_probs:
                final_probs = {"00": 0.5, "11": 0.5}

            self._data = {
                "id": f"sim_{int(datetime.now(timezone.utc).timestamp() * 1000)}",
                "name": inferred_name,
                "circuit": {
                    "num_qubits": circuit.num_qubits,
                    "gates": gates_data,
                },
                "probabilities": final_probs,
                "counts": counts,
                "shots": shots,
                "total_accumulated_shots": new_total,
                "backend_name": backend_name,
                "execution_time_ms": execution_time_ms,
                "timestamp": now_iso,
            }
            self._save_unsafe(self._data)

        return self.get_latest()

    def quick_run(self, shots: int = 1024, backend_choice: str = "qiskit_aer") -> QuickRunSimulationResponse:
        """Execute the current stored circuit live on Qiskit Aer and update state."""
        latest = self.get_latest()
        
        # Execute using standard backend runner
        exec_res = run_circuit(
            circuit=latest.circuit,
            backend=backend_choice,
            shots=shots,
            include_statevector=True,
        )

        with _lock:
            prev_total = self._data.get("total_accumulated_shots", 0)
            new_total = prev_total + shots
            
            self._data["probabilities"] = exec_res.probabilities
            self._data["counts"] = exec_res.counts
            self._data["shots"] = shots
            self._data["total_accumulated_shots"] = new_total
            self._data["backend_name"] = "Aer Simulator" if "aer" in backend_choice else backend_choice.capitalize()
            self._data["execution_time_ms"] = exec_res.execution_time_ms
            self._data["timestamp"] = datetime.now(timezone.utc).isoformat()
            self._save_unsafe(self._data)

        return QuickRunSimulationResponse(
            name=latest.name,
            circuit=latest.circuit,
            probabilities=exec_res.probabilities,
            counts=exec_res.counts,
            shots=shots,
            total_accumulated_shots=new_total,
            backend_name=self._data["backend_name"],
            execution_time_ms=exec_res.execution_time_ms,
        )

recent_sim_store = RecentSimulationStore()
