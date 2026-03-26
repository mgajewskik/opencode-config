# MCP Jira Reference

Complete reference for Jira operations via MCP Atlassian server.

## Tool Naming

All tools use prefix: `mcp-atlassian_jira_*`

Section headings below omit the shared prefix for readability; when calling a tool, use the full `mcp-atlassian_jira_*` name.

---

## Read Operations

### jira_get_issue

Get issue details including Epic links.

```
Parameters:
- issue_key (required): "PROJ-123"
- fields: Comma-separated fields (default: essential fields)
- expand: "renderedFields", "transitions", "changelog"
- comment_limit: Max comments (default: 10, max: 100)
```

### jira_search

Search using JQL.

```
Parameters:
- jql (required): JQL query string
- fields: Fields to return (default: essential, use "*all" for all)
- limit: Max results (default: 10, max: 50)
- start_at: Pagination offset (0-based)
- projects_filter: Comma-separated project keys
- expand: "renderedFields", "transitions", "changelog"
```

### jira_get_all_projects

List accessible projects.

```
Parameters:
- include_archived: boolean (default: false)
```

### jira_get_project_issues

Get all issues in a project.

```
Parameters:
- project_key (required): "PROJ"
- limit: Max results (default: 10, max: 50)
- start_at: Pagination offset
```

### jira_get_transitions

Get available status transitions.

```
Parameters:
- issue_key (required): "PROJ-123"

Returns: List of {id, name} for available transitions
```

### jira_search_fields

Search Jira fields by keyword.

```
Parameters:
- keyword: Search term (empty = list all)
- limit: Max results (default: 10)
- refresh: Force refresh field list
```

For select, multi-select, radio, checkbox, or cascading custom fields, follow this with `mcp-atlassian_jira_get_field_options` before creating or updating an issue.

### jira_get_user_profile

Get user profile info.

```
Parameters:
- user_identifier (required): Email, username, or account ID
```

---

## Agile Operations

### jira_get_agile_boards

Get boards by name, project, or type.

```
Parameters:
- board_name: Fuzzy search
- project_key: Filter by project
- board_type: "scrum" or "kanban"
- limit: Max results (default: 10, max: 50)
```

### jira_get_sprints_from_board

Get sprints from a board.

```
Parameters:
- board_id (required): Board ID
- state: "active", "future", "closed" (null = all)
- limit: Max results (default: 10, max: 50)
```

### jira_get_sprint_issues

Get issues in a sprint.

```
Parameters:
- sprint_id (required): Sprint ID
- fields: Fields to return
- limit: Max results (default: 10, max: 50)
```

### jira_get_board_issues

Get board issues filtered by JQL.

```
Parameters:
- board_id (required): Board ID
- jql (required): JQL filter
- fields: Fields to return
- limit: Max results
```

---

## Write Operations

### jira_create_issue

Create a new issue.

```
Parameters:
- project_key (required): "PROJ"
- summary (required): Issue title
- issue_type (required): "Task", "Bug", "Story", "Epic", "Subtask"
- assignee: User identifier (email, name, or account ID)
- description: Issue description
- components: Comma-separated component names
- additional_fields: JSON string for custom fields
  - '{"priority": {"name": "High"}}'
  - '{"labels": ["frontend", "urgent"]}'
  - '{"parent": "PROJ-123"}'
  - '{"fixVersions": [{"id": "10020"}]}'
```

### jira_update_issue

Update an existing issue.

```
Parameters:
- issue_key (required): "PROJ-123"
- fields (required): JSON string of fields to update
  - '{"summary": "New title"}'
  - '{"description": "New description"}'
  - '{"assignee": "user@example.com"}'
- additional_fields: JSON string for custom fields
- attachments: JSON string array or comma-separated file paths
```

### jira_delete_issue

Delete an issue.

```
Parameters:
- issue_key (required): "PROJ-123"
```

### jira_transition_issue

Change issue status.

```
Parameters:
- issue_key (required): "PROJ-123"
- transition_id (required): ID from `mcp-atlassian_jira_get_transitions`
- fields: Optional JSON string of fields to update during transition
  - '{"resolution": {"name": "Fixed"}}'
- comment: Transition comment
```

**Workflow:**
1. Call `mcp-atlassian_jira_get_transitions` to get available transition IDs
2. Find desired transition ID
3. Call `mcp-atlassian_jira_transition_issue` with that ID

### jira_add_comment

Add comment to issue.

```
Parameters:
- issue_key (required): "PROJ-123"
- body (required): Markdown text
- visibility: {"type": "group", "value": "jira-users"}
```

### jira_edit_comment

Edit existing comment.

```
Parameters:
- issue_key (required): "PROJ-123"
- comment_id (required): Comment ID
- body (required): Updated Markdown text
```

---

## Batch Operations

### jira_batch_create_issues

Create multiple issues at once.

```
Parameters:
- issues (required): JSON array string
  [
    {"project_key": "PROJ", "summary": "Issue 1", "issue_type": "Task"},
    {"project_key": "PROJ", "summary": "Issue 2", "issue_type": "Bug"}
  ]
- validate_only: boolean (default: false)
```

### jira_batch_get_changelogs

Get changelogs for multiple issues (Cloud only).

```
Parameters:
- issue_ids_or_keys (required): "PROJ-123,PROJ-124"
- fields: Comma-separated fields such as "status,assignee"
- limit: Max changelogs per issue (-1 = all)
```

---

## Linking Operations

### jira_link_to_epic

Link issue to an Epic.

```
Parameters:
- issue_key (required): "PROJ-123"
- epic_key (required): "PROJ-100"
```

### jira_create_issue_link

Create link between two issues.

```
Parameters:
- link_type (required): "Blocks", "Relates to", "Duplicate"
- inward_issue_key (required): "PROJ-123"
- outward_issue_key (required): "PROJ-456"
- comment: Optional comment
```

### jira_remove_issue_link

Remove issue link.

```
Parameters:
- link_id (required): Link ID
```

### jira_get_link_types

Get available link types.

```
Parameters: none
Returns: List of link type objects
```

---

## Sprint Management

### jira_create_sprint

Create a new sprint.

```
Parameters:
- board_id (required): Board ID
- name (required): "Sprint 1"
- start_date (required): ISO 8601 format
- end_date (required): ISO 8601 format
- goal: Sprint goal
```

### jira_update_sprint

Update sprint details.

```
Parameters:
- sprint_id (required): Sprint ID
- name: New sprint name
- state: "future", "active", "closed"
- start_date: New start date
- end_date: New end date
- goal: New goal
```

---

## Version Management

### jira_get_project_versions

Get fix versions for a project.

```
Parameters:
- project_key (required): "PROJ"
```

### jira_create_version

Create a fix version.

```
Parameters:
- project_key (required): "PROJ"
- name (required): "v1.0"
- start_date: "YYYY-MM-DD"
- release_date: "YYYY-MM-DD"
- description: Version description
```

---

## Other Operations

### jira_get_worklog

Get worklog entries.

```
Parameters:
- issue_key (required): "PROJ-123"
```

### jira_add_worklog

Log time on issue.

```
Parameters:
- issue_key (required): "PROJ-123"
- time_spent (required): "1h 30m", "1d", "30m"
- comment: Worklog comment
- started: ISO format start time
```

### jira_download_attachments

Download issue attachments.

```
Parameters:
- issue_key (required): "PROJ-123"

Returns the attachments as embedded resources over MCP; there is no local target directory parameter.
```

### jira_create_remote_issue_link

Create web link on issue.

```
Parameters:
- issue_key (required): "PROJ-123"
- url (required): "https://example.com"
- title (required): "Link title"
- summary: Description
- relationship: "documentation", "causes"
```

---

## Return Formats

All tools return JSON. Common structure:

**Single issue:**
```json
{
  "id": "12345",
  "key": "PROJ-123",
  "summary": "Issue title",
  "status": {"name": "In Progress", "category": "In Progress"},
  "priority": {"name": "High"},
  "assignee": {"displayName": "Example User", "emailAddress": "user@example.com"}
}
```

**Search results:**
```json
{
  "total": 42,
  "start_at": 0,
  "max_results": 10,
  "issues": [...]
}
```

---

## Pagination

Most read operations support:
- `limit`: Max results per page (default: 10, max: 50)
- `start_at`: Offset (0-based)

**Example pagination:**
```
Page 1: limit=50, start_at=0
Page 2: limit=50, start_at=50
Page 3: limit=50, start_at=100
```
