#!/usr/bin/env -S uv run --script
# /// script
# dependencies = [
#   "pyyaml",
# ]
# ///
"""Run trigger evaluation for a skill description using OpenCode."""

from __future__ import annotations

import argparse
import json
import select
import subprocess
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

try:
    from .utils import (
        get_skill_repository_root,
        parse_skill_md,
        stage_skill_for_opencode,
        validate_trigger_eval_set,
    )
except ImportError:
    from utils import (
        get_skill_repository_root,
        parse_skill_md,
        stage_skill_for_opencode,
        validate_trigger_eval_set,
    )


def run_single_query(
    query: str,
    visible_skill_name: str,
    project_root: str,
    agent: str = "smart",
    model: str | None = None,
    timeout: int = 90,
) -> bool:
    wrapped_query = (
        "Routing eval mode. Decide whether the normal OpenCode skill-selection mechanism should load a skill for the "
        "user request below. Do not manually inspect files. Do not continue executing a loaded skill. Stop as soon as "
        "the routing decision is made.\n\n"
        f"<user_request>\n{query}\n</user_request>"
    )
    command = ["opencode", "run", "--agent", agent, "--format", "json", "--dir", project_root]
    if model:
        command.extend(["--model", model])
    command.append(wrapped_query)

    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    try:
        if process.stdout is None or process.stderr is None:
            raise RuntimeError("Failed to capture OpenCode output")

        start = time.time()
        while time.time() - start < timeout:
            if process.poll() is not None:
                break

            ready, _, _ = select.select([process.stdout], [], [], 1.0)
            if not ready:
                continue

            line = process.stdout.readline().strip()
            if not line.startswith("{"):
                continue
            try:
                event = json.loads(line)
            except json.JSONDecodeError:
                continue

            if event.get("type") != "tool_use":
                continue
            part = event.get("part", {})
            if part.get("tool") != "skill":
                continue
            state = part.get("state", {})
            input_payload = state.get("input", {})
            if input_payload.get("name") == visible_skill_name:
                process.terminate()
                process.wait(timeout=5)
                return True

        if process.poll() is None:
            process.terminate()
            process.wait(timeout=5)
            raise RuntimeError(f"opencode run timed out after {timeout} seconds")

        if process.returncode not in (0, None):
            stderr_text = process.stderr.read().strip()
            stdout_tail = process.stdout.read().strip()
            raise RuntimeError(stderr_text or stdout_tail or f"opencode run failed with code {process.returncode}")

        return False
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait()
        raise RuntimeError(f"opencode run timed out after {timeout} seconds")
    finally:
        if process.poll() is None:
            process.kill()
            process.wait()


def run_eval(
    eval_set: list[dict],
    skill_path: Path,
    num_workers: int,
    runs_per_query: int = 1,
    trigger_threshold: float = 0.5,
    model: str | None = None,
    agent: str = "smart",
    description_override: str | None = None,
    timeout: int = 90,
) -> dict:
    project_root = get_skill_repository_root()

    with stage_skill_for_opencode(skill_path, description_override=description_override) as staged:
        visible_skill_name, _, _ = staged

        query_results: dict[str, list[bool]] = {}
        query_items: dict[str, dict] = {}

        with ProcessPoolExecutor(max_workers=num_workers) as executor:
            futures = {}
            for item in eval_set:
                for _ in range(runs_per_query):
                    future = executor.submit(
                        run_single_query,
                        item["query"],
                        visible_skill_name,
                        str(project_root),
                        agent,
                        model,
                        timeout,
                    )
                    futures[future] = item

            for future in as_completed(futures):
                item = futures[future]
                query = item["query"]
                query_items[query] = item
                query_results.setdefault(query, []).append(bool(future.result()))

    results = []
    passed = 0
    for query, triggers in query_results.items():
        item = query_items[query]
        trigger_count = sum(1 for value in triggers if value)
        observed_rate = trigger_count / len(triggers)
        expected = bool(item["should_trigger"])
        observed = observed_rate >= trigger_threshold
        row = {
            "query": query,
            "should_trigger": expected,
            "triggers": trigger_count,
            "runs": len(triggers),
            "observed_rate": round(observed_rate, 4),
            "pass": observed == expected,
        }
        if row["pass"]:
            passed += 1
        results.append(row)

    _, description, _ = parse_skill_md(skill_path)
    if description_override is not None:
        description = " ".join(description_override.split())
    results.sort(key=lambda item: item["query"])
    return {
        "results": results,
        "summary": {
            "passed": passed,
            "failed": len(results) - passed,
            "total": len(results),
        },
        "description": description,
        "backend": "opencode",
        "agent": agent,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Run trigger evals for a skill description")
    parser.add_argument("--eval-set", required=True, help="Path to JSON trigger eval set")
    parser.add_argument("--skill-path", required=True, help="Path to skill directory")
    parser.add_argument("--output", default=None, help="Optional output JSON path")
    parser.add_argument("--num-workers", type=int, default=4)
    parser.add_argument("--runs-per-query", type=int, default=1)
    parser.add_argument("--trigger-threshold", type=float, default=0.5)
    parser.add_argument("--model", default=None)
    parser.add_argument("--agent", default="smart")
    parser.add_argument("--timeout", type=int, default=90)
    args = parser.parse_args()

    eval_items = validate_trigger_eval_set(json.loads(Path(args.eval_set).read_text()))
    result = run_eval(
        eval_items,
        Path(args.skill_path),
        args.num_workers,
        args.runs_per_query,
        args.trigger_threshold,
        args.model,
        args.agent,
        None,
        args.timeout,
    )

    output = json.dumps(result, indent=2)
    if args.output:
        Path(args.output).write_text(output)
    else:
        print(output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
