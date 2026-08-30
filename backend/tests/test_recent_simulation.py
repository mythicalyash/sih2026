import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_get_latest_simulation():
    res = client.get("/api/simulation/latest")
    assert res.status_code == 200
    data = res.json()
    assert "circuit" in data
    assert "name" in data
    assert "probabilities" in data
    assert data["circuit"]["num_qubits"] >= 1

def test_quick_run_simulation():
    res = client.post("/api/simulation/quick-run?shots=512")
    assert res.status_code == 200
    data = res.json()
    assert "probabilities" in data
    assert "counts" in data
    assert data["shots"] == 512
    assert "execution_time_ms" in data

def test_execute_updates_latest_simulation():
    # Execute a custom 3-qubit GHZ state
    exec_req = {
        "circuit": {
            "num_qubits": 3,
            "gates": [
                {"name": "h", "qubits": [0], "params": []},
                {"name": "cx", "qubits": [0, 1], "params": []},
                {"name": "cx", "qubits": [1, 2], "params": []},
            ]
        },
        "shots": 1024,
        "backend": "qiskit_aer"
    }
    exec_res = client.post("/execute", json=exec_req)
    assert exec_res.status_code == 200

    # Fetch latest simulation and check it updated
    latest_res = client.get("/api/simulation/latest")
    assert latest_res.status_code == 200
    latest_data = latest_res.json()
    assert latest_data["circuit"]["num_qubits"] == 3
    assert "GHZ" in latest_data["name"] or "3-Qubit" in latest_data["name"]
    assert "000" in latest_data["probabilities"]
