# Copyright (c) 2025, qBraid Development Team
# All rights reserved.

"""
Module for efficient multi-threaded copying and removal of files and directories.

"""

import asyncio
import os
import shutil
import threading
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Optional

from .exceptions import UnknownFileSystemObjectError


def remove_pycache_dirs(directory: str) -> None:
    """Remove all __pycache__ directories in the given directory."""
    for root, dirs, _ in os.walk(directory):
        if "__pycache__" in dirs:
            pycache_path = os.path.join(root, "__pycache__")
            shutil.rmtree(pycache_path)


async def remove_pycache_loop(venv_path: str) -> None:
    """Remove all __pycache__ directories in the given directory."""
    loop = asyncio.get_running_loop()
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = []
        for root, dirs, _ in os.walk(venv_path):
            for d in dirs:
                full_path = os.path.join(root, d)
                # Run each directory removal in a separate thread
                future = loop.run_in_executor(executor, remove_pycache_dirs, full_path)
                futures.append(future)
        # Wait for all futures to complete
        await asyncio.gather(*futures)


def remove_pycache(venv_path: str) -> None:
    """Remove all __pycache__ directories in the given directory."""
    asyncio.run(remove_pycache_loop(venv_path))


class FileManager:
    """Class for efficient multi-threaded copying and removal of files and directories."""

    def __init__(self):
        self._counter = 0

    def counter(self) -> int:
        """Return the number of threads invoked."""
        return self._counter

    def reset_counter(self):
        """Reset the counter to 0."""
        self._counter = 0

    def copy_async(self, src_path: Path, dst_path: Path):
        """Thread function for copying files and directories.

        Args:
            src_path (pathlib.Path): The source path of the file or directory to be copied.
            dst_path (pathlib.Path): The destination path of the file or directory to be copied.
        """
        try:
            if src_path.is_dir():
                shutil.copytree(
                    src_path,
                    dst_path,
                    symlinks=True,
                    ignore=shutil.ignore_patterns("__pycache__", ".ipynb_checkpoints"),
                )
            elif src_path.is_file():
                shutil.copy(src_path, dst_path)
            else:
                pass
        except (FileExistsError, FileNotFoundError):
            pass

    def copy_tree(self, src_path: Path, dst_path: Path, ignore: Optional[list[str]] = None) -> None:
        """Initiates threaded copying of files and directories from the source to the destination.

        Args:
            src_path (pathlib.Path): The source path of the file or directory to be copied.
            dst_path (pathlib.Path): The destination path of the file or directory to be copied.
            ignore (optional, list[str]): A list of files and directories to be skipped.

        Raises:
            UnknownFileSystemObjectError: Raised when path points to an unknown file system object.
        """
        ignore_glob = {"__pycache__", ".ipynb_checkpoints"}
        ignore_shallow = set(ignore or []) | ignore_glob

        dirs_and_files_iter = [p for p in src_path.iterdir() if p.name not in ignore_shallow]

        for path_item in dirs_and_files_iter:
            srcp = path_item
            dstp = dst_path / path_item.name
            if path_item.is_file():
                thread = threading.Thread(target=self.copy_async, args=(srcp, dstp))
                thread.daemon = True
                thread.start()
            elif path_item.is_dir() and path_item.name not in ignore_glob:
                dstp.mkdir(exist_ok=True)
                self.copy_tree(srcp, dstp)
            elif path_item.is_symlink():
                linkto = srcp.readlink()
                dstp.symlink_to(linkto)
            else:
                raise UnknownFileSystemObjectError(
                    f"The path '{srcp}' is not a file, directory, or symbolic link."
                )

    def remove_async(self, path: Path):
        """Thread function for removing files, directories, and symbolic links."""
        try:
            self._counter += 1
            if path.is_dir():
                shutil.rmtree(path, ignore_errors=True)
            elif path.is_file() or path.is_symlink():
                path.unlink()
        except Exception:  # pylint: disable=broad-exception-caught
            pass

    def remove_tree(self, src_path: Path):
        """Initiates threaded removal of files, directories, and symbolic links."""
        if not src_path.is_dir():
            return

        for dir_file in src_path.iterdir():
            if dir_file.is_file() or dir_file.is_symlink() or dir_file.is_dir():
                thread = threading.Thread(target=self.remove_async, args=(dir_file,))
                thread.daemon = True
                thread.start()

        # Finally, remove the src_path directory itself in a new thread
        thread = threading.Thread(target=self.remove_async, args=(src_path,))
        thread.daemon = True
        thread.start()

    def join_threads(self):
        """Wait for all threads to finish."""
        main_thread = threading.current_thread()
        for thread in threading.enumerate():
            if thread is main_thread:
                continue
            thread.join()


__all__ = ["FileManager", "remove_pycache", "remove_pycache_loop", "remove_pycache_dirs"]
