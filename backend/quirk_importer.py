import json
import re
import urllib.parse
from typing import Dict, Any, List, Union, Tuple, Optional
from backend.schemas import CircuitIR, GateIR, QuirkImportResponse

# Quirk single-qubit gate translations
QUIRK_SINGLE_GATE_MAP = {
    "h": ("h", []),
    "x": ("x", []),
    "y": ("y", []),
    "z": ("z", []),
    "s": ("s", []),
    "z^½": ("s", []),
    "z^1/2": ("s", []),
    "s†": ("sdg", []),
    "z^-½": ("sdg", []),
    "z^-1/2": ("sdg", []),
    "t": ("t", []),
    "z^¼": ("t", []),
    "z^1/4": ("t", []),
    "t†": ("tdg", []),
    "z^-¼": ("tdg", []),
    "z^-1/4": ("tdg", []),
    "measure": ("measure", []),
    "x^½": ("rx", [1.57079632679]),
    "x^-½": ("rx", [-1.57079632679]),
    "y^½": ("ry", [1.57079632679]),
    "y^-½": ("ry", [-1.57079632679]),
}


def parse_quirk_raw(raw_data: Union[str, Dict[str, Any], List[Any]]) -> Dict[str, Any]:
    """Parse raw URL, JSON string, or python dict into a Quirk dictionary."""
    if isinstance(raw_data, dict):
        return raw_data
    
    if isinstance(raw_data, list):
        return {"cols": raw_data}

    text = str(raw_data).strip()
    
    # Handle Quirk URL
    if "#circuit=" in text:
        fragment = text.split("#circuit=")[-1]
        decoded = urllib.parse.unquote(fragment)
        try:
            return json.loads(decoded)
        except json.JSONDecodeError:
            pass

    # Handle standard JSON string
    try:
        parsed = json.loads(text)
        if isinstance(parsed, list):
            return {"cols": parsed}
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass

    raise ValueError("Invalid Quirk circuit data: cannot parse JSON or URL format.")


def quirk_to_ir(raw_data: Union[str, Dict[str, Any], List[Any]]) -> Tuple[CircuitIR, List[str]]:
    """
    Convert Quirk circuit structure into CircuitIR.
    Returns (CircuitIR, warnings).
    """
    quirk_dict = parse_quirk_raw(raw_data)
    cols = quirk_dict.get("cols", [])
    warnings: List[str] = []

    if not cols:
        return CircuitIR(num_qubits=2, gates=[]), ["Empty Quirk circuit."]

    # Determine num_qubits by max row length
    max_qubits = 2
    for col in cols:
        if isinstance(col, list):
            max_qubits = max(max_qubits, len(col))
    
    gates: List[GateIR] = []

    for col_idx, col in enumerate(cols):
        if not isinstance(col, list):
            continue

        controls: List[int] = []
        anti_controls: List[int] = []
        swaps: List[int] = []
        targets: List[Tuple[int, str]] = []

        for q_idx, item in enumerate(col):
            if item == 1 or item == "1" or item is None or item == "":
                continue
            
            gate_str = str(item).strip()

            if gate_str in ["•", "Control", "ctrl"]:
                controls.append(q_idx)
            elif gate_str in ["◦", "AntiControl"]:
                anti_controls.append(q_idx)
            elif gate_str.lower() == "swap":
                swaps.append(q_idx)
            elif gate_str in ["Bloch", "Density", "Chance", "Amps1", "Amps2", "Sample1", "Sample2"]:
                # Measurement/display markers in Quirk
                warnings.append(f"Ignored Quirk visual display '{gate_str}' at col {col_idx}, qubit {q_idx}.")
            else:
                targets.append((q_idx, gate_str))

        # Handle SWAP gates
        if len(swaps) == 2 and not controls:
            gates.append(GateIR(name="swap", qubits=[swaps[0], swaps[1]]))
        elif len(swaps) == 2 and len(controls) == 1:
            gates.append(GateIR(name="cswap", qubits=[controls[0], swaps[0], swaps[1]]))
        elif len(swaps) > 0:
            warnings.append(f"Unmatched Swap gates in column {col_idx}.")

        # Handle Anti-Controls by sandwiching with X
        for ac in anti_controls:
            gates.append(GateIR(name="x", qubits=[ac]))
            controls.append(ac)

        # Process targets with controls
        if controls:
            for q_idx, gate_str in targets:
                g_lower = gate_str.lower()
                if g_lower == "x":
                    if len(controls) == 1:
                        gates.append(GateIR(name="cx", qubits=[controls[0], q_idx]))
                    elif len(controls) == 2:
                        gates.append(GateIR(name="ccx", qubits=[controls[0], controls[1], q_idx]))
                    else:
                        warnings.append(f"More than 2 controls not supported for X at col {col_idx}.")
                elif g_lower == "z":
                    if len(controls) == 1:
                        gates.append(GateIR(name="cz", qubits=[controls[0], q_idx]))
                    else:
                        warnings.append(f"Multi-controlled Z with >1 controls at col {col_idx}.")
                elif g_lower == "h":
                    if len(controls) == 1:
                        gates.append(GateIR(name="ch", qubits=[controls[0], q_idx]))
                    else:
                        warnings.append(f"Multi-controlled H with >1 controls at col {col_idx}.")
                else:
                    warnings.append(f"Controlled gate '{gate_str}' not directly supported in IR at col {col_idx}.")
        else:
            # Single-qubit gates
            for q_idx, gate_str in targets:
                g_key = gate_str.lower()
                if g_key in QUIRK_SINGLE_GATE_MAP:
                    mapped_name, params = QUIRK_SINGLE_GATE_MAP[g_key]
                    gates.append(GateIR(name=mapped_name, qubits=[q_idx], params=params if params else None))
                else:
                    warnings.append(f"Unsupported Quirk gate '{gate_str}' at col {col_idx}, qubit {q_idx}.")

        # Undo anti-control X gates
        for ac in anti_controls:
            gates.append(GateIR(name="x", qubits=[ac]))

    num_qubits = max(2, max_qubits)
    return CircuitIR(num_qubits=num_qubits, gates=gates), warnings
