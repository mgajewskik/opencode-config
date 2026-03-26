---
name: jira
description: "Jira and optional Confluence integration for issue tracking and documentation. Use when the user mentions Jira tickets or issue keys such as PROJ-123, asks about sprints, boards, or backlogs, or wants to read, search, create, update, transition, comment on, or organize Jira issues and Confluence pages."
compatibility: Requires either jira CLI (ankitpokhrel/jira-cli) or Atlassian MCP Jira/Confluence tools configured through environment variables.
metadata:
  version: "1.0"
---

# Jira & Confluence

Natural language interaction with Jira and Confluence. Supports CLI and MCP backends.

## Environment Variables

Use these environment variables as the skill's stable configuration interface. Keep these names unchanged unless you intentionally add an external compatibility layer.

**Jira:**
```bash
JIRA_URL=https://your-jira-instance.com
JIRA_USERNAME=user@example.com
JIRA_PERSONAL_TOKEN=your_jira_token

# Optional default project scope (comma-separated)
JIRA_PROJECTS=PROJECT_A,PROJECT_B
```

**Confluence:**
```bash
CONFLUENCE_URL=https://your-confluence-instance.com
CONFLUENCE_PERSONAL_TOKEN=your_confluence_token
```

**CLI compatibility:**
```bash
# jira-cli often expects JIRA_API_TOKEN; keep this mapping outside the skill logic
export JIRA_API_TOKEN="$JIRA_PERSONAL_TOKEN"
```

Notes:
- Keep these variable names unchanged if you want consistent behavior across this skill, your shell setup, and any wrappers.
- If your Jira or Confluence backend expects different variable names or auth conventions, map them externally while preserving this interface.

Load `references/setup.md` for full setup instructions.

---

## Backend Selection

### Detection Order

1. **Check CLI availability:** `which jira`
2. **Check MCP availability:** Look for `mcp-atlassian_jira_*` and `mcp-atlassian_confluence_*` tools
3. **If neither is available:** guide the user to configure one of them

### Backend Strengths

| Task | Best Backend | Why |
|------|--------------|-----|
| View single issue | CLI | Compact output, fast |
| List my issues | CLI | Human-readable tables |
| Search with JQL | MCP | Better JSON for processing |
| Create issue | CLI | Simpler syntax |
| Bulk operations | MCP | Batch support |
| Transitions | MCP | Returns transition IDs |
| Confluence (all) | MCP | CLI doesn't support Confluence |
| Sprints/boards | Either | Similar capability |

**Default:**
- Use CLI for straightforward Jira read operations when it is available.
- Use MCP for Confluence, structured searches, transitions, and bulk operations.
- If both are available, prefer the backend that minimizes ambiguity and post-processing.

---

## Project Context

**CRITICAL:** Scope queries to the user's intended projects.

1. If `JIRA_PROJECTS` is set, treat it as the default project scope.
2. For CLI: use `-p PROJECT` or `--project PROJECT` when scope matters.
3. For MCP: include `project = KEY` or `project IN (...)` in JQL when scope matters.
4. If the request could apply to multiple projects and scope is unclear, ask the user.
5. If the user clearly names a project, that overrides `JIRA_PROJECTS`.

**Example - List my issues across projects:**
```bash
# CLI approach (per project)
for proj in ${JIRA_PROJECTS//,/ }; do
  JIRA_API_TOKEN="$JIRA_PERSONAL_TOKEN" jira issue list -a$(jira me) -p "$proj" --plain
done
```

```
# MCP approach (single query)
jql: "assignee = currentUser() AND project IN (PROJECT_A, PROJECT_B) ORDER BY updated DESC"
```

---

## Quick Reference (CLI)

> Load `references/cli.md` for full CLI reference.

| Intent | Command |
|--------|---------|
| View issue | `jira issue view KEY` |
| List my issues | `jira issue list -a$(jira me) -p PROJECT` |
| My in-progress | `jira issue list -a$(jira me) -s"In Progress" -p PROJECT` |
| Create issue | `jira issue create -tType -s"Summary" -p PROJECT --no-input` |
| Transition | `jira issue move KEY "Status"` |
| Assign to me | `jira issue assign KEY $(jira me)` |
| Add comment | `jira issue comment add KEY "Comment"` |
| Current sprint | `jira sprint list --state active` |
| Who am I | `jira me` |

**Always prefix CLI commands with:** `JIRA_API_TOKEN="$JIRA_PERSONAL_TOKEN"`

---

## Quick Reference (MCP Jira)

> Load `references/mcp-jira.md` for full MCP Jira reference.

| Intent | Tool |
|--------|------|
| Search issues | `mcp-atlassian_jira_search` |
| View issue | `mcp-atlassian_jira_get_issue` |
| Create issue | `mcp-atlassian_jira_create_issue` |
| Update issue | `mcp-atlassian_jira_update_issue` |
| Get transitions | `mcp-atlassian_jira_get_transitions` |
| Transition | `mcp-atlassian_jira_transition_issue` |
| Add comment | `mcp-atlassian_jira_add_comment` |
| List projects | `mcp-atlassian_jira_get_all_projects` |
| Batch create | `mcp-atlassian_jira_batch_create_issues` |

---

## Quick Reference (MCP Confluence)

> Load `references/mcp-confluence.md` for full Confluence reference.

| Intent | Tool |
|--------|------|
| Search pages | `mcp-atlassian_confluence_search` |
| Get page | `mcp-atlassian_confluence_get_page` |
| Create page | `mcp-atlassian_confluence_create_page` |
| Update page | `mcp-atlassian_confluence_update_page` |
| Delete page | `mcp-atlassian_confluence_delete_page` |
| Add comment | `mcp-atlassian_confluence_add_comment` |
| Get children | `mcp-atlassian_confluence_get_page_children` |

---

## Triggers

**Jira:**
- "jira", "ticket", "issue", "PROJ-123" (issue key pattern)
- "sprint", "backlog", "board"
- "create ticket", "move to done", "assign to me"
- "my tasks", "what am I working on"

**Confluence:**
- "confluence", "wiki", "documentation", "page"
- "create page", "update docs", "find in confluence"

---

## Issue Key Detection

Pattern: `[A-Z]+-[0-9]+` (e.g., PROJ-123, ABC-1)

When user mentions an issue key:
- **CLI:** `jira issue view KEY`
- **MCP:** `mcp-atlassian_jira_get_issue(issue_key: "KEY")`

---

## Natural Language to JQL

> Load `references/jql.md` for full JQL syntax.

| User says | JQL |
|-----------|-----|
| "my tickets" | `assignee = currentUser()` |
| "my open tickets" | `assignee = currentUser() AND status NOT IN (Done, Closed)` |
| "high priority bugs" | `issuetype = Bug AND priority >= High` |
| "updated this week" | `updated >= startOfWeek()` |
| "created by me" | `reporter = currentUser()` |
| "in current sprint" | `sprint in openSprints()` |
| "blocked tickets" | `status = Blocked` |
| "unassigned" | `assignee IS EMPTY` |

Always add project filter when scope matters: `AND project IN (PROJECT_A, PROJECT_B)`

When `JIRA_PROJECTS` is not set, infer project scope from the request or ask the user.

---

## Before Any Write Operation

Ask yourself:

1. **What is the current state?** Fetch the issue or page first. Do not assume status, assignee, fields, title, or content.
2. **Who else is affected?** Check watchers, linked issues, parent epics, page hierarchy, and related documentation.
3. **Is this reversible?** Transitions, deletions, and content edits may not have an easy undo path.
4. **Do I have the right identifiers?** Use exact issue keys, transition IDs, page IDs, and account IDs where required.

---

## Workflow: View Issue

```
1. Detect issue key from user input
2. Use CLI: jira issue view KEY
3. Present summary, status, assignee, description
4. Offer actions: transition, comment, assign
```

---

## Workflow: Create Issue

```
1. Gather: project, type, summary, description
2. If project not specified, ask (show JIRA_PROJECTS options)
3. Draft content, show to user
4. Get explicit approval
5. Create via CLI or MCP
6. Return issue key and link
```

---

## Workflow: Transition Issue

```
1. Fetch current issue state
2. Get available transitions (MCP: `mcp-atlassian_jira_get_transitions`)
3. Show current status and available transitions
4. Get user approval for transition
5. Execute transition
6. Confirm new status
```

---

## Workflow: Confluence Page

```
1. For search: use CQL via mcp-atlassian_confluence_search
2. For read: get page by ID or title+space
3. For create/update: draft content, show preview, get approval
4. Execute and return page URL
```

---

## Safety Rules

### ALWAYS
- Show command/tool call before executing
- Get explicit approval before any modification
- Fetch current state before updating
- Scope queries to user's projects
- Preserve original content when editing
- Verify the new state after applying changes
- Surface authentication or permission problems clearly

### NEVER
- Transition without showing current status first
- Edit description without showing original
- Bulk modify without explicit approval per item
- Assume project - ask if ambiguous
- Use display names for MCP assignment (use account IDs)
- Assume transition names are universal across projects
- Use non-interactive CLI creation without confirming required fields

---

## Approval Required

**These operations require explicit user confirmation:**
- Create issue
- Update issue (any field)
- Transition/move issue
- Delete issue
- Add/edit comment
- Create/update/delete Confluence page

For destructive or high-impact changes, show the exact proposed action before executing.

**These can run without confirmation:**
- View issue
- List issues
- Search (Jira or Confluence)
- Get transitions
- Get page content

---

## Output Format

**For user display:** Human-readable tables and summaries

**Example issue list:**
```
| Key | Status | Summary | Priority |
|-----|--------|---------|----------|
| PROJ-123 | In Progress | Fix login bug | High |
| PROJ-124 | To Do | Add export feature | Medium |
```

**For internal processing:** Use MCP JSON responses

---

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| "No result found" | Wrong project scope | Check JIRA_PROJECTS, use -p flag |
| 401 Unauthorized | Token expired/invalid | Regenerate JIRA_PERSONAL_TOKEN |
| 403 Forbidden | No project access | Verify project permissions |
| 404 Not Found | Issue doesn't exist | Check issue key |
| JQL syntax error | Invalid query | Check JQL syntax in references/jql.md |

If neither CLI nor MCP is available, guide the user to configure one of them rather than guessing or simulating results.

---

## Progressive Loading

**Load references when:**
- `references/cli.md` - Creating issues, complex CLI operations, troubleshooting CLI
- `references/mcp-jira.md` - Batch operations, transitions, linking issues
- `references/mcp-confluence.md` - Any Confluence operation beyond simple search
- `references/jql.md` - Complex search queries, JQL syntax questions
- `references/setup.md` - Initial setup, authentication issues

**Do NOT load references for:**
- Simple view/list operations
- Basic status checks
- Opening issues in browser
