# Position Calculation for Diff Comments

When adding line comments or suggestions to MR diffs, you need the correct position data.

## Position Structure

```json
{
  "base_sha": "abc123...",   // Base commit SHA (merge base)
  "start_sha": "def456...",  // Start commit SHA (first commit in MR)
  "head_sha": "ghi789...",   // Head commit SHA (latest commit in MR)
  "position_type": "text",   // Always "text" for code comments
  "old_path": "src/file.py", // Path in base version
  "new_path": "src/file.py", // Path in head version (same unless renamed)
  "new_line": 42,            // Line number in new file (for additions/changes)
  "old_line": 40             // Line number in old file (for deletions)
}
```

## Getting SHA Values

The CLI handles this automatically via `get_mr_diff_refs()`:

```python
diffs = mr.diffs.list(get_all=False)
latest_diff = diffs[0]

position = {
    "base_sha": latest_diff.base_commit_sha,
    "start_sha": latest_diff.start_commit_sha,
    "head_sha": latest_diff.head_commit_sha,
    ...
}
```

## Line Number Rules

| Change Type | Use `new_line` | Use `old_line` | Visible in UI? |
|-------------|----------------|----------------|----------------|
| Added line (`+`) | Yes | No | ✅ Yes |
| Modified line | Yes | No | ✅ Yes |
| Deleted line (`-`) | No | Yes | ✅ Yes |
| Context line (no prefix) | Either works | Either works | ❌ Often NOT visible |

**CRITICAL**: For line comments and suggestions to be visible in GitLab UI, you **must** target added lines (lines with `+` prefix in the diff). Comments on context lines may be accepted by the API but will NOT appear in the diff view.

## Common Errors

### "Note could not be created"

- Line doesn't exist in diff
- Wrong SHA values (stale diff)
- File path doesn't match exactly

### "400 Bad Request"

- Missing required position fields
- Invalid line numbers
- position_type not "text"

## Debugging

Get the diff to verify line exists:

```bash
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" mr diff 123 --path-filter "src/file.py"
```

Parse the diff output to find valid line numbers.

## Known Limitations

### Comments Must Target Added Lines

**This is the most common issue**: Comments placed on context lines (unchanged lines shown for diff context) will appear in wrong locations or not at all, even though the API accepts them.

**Solution**: Always verify your target line is an added line (`+` in diff) before commenting. Use the script in "Verifying Commentable Lines" below.

Both draft comments (`mr draft add`) and published comments (`mr line-comment`, `mr suggestion`) work correctly when targeting added lines.

### Other Potential Issues

1. **Hunk boundaries**: Lines at the very edge of diff hunks may have positioning issues.

2. **Stale diff refs**: If MR was updated after fetching diff refs, comments may fail. Re-fetch diff info.

3. **UI refresh**: Sometimes GitLab UI needs a hard refresh to show new comments.

### Verifying Commentable Lines

To find lines that are definitely commentable (added lines within a hunk):

```bash
# Parse diff to show added lines with their new_line numbers
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" mr diff 123 | jq -r '.data.files[] | select(.new_path == "path/to/file.py") | .diff' | awk '
/^@@/ { match($0, /\+([0-9]+)/, arr); new_line = arr[1] - 1; next }
/^\+/ { new_line++; print new_line ": " $0 }
/^[^+-@]/ { new_line++ }
'
```

Only lines printed by this command (prefixed with `+`) are guaranteed to be commentable with `new_line`.
