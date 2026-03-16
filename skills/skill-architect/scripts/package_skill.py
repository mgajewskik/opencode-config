#!/usr/bin/env -S uv run --script
# /// script
# dependencies = [
#   "pyyaml",
# ]
# ///
"""Package a skill directory into a distributable .skill archive."""

from __future__ import annotations

import sys
import zipfile
from pathlib import Path

try:
    from .quick_validate import validate_skill
except ImportError:
    from quick_validate import validate_skill


def package_skill(skill_path: str, output_dir: str | None = None) -> Path:
    source = Path(skill_path).resolve()
    if not source.is_dir():
        raise FileNotFoundError(f"Skill directory not found: {source}")

    valid, message = validate_skill(source)
    if not valid:
        raise ValueError(message)

    destination_dir = Path(output_dir).resolve() if output_dir else Path.cwd()
    destination_dir.mkdir(parents=True, exist_ok=True)
    archive_path = destination_dir / f"{source.name}.skill"

    with zipfile.ZipFile(archive_path, "w", zipfile.ZIP_DEFLATED) as archive:
        for file_path in source.rglob("*"):
            if file_path.is_file() and "__pycache__" not in file_path.parts:
                archive.write(file_path, file_path.relative_to(source.parent))

    return archive_path


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: uv run scripts/package_skill.py <skill-dir> [output-dir]")
        return 1
    try:
        archive_path = package_skill(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
    except Exception as exc:
        print(f"Error: {exc}")
        return 1
    print(f"Packaged skill to {archive_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
