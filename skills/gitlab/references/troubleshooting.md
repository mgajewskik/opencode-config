# Troubleshooting

## Authentication

### "GITLAB_TOKEN environment variable not set"

```bash
export GITLAB_TOKEN="glpat-xxxxxxxxxxxx"
```

### "Authentication failed"

- Token expired or revoked
- Wrong token type (need personal access token with `api` scope)
- Token doesn't have required permissions

### "Failed to connect to GitLab"

- Wrong GITLAB_HOST URL
- Network/firewall issues
- Self-signed certificate (may need to configure SSL)

## Project Detection

### "Could not detect project from git remote"

- Not in a git repository
- No `origin` remote configured
- Remote URL format not recognized

Fix: Use `--project group/repo` explicitly.

### "Project not found"

- Typo in project path
- No access to project
- Project is private and token lacks access

## MR Operations

### "MR !123 not found"

- Wrong MR IID (internal ID, not global ID)
- MR is in different project
- No access to MR

### Line comment fails

- Line doesn't exist in current diff version
- Diff was updated (force push) - refresh SHA values
- See [position-calculation.md](position-calculation.md)

## Draft Notes

### "Draft notes not supported"

- GitLab version too old (need 13.2+)
- Feature not enabled on instance

### "bulk_publish() failed"

- No drafts to publish
- One of the drafts has invalid position

## Pipelines

### "Pipeline not found"

- Using job ID instead of pipeline ID
- Pipeline was deleted

### "Cannot retry pipeline"

- Pipeline is still running
- No failed jobs to retry

## Common Fixes

1. **Refresh auth**: `unset GITLAB_TOKEN && export GITLAB_TOKEN="new-token"`
2. **Force project**: `uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" --project group/repo ...`
3. **Check permissions**: Ensure token has `api` scope
4. **Update diff refs**: Re-fetch MR diff before adding comments
