# CI/CD and Pipelines

Use this module for pipeline status, job logs, retries, manual jobs, pipeline creation, and advanced CI flows.

## Preferred Split

- **Use `gl.py` first** for structured pipeline/job reads and simple retry/cancel/play actions.
- **Use glab** for TUI workflows, pipeline creation, linting, trigger tokens, variables, and advanced CI commands.

## Python-First Commands

```bash
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" pipeline list
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" pipeline list --mine --status failed
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" pipeline status 12345
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" pipeline retry 12345
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" pipeline cancel 12345

uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" job log 67890
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" job log 67890 --tail 100
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" job retry 67890
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" job cancel 67890
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" job play 67890
```

## glab Fallback and Advanced Flows

```bash
# Quick status / live watch
glab ci status
glab ci status --live

# Interactive TUI
glab ci view
glab ci view -p 12345

# Trace logs
glab ci trace lint

# Run or lint pipelines
glab ci run -b main
glab ci run --mr
glab ci lint --dry-run --include-jobs

# Trigger-token pipelines
glab ci run-trig -t $TRIGGER_TOKEN -b main
```

## When to Prefer glab Immediately

- `glab ci view` interactive browsing
- `glab ci run`, `run-trig`, or typed `--input`
- CI config linting
- advanced variable handling

## Key Warning

`glab ci run --mr` is incompatible with `--variables` and `--input`.

## Extra Modules

- Load [api-advanced.md](api-advanced.md) for raw jobs/pipeline endpoints.
- Load [admin-and-integrations.md](admin-and-integrations.md) for `glab variable ...`.
