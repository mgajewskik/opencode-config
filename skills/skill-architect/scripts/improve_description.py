#!/usr/bin/env -S uv run --script
# /// script
# dependencies = [
#   "pyyaml",
# ]
# ///
"""Improve a skill description from trigger-eval failures using OpenCode."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

try:
    from .utils import (
        extract_text_from_opencode_events,
        get_skill_repository_root,
        parse_skill_md,
        replace_description,
        run_opencode_json,
    )
except ImportError:
    from utils import (
        extract_text_from_opencode_events,
        get_skill_repository_root,
        parse_skill_md,
        replace_description,
        run_opencode_json,
    )


def _call_opencode(prompt: str, model: str | None, agent: str) -> str:
    events = run_opencode_json(prompt, agent=agent, model=model, directory=get_skill_repository_root())
    text = extract_text_from_opencode_events(events)
    if not text:
        raise RuntimeError("opencode run returned no text output")
    return text


def improve_description(
    skill_name: str,
    skill_content: str,
    current_description: str,
    eval_results: dict,
    model: str | None = None,
    history: list[dict] | None = None,
    agent: str = "smart",
) -> str:
    failed_positive = [result for result in eval_results["results"] if result["should_trigger"] and not result["pass"]]
    failed_negative = [
        result for result in eval_results["results"] if not result["should_trigger"] and not result["pass"]
    ]

    prompt = [
        f'You are improving the description for an OpenCode skill named "{skill_name}".',
        "The description is the only thing visible before the skill loads.",
        "Write a new description that improves trigger accuracy without becoming a keyword dump.",
        "Stay well below the 1024 character limit.",
        "Respond with only the description wrapped in <new_description> tags.",
        "",
        f'Current description: "{current_description}"',
        "",
        "Failed positives (should have triggered):",
    ]
    if failed_positive:
        prompt.extend(
            f"- {result['query']} (observed {result['triggers']}/{result['runs']})" for result in failed_positive
        )
    else:
        prompt.append("- none")

    prompt.append("")
    prompt.append("Failed negatives (should NOT have triggered):")
    if failed_negative:
        prompt.extend(
            f"- {result['query']} (observed {result['triggers']}/{result['runs']})" for result in failed_negative
        )
    else:
        prompt.append("- none")

    if history:
        prompt.append("")
        prompt.append("Previous attempts to avoid repeating:")
        for item in history:
            prompt.append(f"- {item.get('description', '')}: {item.get('score', '')}".strip())

    prompt.extend(
        [
            "",
            "Skill content for context:",
            skill_content,
        ]
    )

    response = _call_opencode("\n".join(prompt), model=model, agent=agent)
    match = re.search(r"<new_description>(.*?)</new_description>", response, re.DOTALL)
    description = " ".join((match.group(1) if match else response).strip().strip('"').split())
    if len(description) > 1024:
        raise ValueError("Generated description exceeds 1024 character limit")
    return description


def main() -> int:
    parser = argparse.ArgumentParser(description="Improve a skill description from eval results")
    parser.add_argument("--eval-results", required=True)
    parser.add_argument("--skill-path", required=True)
    parser.add_argument("--model", default=None)
    parser.add_argument("--agent", default="smart")
    parser.add_argument("--history", default=None)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    eval_results = json.loads(Path(args.eval_results).read_text())
    history = json.loads(Path(args.history).read_text()) if args.history else None
    skill_path = Path(args.skill_path)
    name, current_description, content = parse_skill_md(skill_path)
    new_description = improve_description(
        name,
        content,
        current_description,
        eval_results,
        model=args.model,
        history=history,
        agent=args.agent,
    )

    if args.apply:
        replace_description(skill_path, new_description)

    print(new_description)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
