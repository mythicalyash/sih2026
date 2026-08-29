import os
import time
import subprocess
import tempfile
from typing import Optional
from backend.schemas import CodeExecuteRequest, CodeExecuteResponse


def execute_python_code(req: CodeExecuteRequest) -> CodeExecuteResponse:
    """
    Execute Python code locally in the backend Python virtual environment
    which has full Qiskit, Qiskit Aer, PennyLane, Cirq, and qsim installed.
    """
    start_time = time.time()
    venv_python = os.path.abspath(
        os.path.join(os.path.dirname(__file__), ".venv", "bin", "python")
    )
    if not os.path.exists(venv_python):
        venv_python = "python3"

    timeout = req.timeout or 8.0

    with tempfile.NamedTemporaryFile(suffix=".py", mode="w", delete=False) as f:
        f.write(req.source_code)
        temp_path = f.name

    try:
        proc = subprocess.run(
            [venv_python, temp_path],
            input=req.stdin.encode("utf-8") if req.stdin else None,
            capture_output=True,
            timeout=timeout,
        )
        elapsed = time.time() - start_time
        stdout = proc.stdout.decode("utf-8", errors="replace")
        stderr = proc.stderr.decode("utf-8", errors="replace")

        if proc.returncode == 0:
            status = {"id": 3, "description": "Success"}
        else:
            status = {"id": 11, "description": f"Runtime Error (Exit {proc.returncode})"}

        return CodeExecuteResponse(
            stdout=stdout if stdout else None,
            stderr=stderr if stderr else None,
            status=status,
            time=f"{elapsed:.3f}",
            source="quantum_sandbox"
        )
    except subprocess.TimeoutExpired:
        elapsed = time.time() - start_time
        return CodeExecuteResponse(
            stdout=None,
            stderr=f"Time Limit Exceeded ({timeout}s)",
            status={"id": 5, "description": "Time Limit Exceeded"},
            time=f"{elapsed:.3f}",
            source="quantum_sandbox"
        )
    except Exception as e:
        elapsed = time.time() - start_time
        return CodeExecuteResponse(
            stdout=None,
            stderr=f"Execution Error: {str(e)}",
            status={"id": 13, "description": "Internal Error"},
            time=f"{elapsed:.3f}",
            source="quantum_sandbox"
        )
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
