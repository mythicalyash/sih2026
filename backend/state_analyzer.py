from typing import List, Dict, Tuple, Any, Optional
import math
import numpy as np
from backend.schemas import AmplitudeItem, BlochVector, BlochResponse, ProbabilitiesResponse, AmplitudesResponse


def statevector_to_amplitudes(statevector: np.ndarray, num_qubits: int) -> List[AmplitudeItem]:
    """
    Decompose a statevector into individual basis state amplitudes with magnitude and phase.
    Basis strings format: |q_{n-1}...q_1 q_0> (Qiskit little-endian format).
    """
    amplitudes: List[AmplitudeItem] = []
    dim = 2 ** num_qubits

    for i in range(dim):
        # Format binary string with num_qubits width
        bin_str = bin(i)[2:].zfill(num_qubits)
        val = complex(statevector[i]) if i < len(statevector) else 0.0 + 0.0j
        real_part = float(np.real(val))
        imag_part = float(np.imag(val))
        magnitude = float(np.abs(val))
        phase_rad = float(np.angle(val))
        phase_deg = float(np.degrees(phase_rad))

        amplitudes.append(
            AmplitudeItem(
                state=bin_str,
                index=i,
                real=round(real_part, 6),
                imag=round(imag_part, 6),
                magnitude=round(magnitude, 6),
                phase_rad=round(phase_rad, 6),
                phase_deg=round(phase_deg, 2),
            )
        )

    return amplitudes


def statevector_to_probabilities(statevector: np.ndarray, num_qubits: int) -> Dict[str, float]:
    """
    Compute measurement probabilities |c_i|^2 for all computational basis states.
    """
    probs: Dict[str, float] = {}
    dim = 2 ** num_qubits

    for i in range(dim):
        bin_str = bin(i)[2:].zfill(num_qubits)
        val = complex(statevector[i]) if i < len(statevector) else 0.0 + 0.0j
        p = float(np.abs(val) ** 2)
        probs[bin_str] = round(p, 6)

    return probs


def compute_bloch_vectors(statevector: np.ndarray, num_qubits: int) -> List[BlochVector]:
    """
    Compute per-qubit reduced density matrix via partial trace and calculate
    Pauli expectation values <X>, <Y>, <Z> (Bloch vector components).
    
    Qiskit basis indexing:
    |q_{n-1} q_{n-2} ... q_1 q_0> where index k = sum_{j=0}^{n-1} q_j * 2^j
    So qubit 0 is the least-significant bit (LSB).
    """
    bloch_vectors: List[BlochVector] = []
    
    # Reshape statevector into n-dimensional tensor of shape (2, 2, ..., 2)
    # Indices correspond to (q_{n-1}, q_{n-2}, ..., q_1, q_0)
    tensor_shape = [2] * num_qubits
    psi_tensor = np.array(statevector, dtype=complex).reshape(tensor_shape)

    for target_qubit in range(num_qubits):
        # In the tensor shape (q_{n-1}, ..., q_0), the axis for target_qubit is (num_qubits - 1 - target_qubit)
        axis_index = num_qubits - 1 - target_qubit
        
        # Calculate reduced 2x2 density matrix rho_q = Tr_{others}(|psi><psi|)
        rho = np.zeros((2, 2), dtype=complex)
        
        for a in range(2):
            for b in range(2):
                # Slice target_qubit index at a and b
                slice_a = [slice(None)] * num_qubits
                slice_a[axis_index] = a
                
                slice_b = [slice(None)] * num_qubits
                slice_b[axis_index] = b
                
                sub_a = psi_tensor[tuple(slice_a)]
                sub_b = psi_tensor[tuple(slice_b)]
                
                # Tr_{others}(|psi_a><psi_b|) = sum_{others} psi_a(others) * conj(psi_b(others))
                rho[a, b] = np.sum(sub_a * np.conj(sub_b))

        # Calculate Pauli expectation values:
        # X = [[0, 1], [1, 0]] => Tr(rho X) = 2 * Re(rho[0, 1])
        # Y = [[0, -i], [i, 0]] => Tr(rho Y) = 2 * Im(rho[1, 0]) = -2 * Im(rho[0, 1])
        # Z = [[1, 0], [0, -1]] => Tr(rho Z) = rho[0, 0] - rho[1, 1]
        rx = float(2.0 * np.real(rho[0, 1]))
        ry = float(-2.0 * np.imag(rho[0, 1]))
        rz = float(np.real(rho[0, 0] - rho[1, 1]))
        
        # Norm / purity radius
        r = float(math.sqrt(rx ** 2 + ry ** 2 + rz ** 2))
        
        # Spherical coordinates
        if r > 1e-9:
            # Clamp cos value to [-1, 1]
            cos_theta = max(-1.0, min(1.0, rz / r))
            theta = float(math.acos(cos_theta))
            phi = float(math.atan2(ry, rx))
            if phi < 0:
                phi += 2 * math.pi
        else:
            theta = 0.0
            phi = 0.0

        bloch_vectors.append(
            BlochVector(
                qubit=target_qubit,
                x=round(rx, 6),
                y=round(ry, 6),
                z=round(rz, 6),
                r=round(r, 6),
                theta=round(theta, 4),
                phi=round(phi, 4),
            )
        )

    return bloch_vectors


def format_dirac_latex(statevector: np.ndarray, num_qubits: int, threshold: float = 1e-4) -> str:
    """
    Format a complex statevector into a clean LaTeX Dirac bra-ket expression.
    e.g. \\frac{1}{\\sqrt{2}}|00\\rangle + \\frac{1}{\\sqrt{2}}|11\\rangle
    """
    terms: List[str] = []
    dim = 2 ** num_qubits

    def _approx_frac(val: float) -> Optional[str]:
        sq2 = 1.0 / math.sqrt(2)
        sq2_neg = -sq2
        half = 0.5
        half_neg = -0.5
        sq4 = 0.5
        sq8 = 1.0 / math.sqrt(8)

        if abs(val - 1.0) < 1e-3:
            return "1"
        if abs(val - (-1.0)) < 1e-3:
            return "-1"
        if abs(val - sq2) < 1e-3:
            return "\\frac{1}{\\sqrt{2}}"
        if abs(val - sq2_neg) < 1e-3:
            return "-\\frac{1}{\\sqrt{2}}"
        if abs(val - half) < 1e-3:
            return "\\frac{1}{2}"
        if abs(val - half_neg) < 1e-3:
            return "-\\frac{1}{2}"
        if abs(val - sq8) < 1e-3:
            return "\\frac{1}{2\\sqrt{2}}"
        if abs(val - (-sq8)) < 1e-3:
            return "-\\frac{1}{2\\sqrt{2}}"
        return None

    for i in range(dim):
        if i < len(statevector):
            item = statevector[i]
            if hasattr(item, "real") and hasattr(item, "imag"):
                c = complex(float(item.real), float(item.imag))
            elif isinstance(item, dict):
                c = complex(float(item.get("real", 0.0)), float(item.get("imag", 0.0)))
            else:
                c = complex(item)
        else:
            c = 0.0 + 0.0j

        mag = abs(c)
        if mag < threshold:
            continue

        bin_str = bin(i)[2:].zfill(num_qubits)
        ket = f"|{bin_str}\\rangle"
        
        re = c.real
        im = c.imag

        # Pure real
        if abs(im) < threshold:
            frac = _approx_frac(re)
            if frac:
                if frac == "1":
                    coeff = ""
                elif frac == "-1":
                    coeff = "-"
                else:
                    coeff = frac
            else:
                coeff = f"{re:.3f}".rstrip('0').rstrip('.')
            terms.append(f"{coeff}{ket}")

        # Pure imaginary
        elif abs(re) < threshold:
            frac = _approx_frac(im)
            if frac:
                if frac == "1":
                    coeff = "i"
                elif frac == "-1":
                    coeff = "-i"
                elif frac.startswith("-"):
                    coeff = f"-i{frac[1:]}"
                else:
                    coeff = f"i{frac}"
            else:
                coeff = f"{im:.3f}i".rstrip('0').rstrip('.')
            terms.append(f"{coeff}{ket}")

        # Complex combination
        else:
            re_str = f"{re:.3f}".rstrip('0').rstrip('.')
            im_sign = "+" if im >= 0 else "-"
            im_str = f"{abs(im):.3f}i".rstrip('0').rstrip('.')
            terms.append(f"({re_str} {im_sign} {im_str}){ket}")

    if not terms:
        return "|0\\dots0\\rangle"

    # Assemble and format sign chains cleanly
    res = terms[0]
    for t in terms[1:]:
        if t.startswith("-"):
            res += f" - {t[1:]}"
        else:
            res += f" + {t}"

    return res

