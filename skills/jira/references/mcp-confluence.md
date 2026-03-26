# MCP Confluence Reference

Complete reference for Confluence operations via MCP Atlassian server.

## Tool Naming

All tools use prefix: `mcp-atlassian_confluence_*`

Section headings below omit the shared prefix for readability; when calling a tool, use the full `mcp-atlassian_confluence_*` name.

---

## Read Operations

### confluence_search

Search pages using CQL or simple text.

```
Parameters:
- query (required): CQL or simple text
- limit: Max results (default: 10, max: 50)
- spaces_filter: Comma-separated space keys
```

**CQL Examples:**
```cql
# Basic search
type=page AND space=DEV

# Personal space (must quote ~)
space="~username"

# Title search
title~"Meeting Notes"

# Site search (recommended for text)
siteSearch ~ "important concept"

# Text search
text ~ "important concept"

# Recent content
created >= "2023-01-01"

# With label
label=documentation

# Recently modified
lastModified > startOfMonth("-1M")

# My content
creator = currentUser()

# Content I contributed to
contributor = currentUser() AND lastModified > startOfWeek()
```

### confluence_get_page

Get page content by ID or title+space.

```
Parameters (use one approach):
- page_id: Numeric page ID (from URL)
- OR title + space_key: Page title and space key

Options:
- include_metadata: Include creation date, version, labels (default: true)
- convert_to_markdown: Convert to markdown (default: true), false = raw HTML
```

**Finding page_id from URL:**
```
URL: https://example.atlassian.net/wiki/spaces/TEAM/pages/123456789/Page+Title
page_id: 123456789
```

### confluence_get_page_children

Get child pages and folders.

```
Parameters:
- parent_id (required): Parent page ID
- expand: Fields to expand (default: "version")
- limit: Max results (default: 25, max: 50)
- include_content: Include page content (default: false)
- convert_to_markdown: Convert content to markdown (default: true)
- include_folders: Include child folders (default: true)
- start: Pagination offset (default: 0)
```

### confluence_get_comments

Get page comments.

```
Parameters:
- page_id (required): Page ID
```

### confluence_get_labels

Get page labels.

```
Parameters:
- page_id (required): Page ID
```

### confluence_search_user

Search users with CQL.

```
Parameters:
- query (required): CQL for user search
- limit: Max results (default: 10, max: 50)

Example:
query: 'user.fullname ~ "Example User"'
```

---

## Write Operations

### confluence_create_page

Create a new page.

```
Parameters:
- space_key (required): Space key (e.g., "DEV", "TEAM")
- title (required): Page title
- content (required): Page content
- parent_id: Parent page ID (for nested pages)
- content_format: "markdown" (default), "wiki", or "storage"
- enable_heading_anchors: Auto-generate heading anchors (markdown only)
```

**Content formats:**
- `markdown`: Standard markdown (recommended)
- `wiki`: Confluence wiki markup
- `storage`: Confluence storage format (XML-like)

### confluence_update_page

Update existing page.

```
Parameters:
- page_id (required): Page ID
- title (required): Page title (can be same or new)
- content (required): New content
- is_minor_edit: Mark as minor edit (default: false)
- version_comment: Comment for this version
- parent_id: Move to new parent
- content_format: "markdown" (default), "wiki", or "storage"
- enable_heading_anchors: Auto-generate heading anchors
```

### confluence_delete_page

Delete a page.

```
Parameters:
- page_id (required): Page ID
```

### confluence_add_label

Add label to page.

```
Parameters:
- page_id (required): Page ID
- name (required): Label name
```

### confluence_add_comment

Add comment to page.

```
Parameters:
- page_id (required): Page ID
- body (required): Comment in Markdown
```

---

## CQL Reference

### Syntax

```
field operator value [AND|OR field operator value]
```

### Common Fields

| Field | Description | Example |
|-------|-------------|---------|
| `type` | Content type | `type=page`, `type=blogpost` |
| `space` | Space key | `space=DEV` |
| `title` | Page title | `title~"Meeting"` |
| `text` | Page content | `text~"authentication"` |
| `siteSearch` | WebUI-style search | `siteSearch~"concept"` |
| `creator` | Page creator | `creator=currentUser()` |
| `contributor` | Anyone who edited | `contributor="user@example.com"` |
| `created` | Creation date | `created >= "2024-01-01"` |
| `lastModified` | Last update | `lastModified > startOfWeek()` |
| `label` | Page labels | `label=documentation` |
| `ancestor` | Parent hierarchy | `ancestor=123456` |
| `parent` | Direct parent | `parent=123456` |

### Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `=` | Exact match | `space=DEV` |
| `!=` | Not equal | `type!=blogpost` |
| `~` | Contains | `title~"Notes"` |
| `!~` | Does not contain | `title!~"Draft"` |
| `>` `>=` `<` `<=` | Comparisons | `created >= "2024-01-01"` |
| `IN` | Multiple values | `space IN (DEV, TEAM)` |
| `NOT IN` | Exclude values | `label NOT IN (draft, wip)` |

### Functions

| Function | Description |
|----------|-------------|
| `currentUser()` | Logged-in user |
| `startOfDay()` | Midnight today |
| `startOfWeek()` | Start of week |
| `startOfMonth()` | Start of month |
| `startOfYear()` | Start of year |
| `startOfMonth("-1M")` | Start of last month |

### Complex Examples

```cql
# My recent pages
creator = currentUser() AND lastModified > startOfWeek()

# Documentation in multiple spaces
label=documentation AND space IN (DEV, TEAM, DOCS)

# Pages I contributed to this year
contributor = currentUser() AND lastModified > startOfYear()

# Search with exact phrase
text ~ "\"Urgent Review Required\""

# Title wildcards
title ~ "Minutes*" AND space = "HR"

# Exclude drafts
type=page AND label != draft AND space=DEV
```

---

## Return Formats

**Search results:**
```json
{
  "results": [
    {
      "id": "123456789",
      "type": "page",
      "title": "Page Title",
      "space": {"key": "DEV", "name": "Development"},
      "url": "https://..."
    }
  ],
  "start": 0,
  "limit": 10,
  "size": 5
}
```

**Page content:**
```json
{
  "id": "123456789",
  "type": "page",
  "title": "Page Title",
  "body": "Markdown or HTML content...",
  "version": {"number": 5},
  "space": {"key": "DEV"},
  "created": "2024-01-15T10:30:00Z",
  "lastModified": "2024-02-01T14:22:00Z"
}
```

---

## Common Workflows

### Find and Read Page

```
1. Search: mcp-atlassian_confluence_search(query="title~'Meeting Notes' AND space=TEAM")
2. Get page_id from results
3. Read: mcp-atlassian_confluence_get_page(page_id="123456789")
```

### Create Nested Page

```
1. Find parent: mcp-atlassian_confluence_search(query="title='Parent Page' AND space=DEV")
2. Get parent_id from results
3. Create: mcp-atlassian_confluence_create_page(
      space_key="DEV",
      title="Child Page",
      content="...",
     parent_id="parent_id_here"
   )
```

### Update Page Safely

```
1. Read current: mcp-atlassian_confluence_get_page(page_id="123456789")
2. Show user current content
3. Get approval for changes
4. Update: mcp-atlassian_confluence_update_page(
      page_id="123456789",
      title="Same or New Title",
      content="Updated content...",
     version_comment="Updated section X"
   )
```

---

## Notes

- **Personal spaces:** Keys starting with `~` must be quoted in CQL: `space="~username"`
- **Markdown preferred:** Use `content_format="markdown"` for easier content creation
- **Token usage:** `convert_to_markdown=false` returns HTML which uses more tokens
- **No undo:** Page edits have no undo - always show original before updating
