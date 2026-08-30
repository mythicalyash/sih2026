# Copyright (c) 2025, qBraid Development Team
# All rights reserved.

"""
Module providing context managers for managing resource setup and cleanup around code blocks.

"""

from contextlib import contextmanager
from pathlib import Path


@contextmanager
def ensure_directory(path: Path, remove_if_created: bool):
    """
    Context manager to handle temporary directory creation and cleanup.

    Args:
        path (Path): The path to the directory.
        remove_if_created (bool): Whether to remove the directory if it's created
                                  during the context.

    Yields:
        None: The function is a generator and yields nothing.

    Returns:
        A context manager that yields None.
    """
    existed = path.exists()
    if not existed:
        path.mkdir(parents=True, exist_ok=True)
    try:
        yield
    finally:
        if not existed and remove_if_created:
            for child in path.iterdir():
                child.unlink()  # Attempt to delete files
            path.rmdir()  # Remove directory only if empty
