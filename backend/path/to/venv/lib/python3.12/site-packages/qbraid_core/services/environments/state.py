# Copyright (c) 2025, qBraid Development Team
# All rights reserved.

"""
Module for checking and updating environment's state/status file(s).

"""

import json
import logging
from pathlib import Path
from typing import Optional, Union

from .paths import get_env_path

logger = logging.getLogger(__name__)


def install_status_codes(slug: str) -> dict[str, Union[int, str]]:
    """Return environment's install status codes."""

    def read_from_json(file_path: Path) -> dict[str, Union[int, str]]:
        try:
            with file_path.open("r", encoding="utf-8") as file:
                json_data: dict = json.load(file)
                return json_data.get("install", {})
        except (IOError, json.JSONDecodeError) as err:
            logger.error("Error reading state.json: %s", err)
            return {}

    def read_from_txt(file_path: Path) -> dict[str, Union[int, str]]:
        data: dict[str, Union[int, str]] = {}
        try:
            with file_path.open("r", encoding="utf-8") as file:
                lines = file.readlines()
                for line in lines:
                    key, value = line.split(":", 1)
                    if key in ["complete", "success"]:
                        data[key] = int(value.strip())
                    elif key == "message":
                        data[key] = value.strip()
        except IOError as err:
            logger.error("Error reading install_status.txt: %s", err)
        return data

    slug_path = get_env_path(slug)
    status_json_path = slug_path / "state.json"
    status_txt_path = slug_path / "install_status.txt"

    data: dict[str, Union[int, str]] = {"complete": 1, "success": 1, "message": ""}

    if status_json_path.is_file():
        data.update(read_from_json(status_json_path))
    elif status_txt_path.is_file():
        data.update(read_from_txt(status_txt_path))

    return data


def update_state_json(
    slug_path: Union[str, Path],
    complete: int,
    success: int,
    message: Optional[str] = None,
) -> None:
    """
    Update environment's install status values in a JSON file.
    Truth table values: 0 = False, 1 = True, -1 = Unknown
    """
    sanitized_message = message.replace("\n", " ") if message else ""

    slug_path = Path(slug_path) if isinstance(slug_path, str) else slug_path
    state_json_path = slug_path / "state.json"

    data: dict = {
        "install": {"complete": complete, "success": success, "message": sanitized_message}
    }

    try:
        if state_json_path.exists():
            with state_json_path.open("r", encoding="utf-8") as file:
                existing_data: dict = json.load(file)
                existing_data.update(data)
                data = existing_data
    except json.JSONDecodeError as err:
        logger.error(
            "Error decoding JSON from state.json: %s. Reinitializing file with new data.", err
        )

    with state_json_path.open("w", encoding="utf-8") as file:
        json.dump(data, file, indent=2, ensure_ascii=False)
