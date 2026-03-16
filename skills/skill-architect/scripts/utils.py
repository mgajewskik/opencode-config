from __future__ import annotations

import json
import shutil
import subprocess
import uuid
from contextlib import contextmanager
from pathlib import Path

import yaml


def validate_trigger_eval_set(eval_items: object) -> list[dict]:
    """Validate and normalize trigger-eval items."""
    if not isinstance(eval_items, list):
        raise ValueError("Trigger eval set must be a JSON array of objects with 'query' and 'should_trigger'")

    normalized = []
    for index, item in enumerate(eval_items, start=1):
        if not isinstance(item, dict):
            raise ValueError(f"Trigger eval {index} must be an object")
        if "query" not in item or "should_trigger" not in item:
            raise ValueError(
                f"Trigger eval {index} must include 'query' and 'should_trigger'. "
                "Use evals/trigger-evals.json for description optimization, not evals/evals.json."
            )
        if not isinstance(item["query"], str) or not item["query"].strip():
            raise ValueError(f"Trigger eval {index} has an invalid 'query'")
        if not isinstance(item["should_trigger"], bool):
            raise ValueError(f"Trigger eval {index} has non-boolean 'should_trigger'")
        normalized.append({"query": item["query"].strip(), "should_trigger": item["should_trigger"]})

    return normalized


def parse_skill_md(skill_path: Path) -> tuple[str, str, str]:
    """Return (name, description, full_content) from a skill directory."""
    content = (skill_path / "SKILL.md").read_text()
    lines = content.splitlines()

    if not lines or lines[0].strip() != "---":
        raise ValueError("SKILL.md missing frontmatter")

    end_idx = None
    for idx, line in enumerate(lines[1:], start=1):
        if line.strip() == "---":
            end_idx = idx
            break
    if end_idx is None:
        raise ValueError("SKILL.md missing closing frontmatter delimiter")

    frontmatter = yaml.safe_load("\n".join(lines[1:end_idx]))
    if not isinstance(frontmatter, dict):
        raise ValueError("Frontmatter must parse to a mapping")

    name = str(frontmatter.get("name", "")).strip()
    description = " ".join(str(frontmatter.get("description", "")).split())

    return name, description, content


def get_skill_repository_root() -> Path:
    """Return the OpenCode config root that contains the skills directory."""
    return Path(__file__).resolve().parents[3]


def get_skills_root() -> Path:
    """Return the root directory that contains installed skills."""
    return Path(__file__).resolve().parents[2]


def rewrite_frontmatter(skill_path: Path, **updates: str) -> None:
    """Safely rewrite selected frontmatter fields in SKILL.md."""
    skill_md = skill_path / "SKILL.md"
    lines = skill_md.read_text().splitlines()
    if not lines or lines[0].strip() != "---":
        raise ValueError("SKILL.md missing frontmatter")

    end_idx = None
    for idx, line in enumerate(lines[1:], start=1):
        if line.strip() == "---":
            end_idx = idx
            break
    if end_idx is None:
        raise ValueError("SKILL.md missing closing frontmatter delimiter")

    frontmatter = yaml.safe_load("\n".join(lines[1:end_idx]))
    if not isinstance(frontmatter, dict):
        raise ValueError("Frontmatter must parse to a mapping")

    for key, value in updates.items():
        frontmatter[key] = value

    dumped_frontmatter = yaml.safe_dump(frontmatter, sort_keys=False, allow_unicode=False).strip()
    body = "\n".join(lines[end_idx + 1 :]).lstrip("\n")
    rewritten = f"---\n{dumped_frontmatter}\n---\n"
    if body:
        rewritten += f"\n{body}\n"
    skill_md.write_text(rewritten)


def replace_description(skill_path: Path, new_description: str) -> None:
    """Replace the description field in a skill's frontmatter."""
    normalized_description = " ".join(new_description.split())
    rewrite_frontmatter(skill_path, description=normalized_description)


@contextmanager
def stage_skill_for_opencode(skill_path: Path, description_override: str | None = None):
    """Ensure the target skill is visible to `opencode run` during evaluation."""
    source = skill_path.resolve()
    skills_root = get_skills_root()
    if source.parent == skills_root:
        if description_override is None:
            name, _, _ = parse_skill_md(source)
            yield name, source, False
            return

        alias = f"tmp-eval-{uuid.uuid4().hex[:8]}"
        staged = skills_root / alias
        shutil.copytree(source, staged, ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
        rewrite_frontmatter(staged, name=alias, description=" ".join(description_override.split()))
        try:
            yield alias, staged, True
        finally:
            shutil.rmtree(staged, ignore_errors=True)
        return

    alias = f"tmp-eval-{uuid.uuid4().hex[:8]}"
    staged = skills_root / alias
    shutil.copytree(source, staged, ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
    updates = {"name": alias}
    if description_override is not None:
        updates["description"] = " ".join(description_override.split())
    rewrite_frontmatter(staged, **updates)
    try:
        yield alias, staged, True
    finally:
        shutil.rmtree(staged, ignore_errors=True)


def run_opencode_json(
    prompt: str,
    agent: str = "smart",
    model: str | None = None,
    directory: Path | None = None,
    timeout: int = 300,
) -> list[dict]:
    """Run `opencode run` and return parsed JSON events."""
    command = ["opencode", "run", "--agent", agent, "--format", "json"]
    if model:
        command.extend(["--model", model])
    if directory:
        command.extend(["--dir", str(directory)])
    command.append(prompt)

    result = subprocess.run(command, capture_output=True, text=True, timeout=timeout)
    if result.returncode != 0:
        raise RuntimeError(
            result.stderr.strip() or result.stdout.strip() or f"opencode run failed with code {result.returncode}"
        )

    events = []
    for line in result.stdout.splitlines():
        line = line.strip()
        if not line or not line.startswith("{"):
            continue
        try:
            events.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return events


def extract_text_from_opencode_events(events: list[dict]) -> str:
    """Collect text blocks from an OpenCode JSON event stream."""
    parts = []
    for event in events:
        if event.get("type") != "text":
            continue
        part = event.get("part", {})
        text = part.get("text")
        if isinstance(text, str) and text:
            parts.append(text)
    return "\n".join(parts).strip()
