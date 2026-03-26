# Setup Guide

Complete setup instructions for Jira & Confluence skill.

## Prerequisites

- Jira access through either jira-cli or Atlassian MCP
- Token-based or compatible authentication that can be exposed through environment variables
- Optional Confluence access

---

## Environment Variables

On Unix-like systems, add these to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.). On other platforms, export the same variables using the equivalent shell or profile mechanism:

```bash
# Jira Configuration
export JIRA_URL="https://your-jira-instance.com"
export JIRA_USERNAME="user@example.com"
export JIRA_PERSONAL_TOKEN="your_jira_token"

# Projects you work with (comma-separated, no spaces)
export JIRA_PROJECTS="PROJECT_A,PROJECT_B"

# Confluence Configuration (if using)
export CONFLUENCE_URL="https://your-confluence-instance.com"
export CONFLUENCE_PERSONAL_TOKEN="your_confluence_token"

# CLI compatibility (maps token for jira-cli)
export JIRA_API_TOKEN="$JIRA_PERSONAL_TOKEN"
```

**Finding your projects:**
1. Go to Jira → Projects
2. Note the project KEY (uppercase, e.g., "PROJECT_A", "PROJECT_B")
3. Add all projects you work with to `JIRA_PROJECTS`

---

## Authentication Notes

The examples in this guide assume token-based authentication because it keeps the skill configuration simple and works well with a stable env-var interface.

If your Jira or Confluence deployment uses a different auth flow, keep the exported variable names the same and map them externally through your shell, wrapper, or MCP configuration.

---

## CLI Setup (jira-cli)

### Installation

```bash
# macOS
brew install ankitpokhrel/jira-cli/jira-cli

# Linux (using go)
go install github.com/ankitpokhrel/jira-cli/cmd/jira@latest

# Or download binary from releases
# https://github.com/ankitpokhrel/jira-cli/releases
```

### Configuration

Run the init command:

```bash
JIRA_API_TOKEN="$JIRA_PERSONAL_TOKEN" jira init \
  --installation local \
  --server "$JIRA_URL" \
  --login "$JIRA_USERNAME" \
  --auth-type bearer \
  --project "${JIRA_PROJECTS%%,*}" \
  --board "None" \
  --force
```

This creates `~/.config/.jira/.config.yml`

If your Jira deployment does not support bearer-token auth exactly as shown above, adapt the `jira init` command to your installation while keeping the same exported environment variables.

### Verify Setup

```bash
# Test authentication
JIRA_API_TOKEN="$JIRA_PERSONAL_TOKEN" jira me

# Should output your username

# Test listing issues
JIRA_API_TOKEN="$JIRA_PERSONAL_TOKEN" jira issue list -p PROJECT_A --plain
```

---

## MCP Setup

The MCP Atlassian server should be configured in your MCP settings. It reads environment variables automatically:

**For Jira:**
- `JIRA_URL` - Your Jira instance URL
- `JIRA_PERSONAL_TOKEN` - Your PAT

**For Confluence:**
- `CONFLUENCE_URL` - Your Confluence URL
- `CONFLUENCE_PERSONAL_TOKEN` - Your PAT

### Verify MCP Connection

Test with a simple query:
```
Use mcp-atlassian_jira_get_all_projects to list projects
```

---

## Troubleshooting

### "No result found for given query"

**Cause:** CLI is scoped to wrong project

**Fix:** Always use `-p PROJECT` flag:
```bash
jira issue list -p PROJECT_A -a$(jira me)
```

### "401 Unauthorized"

**Cause:** Token expired or invalid

**Fix:**
1. Generate new PAT in Jira
2. Update `JIRA_PERSONAL_TOKEN` in shell profile
3. Source profile: `source ~/.bashrc`

### "Connection refused" (MCP)

**Cause:** MCP server not running or misconfigured

**Fix:**
1. Check MCP server status in your editor/tool settings
2. Verify environment variables are set
3. Restart MCP server

### "JQL syntax error"

**Cause:** Invalid JQL query

**Fix:**
1. Check field names (they vary by project)
2. Quote multi-word values: `status = "In Progress"`
3. Use correct operators (see `references/jql.md`)

### CLI returns empty but MCP works

**Cause:** CLI default project doesn't match your projects

**Fix:** Re-run `jira init` with correct project, or always use `-p` flag

---

## Shell Alias (Optional)

Add to your shell profile for convenience:

```bash
# Wrapper that sets token automatically
jira() {
  JIRA_API_TOKEN="$JIRA_PERSONAL_TOKEN" command jira "$@"
}

# Quick aliases
alias jme='jira issue list -a$(jira me) --plain'
alias jip='jira issue list -a$(jira me) -s"In Progress" --plain'
```

---

## Multiple Projects Workflow

When working across projects:

**CLI approach:**
```bash
# Query each project
for proj in ${JIRA_PROJECTS//,/ }; do
  echo "=== $proj ==="
  JIRA_API_TOKEN="$JIRA_PERSONAL_TOKEN" jira issue list -a$(jira me) -p "$proj" --plain
done
```

**MCP approach:**
```
jql: "assignee = currentUser() AND project IN (PROJECT_A, PROJECT_B) ORDER BY updated DESC"
```

---

## Security Notes

- Never commit tokens to version control
- Use environment variables, not hardcoded values
- Rotate tokens periodically
- Use minimal required permissions for PAT
