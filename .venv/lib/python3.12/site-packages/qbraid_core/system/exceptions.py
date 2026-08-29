# Copyright (c) 2025, qBraid Development Team
# All rights reserved.

"""
Module defining custom exceptions for the qBraid system module.

"""

from qbraid_core.exceptions import QbraidException


class QbraidSystemError(QbraidException):
    """Base class for errors raised by the qBraid system module."""


class UnknownFileSystemObjectError(QbraidSystemError):
    """Raised when the path does not point to a known file system object."""


class VersionNotFoundError(QbraidSystemError):
    """Class for exceptions raised while extracting version from package metadata."""


class InvalidVersionError(QbraidSystemError):
    """Raised when a version string is not a valid version."""


__all__ = [
    "InvalidVersionError",
    "QbraidSystemError",
    "UnknownFileSystemObjectError",
    "VersionNotFoundError",
]
