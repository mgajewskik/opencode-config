#!/usr/bin/env -S uv run --script
"""Aggregate grading artifacts into benchmark summary statistics."""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path


def calculate_stats(values: list[float]) -> dict:
    if not values:
        return {"mean": 0.0, "stddev": 0.0, "min": 0.0, "max": 0.0}
    mean = sum(values) / len(values)
    variance = 0.0
    if len(values) > 1:
        variance = sum((value - mean) ** 2 for value in values) / (len(values) - 1)
    return {
        "mean": round(mean, 4),
        "stddev": round(math.sqrt(variance), 4),
        "min": round(min(values), 4),
        "max": round(max(values), 4),
    }


def load_results(iteration_dir: Path) -> dict[str, list[dict]]:
    configs: dict[str, list[dict]] = {}
    for eval_dir in sorted(iteration_dir.glob("eval-*")):
        for config_dir in sorted(path for path in eval_dir.iterdir() if path.is_dir()):
            grading_file = config_dir / "grading.json"
            if not grading_file.exists():
                continue
            grading = json.loads(grading_file.read_text())
            summary = grading.get("summary", {})
            timing = grading.get("timing", {})
            metrics = grading.get("execution_metrics", {})
            configs.setdefault(config_dir.name, []).append(
                {
                    "pass_rate": float(summary.get("pass_rate", 0.0)),
                    "time_seconds": float(timing.get("total_duration_seconds", 0.0)),
                    "tokens": float(timing.get("total_tokens", metrics.get("total_tokens", 0))),
                    "tool_calls": float(metrics.get("total_tool_calls", 0)),
                }
            )
    return configs


def aggregate(iteration_dir: Path, skill_name: str = "") -> dict:
    loaded = load_results(iteration_dir)
    summary = {}
    for config, rows in loaded.items():
        summary[config] = {
            "pass_rate": calculate_stats([row["pass_rate"] for row in rows]),
            "time_seconds": calculate_stats([row["time_seconds"] for row in rows]),
            "tokens": calculate_stats([row["tokens"] for row in rows]),
            "tool_calls": calculate_stats([row["tool_calls"] for row in rows]),
        }

    config_names = list(summary.keys())
    if len(config_names) >= 2:
        first = summary[config_names[0]]
        second = summary[config_names[1]]
        summary["delta"] = {
            "pass_rate": f"{first['pass_rate']['mean'] - second['pass_rate']['mean']:+.2f}",
            "time_seconds": f"{first['time_seconds']['mean'] - second['time_seconds']['mean']:+.1f}",
            "tokens": f"{first['tokens']['mean'] - second['tokens']['mean']:+.0f}",
            "tool_calls": f"{first['tool_calls']['mean'] - second['tool_calls']['mean']:+.0f}",
        }

    return {"skill_name": skill_name, "run_summary": summary}


def main() -> int:
    parser = argparse.ArgumentParser(description="Aggregate benchmark artifacts")
    parser.add_argument("iteration_dir")
    parser.add_argument("--skill-name", default="")
    parser.add_argument("--output", default=None)
    args = parser.parse_args()

    result = aggregate(Path(args.iteration_dir), args.skill_name)
    text = json.dumps(result, indent=2)
    if args.output:
        Path(args.output).write_text(text)
    else:
        print(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
