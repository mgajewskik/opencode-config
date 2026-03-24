# Merge Request Review and Management

Use this module for full MR review workflows, especially when comments, suggestions, drafts, or fallback behavior matter.

## Preferred Path

Use `scripts/gl.py` first for MR read/review/create/update flows.

## Python-First Commands

```bash
# Read
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" mr list --reviewer me
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" mr info 123
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" mr diff 123
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" mr discussions 123 --unresolved-only
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" mr commits 123

# Review comments
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" mr comment 123 "Overall looks good"
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" mr line-comment 123 "Rename this" --file src/main.py --line 42
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" mr suggestion 123 "better_name()" --file src/main.py --line 42 --comment "Shorter"
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" mr reply 123 <discussion_id> "Agreed"
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" mr delete-comment 123 <note_id>

# Draft review workflow
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" mr draft add 123 "Overall: needs tests"
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" mr draft add 123 "Add guard clause" --file src/main.py --line 42
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" mr draft list 123
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" mr draft publish 123

# MR management
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" mr create "Feature title"
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" mr update 123 --description-file /tmp/mr.md
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" mr assign 123 -r reviewer1 -a assignee1
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" mr approve 123
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" mr unapprove 123
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" mr resolve 123 <discussion_id>
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" mr merge 123 --squash
```

## glab Fallback

```bash
glab mr list --reviewer=@me
glab mr view 123 --comments
glab mr diff 123
glab mr note 123 -m "General feedback"
glab mr approve 123
glab mr revoke 123
glab mr create -f --draft
glab mr update 123 --title "new title"
```

Use raw `glab api` when you need endpoints not exposed through `gl.py` or built-in `glab mr` commands.

## Line Comment Rule

Line comments and suggestions must target changed lines in the MR diff.

If comment placement fails:
- load [position-calculation.md](position-calculation.md)
- load [troubleshooting.md](troubleshooting.md)

## Decision Tree

```text
Need to review MR?
├─ Overview / diff / discussions / commits → gl.py
├─ Add general, line, or suggestion comment → gl.py
├─ Batch review with drafts → gl.py draft workflow
├─ Position error or unsupported endpoint → glab/api fallback
└─ Final merge or destructive action unclear → confirm first
```

## Fallback Examples

### General comment

```bash
glab mr note 123 -m "Overall looks good"
```

### Raw API for discussions

```bash
glab api projects/:id/merge_requests/123/discussions --paginate
```

### Raw API for approvals

```bash
glab api projects/:id/merge_requests/123/approvals
```
