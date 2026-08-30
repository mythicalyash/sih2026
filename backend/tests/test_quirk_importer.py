import pytest
import math
from backend.quirk_importer import quirk_to_ir, parse_quirk_raw
from backend.engine import run_circuit_qiskit

def test_quirk_importer_bell_state_json():
    quirk_json = {
        "cols": [
            ["H"],
            ["•", "X"]
        ]
    }
    ir, warnings = quirk_to_ir(quirk_json)
    assert ir.num_qubits == 2
    assert len(ir.gates) == 2
    assert ir.gates[0].name == "h"
    assert ir.gates[0].qubits == [0]
    assert ir.gates[1].name == "cx"
    assert ir.gates[1].qubits == [0, 1]

    # Verify execution of imported circuit
    res = run_circuit_qiskit(ir, shots=1000)
    assert math.isclose(res.probabilities["00"], 0.5, abs_tol=1e-4)
    assert math.isclose(res.probabilities["11"], 0.5, abs_tol=1e-4)

def test_quirk_importer_real_url():
    # Quirk URL for Bell State: H on q0, Control on q0, Target X on q1
    url = "https://algassert.com/quirk#circuit=%7B%22cols%22%3A%5B%5B%22H%22%5D%2C%5B%22%E2%80%A2%22%2C%22X%22%5D%5D%7D"
    ir, warnings = quirk_to_ir(url)
    assert ir.num_qubits == 2
    assert len(ir.gates) == 2
    assert ir.gates[0].name == "h"
    assert ir.gates[1].name == "cx"

def test_quirk_importer_toffoli_and_swap():
    quirk_json = {
        "cols": [
            ["X", "X", 1],
            ["•", "•", "X"],
            ["Swap", 1, "Swap"]
        ]
    }
    ir, warnings = quirk_to_ir(quirk_json)
    assert ir.num_qubits == 3
    assert len(ir.gates) == 4
    # Gates: X(0), X(1), CCX(0,1,2), SWAP(0,2)
    assert ir.gates[0].name == "x"
    assert ir.gates[1].name == "x"
    assert ir.gates[2].name == "ccx"
    assert ir.gates[2].qubits == [0, 1, 2]
    assert ir.gates[3].name == "swap"
    assert ir.gates[3].qubits == [0, 2]

def test_quirk_importer_single_gates():
    quirk_json = {
        "cols": [
            ["H", "X", "Y", "Z"],
            ["S", "T", "S†", "T†"]
        ]
    }
    ir, warnings = quirk_to_ir(quirk_json)
    assert ir.num_qubits == 4
    assert len(ir.gates) == 8
    names = [g.name for g in ir.gates]
    assert names == ["h", "x", "y", "z", "s", "t", "sdg", "tdg"]
