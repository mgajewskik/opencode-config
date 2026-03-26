# JQL Reference

Jira Query Language syntax for searching issues.

## Basic Syntax

```
field operator value [AND|OR field operator value] [ORDER BY field]
```

---

## Common Fields

| Field | Description | Example |
|-------|-------------|---------|
| `project` | Project key | `project = "PROJ"` |
| `issuetype` | Issue type | `issuetype = Bug` |
| `status` | Issue status | `status = "In Progress"` |
| `assignee` | Assigned user | `assignee = currentUser()` |
| `reporter` | Issue creator | `reporter = "user@example.com"` |
| `priority` | Priority level | `priority = High` |
| `labels` | Issue labels | `labels = "backend"` |
| `component` | Components | `component = "API"` |
| `created` | Creation date | `created >= -30d` |
| `updated` | Last update | `updated >= -7d` |
| `resolved` | Resolution date | `resolved >= startOfMonth()` |
| `sprint` | Sprint name/ID | `sprint in openSprints()` |
| `parent` | Parent issue | `parent = PROJ-50` |
| `text` | Full-text search | `text ~ "authentication"` |
| `summary` | Title search | `summary ~ "login"` |
| `description` | Description search | `description ~ "OAuth"` |
| `fixVersion` | Fix version | `fixVersion = "1.0"` |
| `affectedVersion` | Affected version | `affectedVersion = "0.9"` |

---

## Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `=` | Exact match | `status = Done` |
| `!=` | Not equal | `status != Closed` |
| `~` | Contains (text) | `summary ~ "auth*"` |
| `!~` | Does not contain | `summary !~ "test"` |
| `>` `>=` `<` `<=` | Comparisons | `priority >= High` |
| `IN` | Multiple values | `status IN (Open, "In Progress")` |
| `NOT IN` | Exclude values | `status NOT IN (Done, Closed)` |
| `IS` | Null check | `assignee IS EMPTY` |
| `IS NOT` | Not null | `assignee IS NOT EMPTY` |
| `WAS` | Historical value | `status WAS "In Progress"` |
| `CHANGED` | Field changed | `status CHANGED` |

---

## Functions

| Function | Description | Example |
|----------|-------------|---------|
| `currentUser()` | Logged-in user | `assignee = currentUser()` |
| `now()` | Current timestamp | `created <= now()` |
| `startOfDay()` | Midnight today | `updated >= startOfDay()` |
| `startOfWeek()` | Start of week | `created >= startOfWeek()` |
| `startOfMonth()` | Start of month | `created >= startOfMonth()` |
| `startOfYear()` | Start of year | `created >= startOfYear()` |
| `endOfDay()` | End of today | `due <= endOfDay()` |
| `endOfWeek()` | End of week | `due <= endOfWeek()` |
| `endOfMonth()` | End of month | `due <= endOfMonth()` |
| `openSprints()` | Active sprints | `sprint in openSprints()` |
| `closedSprints()` | Completed sprints | `sprint in closedSprints()` |
| `futureSprints()` | Planned sprints | `sprint in futureSprints()` |
| `linkedIssues()` | Linked issues | `issue in linkedIssues("PROJ-123")` |

---

## Relative Dates

```jql
# Days
created >= -7d      # Last 7 days
updated >= -30d     # Last 30 days

# Weeks
created >= -2w      # Last 2 weeks

# Months
created >= -1M      # Last month
created >= -3M      # Last 3 months

# Hours/Minutes
updated >= -4h      # Last 4 hours
updated >= -30m     # Last 30 minutes

# Specific date
created >= "2024-01-01"
created >= "2024-01-01 09:00"
```

---

## Ordering

```jql
# Single field
ORDER BY priority DESC

# Multiple fields
ORDER BY status ASC, created DESC

# Common orderings
ORDER BY updated DESC           # Most recently updated
ORDER BY created DESC           # Newest first
ORDER BY priority DESC          # Highest priority first
ORDER BY rank ASC               # Sprint/backlog order
```

---

## Common Queries

### My Issues

```jql
# All my issues
assignee = currentUser()

# My open issues
assignee = currentUser() AND status NOT IN (Done, Closed)

# My in-progress
assignee = currentUser() AND status = "In Progress"

# Issues I reported
reporter = currentUser()

# Issues I'm watching
watcher = currentUser()
```

### By Status

```jql
# Open issues
status NOT IN (Done, Closed, Resolved)

# Blocked
status = Blocked

# Ready for review
status = "In Review"

# Recently resolved
resolved >= -7d
```

### By Type

```jql
# Bugs only
issuetype = Bug

# Stories and tasks
issuetype IN (Story, Task)

# Epics
issuetype = Epic

# Subtasks
issuetype = Sub-task
```

### By Priority

```jql
# High priority
priority >= High

# Critical only
priority = Critical

# Low priority backlog
priority IN (Low, Lowest) AND status = "To Do"
```

### By Time

```jql
# Created today
created >= startOfDay()

# Updated this week
updated >= startOfWeek()

# Created this month
created >= startOfMonth()

# Stale issues (no update in 30 days)
updated <= -30d AND status NOT IN (Done, Closed)

# Due soon
due <= endOfWeek() AND due >= startOfDay()

# Overdue
due < startOfDay() AND status NOT IN (Done, Closed)
```

### Sprint Queries

```jql
# Current sprint
sprint in openSprints()

# Current sprint, my issues
sprint in openSprints() AND assignee = currentUser()

# Sprint backlog
sprint in openSprints() AND status = "To Do"

# Completed in sprint
sprint in openSprints() AND status = Done

# Not in any sprint
sprint IS EMPTY AND status NOT IN (Done, Closed)
```

### Text Search

```jql
# Search in summary
summary ~ "login"

# Search in description
description ~ "OAuth"

# Search everywhere
text ~ "authentication"

# Wildcard search
summary ~ "auth*"

# Exact phrase
summary ~ "\"login button\""
```

### Linked Issues

```jql
# Issues linked to specific issue
issue in linkedIssues("PROJ-123")

# Issues blocking something
issueLinkType = "blocks"
```

---

## Complex Examples

```jql
# My high-priority open bugs
assignee = currentUser() 
  AND issuetype = Bug 
  AND priority >= High 
  AND status NOT IN (Done, Closed)
ORDER BY priority DESC

# Unassigned bugs in current sprint
sprint in openSprints() 
  AND issuetype = Bug 
  AND assignee IS EMPTY
ORDER BY priority DESC

# Recently updated by anyone on team
project = PROJ 
  AND updated >= -7d 
  AND status = "In Progress"
ORDER BY updated DESC

# Child issues for a parent ticket
parent = PROJ-100

# Issues that changed status this week
status CHANGED AFTER startOfWeek()

# Issues assigned to me that were previously unassigned
assignee = currentUser() 
  AND assignee CHANGED FROM EMPTY

# High priority issues created but not started
priority >= High 
  AND created >= -7d 
  AND status = "To Do"
```

---

## Project Scoping

**Always include project filter for multi-project setups:**

```jql
# Single project
project = PROJ AND assignee = currentUser()

# Multiple projects
project IN (PROJECT_A, PROJECT_B) AND assignee = currentUser()

# Exclude project
project != INTERNAL AND assignee = currentUser()
```

---

## Tips

1. **Quote multi-word values:** `status = "In Progress"` not `status = In Progress`
2. **Use functions for dates:** `startOfWeek()` is clearer than calculating dates
3. **Order matters:** Put most restrictive filters first for performance
4. **Test incrementally:** Build complex queries step by step
5. **Check field names:** Custom fields may have different names per project
