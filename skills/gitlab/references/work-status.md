# Work Status and Pending Actions

Use this module when the user asks what needs attention across GitLab.

## Start with Python

```bash
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" actionable
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" mr list --reviewer me
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" mr list --author me
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" pipeline list --mine --status failed
```

## glab Fallback for Wider Activity Views

```bash
# Pending todos
glab api todos | jq -r '.[] | "\(.action_name) - \(.target_type): \(.target.title)"'

# Recent activity
glab user events --all
glab user events --all -F json

# Unresolved MR threads
glab api projects/:id/merge_requests/123/discussions | jq '.[] | select(.notes[0].resolvable == true and .notes[0].resolved == false)'
```

## Decision Tree

```text
Need quick actionable scan?
├─ Current project review + failed pipelines → gl.py actionable / mr list / pipeline list
├─ Todos or recent cross-project activity → glab api todos / glab user events
└─ Unresolved threads or date-filtered activity → glab api ... + jq
```

## Typical Requests

- "what needs my attention on GitLab?"
- "show my pending work"
- "what MRs do I need to review?"
- "which of my MRs have unresolved discussions?"
- "what failed recently?"
