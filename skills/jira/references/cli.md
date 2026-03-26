# CLI Reference

Complete reference for `jira` CLI (ankitpokhrel/jira-cli).

## Authentication

**Environment variables:**
```bash
export JIRA_API_TOKEN="$JIRA_PERSONAL_TOKEN"  # Required
export JIRA_AUTH_TYPE=bearer                   # For PAT auth
```

**All commands must be prefixed:**
```bash
JIRA_API_TOKEN="$JIRA_PERSONAL_TOKEN" jira <command>
```

---

## Viewing Issues

```bash
# View single issue
jira issue view ISSUE-KEY

# View with more comments
jira issue view ISSUE-KEY --comments 5

# Get raw JSON
jira issue view ISSUE-KEY --raw

# Open in browser
jira open ISSUE-KEY
```

---

## Listing Issues

```bash
# List in specific project (REQUIRED for cross-project setups)
jira issue list -p PROJECT

# List my issues
jira issue list -a$(jira me) -p PROJECT

# Filter by status
jira issue list -s"In Progress" -p PROJECT
jira issue list -s"To Do" -p PROJECT
jira issue list -sDone -p PROJECT

# Filter by type
jira issue list -tBug -p PROJECT
jira issue list -tStory -p PROJECT
jira issue list -tTask -p PROJECT
jira issue list -tEpic -p PROJECT

# Filter by priority
jira issue list -yHigh -p PROJECT
jira issue list -yCritical -p PROJECT

# Filter by label
jira issue list -lurgent -lbug -p PROJECT

# Combine filters
jira issue list -a$(jira me) -s"In Progress" -yHigh -p PROJECT

# Search with text
jira issue list "login error" -p PROJECT

# Recently accessed
jira issue list --history

# Issues I'm watching
jira issue list -w -p PROJECT

# Created/updated filters
jira issue list --created today -p PROJECT
jira issue list --created week -p PROJECT
jira issue list --updated -2d -p PROJECT

# Plain output for scripting
jira issue list --plain --no-headers -p PROJECT

# Specific columns
jira issue list --plain --columns key,summary,status,assignee -p PROJECT

# Raw JQL query (within project)
jira issue list -q"status = 'In Progress' AND assignee = currentUser()" -p PROJECT

# Paginate results
jira issue list --paginate 20 -p PROJECT
```

---

## Creating Issues

```bash
# Non-interactive with all fields
jira issue create \
    -p PROJECT \
    -tBug \
    -s"Login button not working" \
    -b"Users cannot click the login button on Safari" \
    -yHigh \
    -lbug -lurgent \
    --no-input

# Create and assign to self
jira issue create -p PROJECT -tTask -s"Summary" -a$(jira me) --no-input

# Create subtask (requires parent)
jira issue create -p PROJECT -tSub-task -P"PROJ-123" -s"Subtask summary" --no-input

# Create with custom fields
jira issue create -p PROJECT -tStory -s"Summary" --custom story-points=3 --no-input

# Open in browser after creation
jira issue create -p PROJECT -tBug -s"Bug title" --web --no-input
```

### Multi-line Descriptions

The CLI struggles with multi-line strings. Write to `/tmp` first:

```bash
cat > /tmp/jira_body.md <<'EOF'
## Description
User needs ability to export data...

## Acceptance Criteria
- Export works for CSV
- Export works for JSON
EOF

JIRA_API_TOKEN="$JIRA_PERSONAL_TOKEN" jira issue create --no-input \
  -p PROJECT \
  -tStory \
  -s"Add export functionality" \
  -b"$(cat /tmp/jira_body.md)"
```

---

## Transitioning Issues

```bash
# Move to a state
jira issue move ISSUE-KEY "In Progress"
jira issue move ISSUE-KEY "Done"
jira issue move ISSUE-KEY "To Do"

# Move with comment
jira issue move ISSUE-KEY "Done" --comment "Completed the implementation"

# Move and set resolution
jira issue move ISSUE-KEY "Done" -R"Fixed"

# Move and reassign
jira issue move ISSUE-KEY "In Review" -a"user@example.com"
```

---

## Assigning Issues

```bash
# Assign to specific user
jira issue assign ISSUE-KEY "user@example.com"
jira issue assign ISSUE-KEY "Example User"

# Assign to self
jira issue assign ISSUE-KEY $(jira me)

# Unassign
jira issue assign ISSUE-KEY x
```

---

## Comments

```bash
# Add comment
jira issue comment add ISSUE-KEY "This is my comment"

# Add comment from file
jira issue comment add ISSUE-KEY --template /path/to/comment.md

# Pipe comment
echo "Comment text" | jira issue comment add ISSUE-KEY
```

---

## Sprints

```bash
# List sprints
jira sprint list

# Active sprint only
jira sprint list --state active

# Future sprints
jira sprint list --state future

# Issues in sprint
jira sprint list SPRINT_ID

# Add issue to sprint
jira sprint add SPRINT_ID ISSUE-KEY
```

---

## Linking Issues

```bash
# Basic link
jira issue link PROJ-123 PROJ-456 "Relates"

# Blocker (first blocks second)
jira issue link PROJ-100 PROJ-200 "Blocks"

# Link to epic
jira issue link PROJ-EPIC PROJ-STORY "Epic-Story"
```

| Relationship | Meaning |
|--------------|---------|
| `Blocks` | First ticket blocks second |
| `Relates` | General relationship |
| `Duplicate` | Same work |
| `Epic-Story` | Story belongs to Epic |

---

## Epics

```bash
# List epics
jira epic list -p PROJECT

# Add issues to epic
jira epic add EPIC-KEY ISSUE-1 ISSUE-2

# Remove from epic
jira epic remove ISSUE-KEY
```

---

## Other Commands

```bash
# Current user
jira me

# List projects
jira project list

# List boards
jira board list

# Server info
jira serverinfo
```

---

## Output Formats

| Flag | Output |
|------|--------|
| (default) | Interactive TUI |
| `--plain` | Simple table |
| `--raw` | JSON |
| `--csv` | CSV |
| `--no-headers` | Suppress headers |
| `--columns` | Specific columns |

**For scripting:**
```bash
jira issue list --plain --no-headers --columns key,status,summary -p PROJECT
```

---

## Limitations

- **No attachments:** Cannot upload/download attachments
- **No issue type change:** Cannot change type after creation
- **100 result cap:** Issue list limited to 100 results
- **No version management:** Can list but not create fix versions
- **JSON inconsistent:** `--raw` not available for all commands
- **Project scoped:** Default project from config, must override with `-p`
