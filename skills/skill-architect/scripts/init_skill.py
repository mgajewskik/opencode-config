#!/usr/bin/env -S uv run --script
"""Initialize a new skill with a progressive-disclosure skeleton."""

from __future__ import annotations

import sys
from pathlib import Path


SKILL_TEMPLATE = """---
name: {skill_name}
description: "Use this skill for [WHAT]. Trigger it when the user needs [WHEN], especially around [boundary terms and scenarios]."
---

# {skill_title}

One-sentence statement of what this skill helps Claude do.

## Start Here

Classify the request before loading more context.

- Architecture/design request -> read `references/architecture.md`
- Evaluation/refinement request -> read `references/evaluation.md`
- Environment-specific mechanics -> read `references/environment.md`

Do not load every reference file at once.

## Core Workflow

1. Identify user intent and trigger boundary
2. Load the minimal reference material needed
3. Execute the workflow
4. Verify the result
5. Report outcome and next step

## Guardrails

- Keep this file compact
- Push deep detail into `references/`
- Move repeated deterministic work into `scripts/`
- Add `agents/` only if specialist grading or comparison is useful
"""

ARCHITECTURE_REFERENCE = """# Architecture

Document the discovery questions, archetype choice, structure decisions, and failure modes for this skill.

Recommended sections:

1. Trigger boundary
2. Input/output contract
3. Workflow patterns
4. Anti-patterns
5. Split-vs-one-skill decision
"""

EVALUATION_REFERENCE = """# Evaluation

Describe how to test this skill.

Recommended sections:

1. Representative prompts
2. Baseline choice
3. Assertions worth checking
4. Human review criteria
5. Iteration signals
"""

ENVIRONMENT_REFERENCE = """# Environment

Note any environment-specific adaptations:

- tools required
- browser/headless differences
- packaging notes
- fallback workflow when automation is unavailable
"""

EVALS_TEMPLATE = """{{
  "skill_name": "{skill_name}",
  "evals": [
    {{
      "id": 1,
      "prompt": "Realistic user request here",
      "expected_output": "What success looks like",
      "files": [],
      "expectations": []
    }}
  ]
}}
"""

TRIGGER_EVALS_TEMPLATE = """[
  {
    "query": "I need help creating a reusable skill for triaging support tickets with clear trigger boundaries.",
    "should_trigger": true
  },
  {
    "query": "Write a Python function that sums two numbers.",
    "should_trigger": false
  }
]
"""


def title_case_skill_name(skill_name: str) -> str:
    return " ".join(word.capitalize() for word in skill_name.split("-"))


def write_file(path: Path, content: str, executable: bool = False) -> None:
    path.write_text(content)
    if executable:
        path.chmod(0o755)


def init_skill(skill_name: str, destination: str) -> Path:
    skill_dir = Path(destination).resolve() / skill_name
    if skill_dir.exists():
        raise FileExistsError(f"Skill directory already exists: {skill_dir}")

    skill_dir.mkdir(parents=True)
    for subdir in ("references", "scripts", "agents", "assets", "evals"):
        (skill_dir / subdir).mkdir()

    write_file(
        skill_dir / "SKILL.md",
        SKILL_TEMPLATE.format(skill_name=skill_name, skill_title=title_case_skill_name(skill_name)),
    )
    write_file(skill_dir / "references" / "architecture.md", ARCHITECTURE_REFERENCE)
    write_file(skill_dir / "references" / "evaluation.md", EVALUATION_REFERENCE)
    write_file(skill_dir / "references" / "environment.md", ENVIRONMENT_REFERENCE)
    write_file(skill_dir / "evals" / "evals.json", EVALS_TEMPLATE.format(skill_name=skill_name))
    write_file(skill_dir / "evals" / "trigger-evals.json", TRIGGER_EVALS_TEMPLATE)
    write_file(skill_dir / "scripts" / "README.txt", "Add deterministic helpers here when repeated work emerges.\n")

    return skill_dir


def main() -> int:
    if len(sys.argv) < 4 or sys.argv[2] != "--path":
        print("Usage: uv run scripts/init_skill.py <skill-name> --path <directory>")
        return 1

    skill_name = sys.argv[1]
    destination = sys.argv[3]
    try:
        skill_dir = init_skill(skill_name, destination)
    except Exception as exc:
        print(f"Error: {exc}")
        return 1

    print(f"Initialized skill at {skill_dir}")
    print("Next steps:")
    print("1. Fill in the trigger boundary and architecture notes")
    print("2. Add task evals to evals/evals.json and trigger evals to evals/trigger-evals.json")
    print("3. Run uv run scripts/quick_validate.py <skill-dir> before packaging")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
