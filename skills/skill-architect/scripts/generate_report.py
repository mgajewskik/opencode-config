#!/usr/bin/env -S uv run --script
"""Generate a small HTML report for description-optimization history."""

from __future__ import annotations

import argparse
import html
import json
from pathlib import Path


def generate_html(data: dict, auto_refresh: bool = False, skill_name: str = "") -> str:
    history = data.get("history", [])
    refresh = '<meta http-equiv="refresh" content="5">' if auto_refresh else ""
    title = html.escape(skill_name or data.get("skill_name", "Skill"))

    rows = []
    for item in history:
        train_score = f"{item.get('train_passed', 0)}/{item.get('train_total', 0)}"
        test_score = "-"
        if item.get("test_total") is not None:
            test_score = f"{item.get('test_passed', 0)}/{item.get('test_total', 0)}"
        rows.append(
            "<tr>"
            f"<td>{item.get('iteration', '?')}</td>"
            f"<td>{html.escape(train_score)}</td>"
            f"<td>{html.escape(test_score)}</td>"
            f"<td><code>{html.escape(item.get('description', ''))}</code></td>"
            "</tr>"
        )

    return f"""<!doctype html>
<html>
<head>
  <meta charset=\"utf-8\">{refresh}
  <title>{title} Description Report</title>
  <style>
    body {{ font-family: sans-serif; margin: 2rem; background: #f8f7f4; color: #151515; }}
    table {{ border-collapse: collapse; width: 100%; background: #fff; }}
    th, td {{ border: 1px solid #ddd; padding: 0.6rem; vertical-align: top; }}
    th {{ background: #222; color: #fff; text-align: left; }}
    code {{ white-space: pre-wrap; }}
  </style>
</head>
<body>
  <h1>{title} Description Optimization</h1>
  <p><strong>Original:</strong> {html.escape(data.get("original_description", ""))}</p>
  <p><strong>Best:</strong> {html.escape(data.get("best_description", ""))}</p>
  <p><strong>Best Score:</strong> {html.escape(str(data.get("best_score", "")))}</p>
  <table>
    <thead>
      <tr><th>Iteration</th><th>Train</th><th>Test</th><th>Description</th></tr>
    </thead>
    <tbody>
      {"".join(rows)}
    </tbody>
  </table>
</body>
</html>
"""


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate HTML report from optimization history")
    parser.add_argument("input_json")
    parser.add_argument("output_html")
    args = parser.parse_args()

    data = json.loads(Path(args.input_json).read_text())
    Path(args.output_html).write_text(generate_html(data, auto_refresh=False, skill_name=data.get("skill_name", "")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
