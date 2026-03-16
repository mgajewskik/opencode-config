#!/usr/bin/env -S uv run --script
# /// script
# dependencies = [
#   "pyyaml",
# ]
# ///
"""Run repeated trigger evaluation and description improvement."""

from __future__ import annotations

import argparse
import json
import random
import webbrowser
from pathlib import Path

try:
    from .generate_report import generate_html
    from .improve_description import improve_description
    from .run_eval import run_eval
    from .utils import parse_skill_md, replace_description, validate_trigger_eval_set
except ImportError:
    from generate_report import generate_html
    from improve_description import improve_description
    from run_eval import run_eval
    from utils import parse_skill_md, replace_description, validate_trigger_eval_set


def split_eval_set(eval_set: list[dict], holdout: float, seed: int = 42) -> tuple[list[dict], list[dict]]:
    random.seed(seed)
    positives = [item for item in eval_set if item["should_trigger"]]
    negatives = [item for item in eval_set if not item["should_trigger"]]
    random.shuffle(positives)
    random.shuffle(negatives)

    pos_test = max(1, int(len(positives) * holdout)) if positives else 0
    neg_test = max(1, int(len(negatives) * holdout)) if negatives else 0
    test = positives[:pos_test] + negatives[:neg_test]
    train = positives[pos_test:] + negatives[neg_test:]
    return train or test, test if train else []


def run_loop(
    eval_set: list[dict],
    skill_path: Path,
    model: str | None,
    agent: str,
    max_iterations: int,
    holdout: float,
    num_workers: int,
    runs_per_query: int,
    trigger_threshold: float,
    timeout: int,
) -> dict:
    skill_name, original_description, content = parse_skill_md(skill_path)
    train_set, test_set = split_eval_set(eval_set, holdout) if holdout > 0 else (eval_set, [])

    history = []
    current_description = original_description
    best_description = original_description
    best_score = -1

    for iteration in range(1, max_iterations + 1):
        train_results = run_eval(
            train_set,
            skill_path,
            num_workers,
            runs_per_query,
            trigger_threshold,
            model,
            agent,
            current_description,
            timeout,
        )
        test_results = None
        if test_set:
            test_results = run_eval(
                test_set,
                skill_path,
                num_workers,
                runs_per_query,
                trigger_threshold,
                model,
                agent,
                current_description,
                timeout,
            )

        train_summary = train_results["summary"]
        test_summary = test_results["summary"] if test_results else None
        score = test_summary["passed"] if test_summary else train_summary["passed"]

        history.append(
            {
                "iteration": iteration,
                "description": current_description,
                "train_passed": train_summary["passed"],
                "train_failed": train_summary["failed"],
                "train_total": train_summary["total"],
                "train_results": train_results["results"],
                "test_passed": test_summary["passed"] if test_summary else None,
                "test_failed": test_summary["failed"] if test_summary else None,
                "test_total": test_summary["total"] if test_summary else None,
                "test_results": test_results["results"] if test_results else None,
                "score": score,
            }
        )

        if score > best_score:
            best_score = score
            best_description = current_description

        if train_summary["failed"] == 0 or iteration == max_iterations:
            break

        current_description = improve_description(
            skill_name,
            content,
            current_description,
            train_results,
            model=model,
            history=[{"description": item["description"], "score": item["score"]} for item in history],
            agent=agent,
        )

    return {
        "skill_name": skill_name,
        "original_description": original_description,
        "best_description": best_description,
        "best_score": best_score,
        "iterations_run": len(history),
        "holdout": holdout,
        "train_size": len(train_set),
        "test_size": len(test_set),
        "history": history,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Run description optimization loop")
    parser.add_argument("--eval-set", required=True)
    parser.add_argument("--skill-path", required=True)
    parser.add_argument("--model", default=None)
    parser.add_argument("--agent", default="smart")
    parser.add_argument("--max-iterations", type=int, default=5)
    parser.add_argument("--holdout", type=float, default=0.4)
    parser.add_argument("--num-workers", type=int, default=4)
    parser.add_argument("--runs-per-query", type=int, default=3)
    parser.add_argument("--trigger-threshold", type=float, default=0.5)
    parser.add_argument("--timeout", type=int, default=90)
    parser.add_argument("--output", default=None)
    parser.add_argument("--html", default=None)
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--open-report", action="store_true")
    args = parser.parse_args()

    eval_items = validate_trigger_eval_set(json.loads(Path(args.eval_set).read_text()))

    result = run_loop(
        eval_items,
        Path(args.skill_path),
        args.model,
        args.agent,
        args.max_iterations,
        args.holdout,
        args.num_workers,
        args.runs_per_query,
        args.trigger_threshold,
        args.timeout,
    )

    output_path = Path(args.output) if args.output else None
    if output_path:
        output_path.write_text(json.dumps(result, indent=2))
    else:
        print(json.dumps(result, indent=2))

    if args.html:
        html_path = Path(args.html)
        html_path.write_text(generate_html(result, skill_name=result["skill_name"]))
        if args.open_report:
            webbrowser.open(html_path.resolve().as_uri())

    if args.apply:
        replace_description(Path(args.skill_path), result["best_description"])

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
