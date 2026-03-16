# Schemas

These schemas keep iterative skill work reproducible.

## evals.json

Location: `evals/evals.json`

Use this file for task or output evals. This is not the same as trigger evals.

```json
{
  "skill_name": "example-skill",
  "evals": [
    {
      "id": 1,
      "prompt": "Create a skill for...",
      "expected_output": "What success looks like",
      "files": ["evals/files/input.txt"],
      "expectations": [
        "The output contains a valid SKILL.md frontmatter block",
        "The skill description names both what it does and when to use it"
      ]
    }
  ]
}
```

## trigger-evals.json

Location: `evals/trigger-evals.json`

Use this file for description optimization and trigger-boundary tests.

```json
[
  {
    "query": "I need help designing a reusable skill for triaging support tickets.",
    "should_trigger": true
  },
  {
    "query": "Write a bash one-liner to list files.",
    "should_trigger": false
  }
]
```

Each item must include `query` and boolean `should_trigger`.

## eval_metadata.json

Location: per eval directory inside an iteration workspace.

```json
{
  "eval_id": 0,
  "eval_name": "description-optimizes-trigger-boundary",
  "prompt": "User prompt under test",
  "assertions": [
    "The output includes a description under 1024 characters"
  ]
}
```

## grading.json

Location: per run directory.

```json
{
  "expectations": [
    {
      "text": "The output includes the name 'skill-architect'",
      "passed": true,
      "evidence": "Found in SKILL.md frontmatter and heading"
    }
  ],
  "summary": {
    "passed": 1,
    "failed": 0,
    "total": 1,
    "pass_rate": 1.0
  },
  "execution_metrics": {
    "total_tool_calls": 12,
    "errors_encountered": 0
  },
  "timing": {
    "total_duration_seconds": 24.5,
    "total_tokens": 8421
  }
}
```

The expectation items should use the exact field names `text`, `passed`, and `evidence`.

## benchmark.json

Location: iteration root.

```json
{
  "skill_name": "example-skill",
  "run_summary": {
    "with_skill": {
      "pass_rate": {"mean": 0.9, "stddev": 0.05, "min": 0.8, "max": 1.0},
      "time_seconds": {"mean": 18.4, "stddev": 1.1, "min": 17.0, "max": 19.7},
      "tokens": {"mean": 8200, "stddev": 300, "min": 7800, "max": 8600},
      "tool_calls": {"mean": 24, "stddev": 2, "min": 22, "max": 27}
    },
    "without_skill": {
      "pass_rate": {"mean": 0.6, "stddev": 0.1, "min": 0.5, "max": 0.7},
      "time_seconds": {"mean": 25.0, "stddev": 2.0, "min": 22.0, "max": 27.0},
      "tokens": {"mean": 12000, "stddev": 700, "min": 11200, "max": 12800},
      "tool_calls": {"mean": 31, "stddev": 3, "min": 28, "max": 35}
    },
    "delta": {
      "pass_rate": "+0.30",
      "time_seconds": "-6.6",
      "tokens": "-3800",
      "tool_calls": "-7"
    }
  }
}
```

## history.json

Use when running iterative improvement loops.

```json
{
  "started_at": "2026-03-16T12:00:00Z",
  "skill_name": "example-skill",
  "current_best": "v2",
  "iterations": [
    {
      "version": "v0",
      "parent": null,
      "expectation_pass_rate": 0.65,
      "grading_result": "baseline",
      "is_current_best": false
    }
  ]
}
```

## feedback.json

Use for human review capture.

```json
{
  "reviews": [
    {
      "run_id": "eval-0-with_skill",
      "feedback": "The skill is still too broad and overtriggers.",
      "timestamp": "2026-03-16T12:34:56Z"
    }
  ],
  "status": "complete"
}
```
