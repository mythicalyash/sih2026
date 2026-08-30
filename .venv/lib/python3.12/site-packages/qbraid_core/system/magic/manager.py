# Copyright (c) 2025, qBraid Development Team
# All rights reserved.

"""
Module defining functions to manage setup and configuration
of qBraid IPython magic commands.

"""

import logging
import shutil
from pathlib import Path

from qbraid_core.config import USER_CONFIG_PATH
from qbraid_core.system.exceptions import QbraidSystemError

logger = logging.getLogger(__name__)

MAGIC_FILE = "qbraid_magic.py"


def add_magic_file():
    """
    Copies the 'qbraid_magic.py' file from the qbraid_core.system.magic module
    to a directory specified by the parent of USER_CONFIG_PATH.

    Raises:
        FileNotFoundError: If the source 'magic.py' file does not exist.
        QbraidSystemError: For other unforeseen errors that may occur during file copying.
    """
    src_path = Path(__file__).parent / MAGIC_FILE
    dst_path = Path(USER_CONFIG_PATH).parent / MAGIC_FILE

    # Attempt to copy the file from source to destination
    try:
        if not src_path.exists():
            raise FileNotFoundError(f"Source file does not exist: {src_path}")

        # Perform the file copy
        shutil.copy(str(src_path), str(dst_path))
        logger.debug("Successfully copied %s to %s", src_path, dst_path)

    except Exception as err:
        raise QbraidSystemError(f"Failed to copy magic file from {src_path} to {dst_path}") from err


def remove_magic_file():
    """
    Removes the 'qbraid_magic.py' file from directory defined
    by the parent of USER_CONFIG_PATH if it exists.

    Raises:
        QbraidSystemError: For other unforeseen errors that may occur during file deletion.
    """
    qbraid_magic = Path(USER_CONFIG_PATH).parent / MAGIC_FILE

    # Attempt to copy the file from source to destination
    try:
        if qbraid_magic.exists():
            qbraid_magic.unlink()
            logger.debug("Successfully removed %s", qbraid_magic)

    except Exception as err:
        raise QbraidSystemError(f"Failed to remove magic file from {qbraid_magic}") from err
