# Issues

Use this module for GitLab issue workflows when the core skill is not enough.

## Preferred Path

Use `scripts/gl.py` first. Fall back to `glab issue ...` only if Python support is missing or failing.

## Python-First Commands

```bash
# Read
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" issue list
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" issue list --assignee me --state opened
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" issue info 45

# Create
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" issue create "Bug title" \
  --description "Steps to reproduce" \
  --labels "bug,urgent" \
  --assignee me \
  --milestone "Sprint 5"

# Update
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" issue update 45 \
  --title "Reproducible login bug" \
  --description "Updated description" \
  --add-label in-progress \
  --remove-label backlog \
  --assignee me

# Comment / state changes
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" issue comment 45 "Working on this"
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" issue close 45
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" issue reopen 45
```

## glab Fallback

Use this when `gl.py` does not support the needed action or its environment is broken.

```bash
glab issue list
glab issue list --assignee=@me
glab issue view 45 --comments
glab issue create -t "Bug title" -d "Steps to reproduce..."
glab issue update 45 --add-label in-progress --remove-label backlog
glab issue note 45 -m "Working on this"
glab issue close 45
glab issue reopen 45
```

## Decision Tree

```text
Need issue read/create/update/comment?
├─ Supported by gl.py? → use gl.py
├─ Unsupported field or Python env problem? → use glab issue ...
└─ Need raw endpoint or bulk query? → load api-advanced.md
```

## Common Cases

### Update labels without replacing everything

Prefer:

```bash
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" issue update 45 --add-label in-progress --remove-label backlog
```

### Assign to yourself

```bash
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" issue update 45 --assignee me
```

### Self-hosted or cross-repo fallback

```bash
glab issue list -R group/project
```

Load [configuration.md](configuration.md) if auth or host selection is the problem.
