# API Access & Advanced Features

## glab api — Raw API Calls

Make authenticated HTTP requests to GitLab API. Default method: GET (no params) or POST (with params).

```bash
# REST API
glab api projects/:fullpath/releases
glab api projects/:id/merge_requests?state=opened

# URL-encoded paths
glab api projects/gitlab-com%2Fwww-gitlab-com/issues

# With pagination
glab api issues --paginate
glab api issues --paginate --output ndjson

# Pipe to jq
glab api issues --paginate --output ndjson | jq 'select(.state == "opened")'
```

### Placeholder Values
Auto-replaced from current git repo context:
`:branch`, `:fullpath`, `:group`, `:id`, `:namespace`, `:repo`, `:user`, `:username`

### Passing Parameters
```bash
# Inferred type (true/false/null/integers auto-converted)
glab api endpoint -F key=value

# Raw string
glab api endpoint -f key=value

# From file
glab api endpoint -F key=@filename

# From stdin
glab api endpoint -F key=@-

# Custom method
glab api endpoint -X PUT -f key=value

# Custom headers
glab api endpoint -H "Accept: text/plain"

# Request body from file
glab api endpoint --input body.json

# Include response headers
glab api endpoint -i
```

### GraphQL
```bash
# Simple query
glab api graphql -f query="query { currentUser { username } }"

# Complex query
glab api graphql -f query='
  query {
    project(fullPath: "gitlab-org/gitlab-docs") {
      name
      forksCount
      issuesEnabled
    }
  }
'

# Paginated GraphQL (must accept $endCursor variable and fetch pageInfo)
glab api graphql --paginate -f query='
  query($endCursor: String) {
    project(fullPath: "gitlab-org/graphql-sandbox") {
      issues(first: 100, after: $endCursor) {
        edges { node { title } }
        pageInfo { endCursor hasNextPage }
      }
    }
  }'
```

### Output Formats
- `json` (default) — pretty-printed, arrays as single JSON array
- `ndjson` — newline-delimited JSON, memory-efficient for large datasets

### Targeting Different Hosts
```bash
glab api --hostname gitlab.example.com projects/:id/releases
```

## Aliases

```bash
# Create alias
glab alias set mrv 'mr view'
glab alias set mrl 'mr list --assignee=@me'

# List aliases
glab alias list

# Delete alias
glab alias delete mrv
```

Aliases expand before execution. Use `DEBUG=true` to see expanded aliases.

## Stacked Diffs (EXPERIMENTAL)

```bash
glab stack create           # create a new stack
glab stack list             # list stacks
glab stack sync             # sync stack with remote
glab stack amend            # amend current stack entry
glab stack move             # move between stack entries
glab stack save             # save current changes to stack
```

Stacked diffs allow working on dependent MRs in sequence. Each stack entry becomes a separate MR targeting the previous entry's branch.

## Duo AI Integration

```bash
# Ask GitLab Duo about git commands
glab duo ask "how to rebase last 3 commits"
glab duo ask "squash commits in feature branch"
```

Requires GitLab Duo license. Generates terminal commands from natural language.

## Useful Patterns

### Get MR approval status via API
```bash
glab api projects/:id/merge_requests/123/approvals | jq '.approved_by[].user.username'
```

### Get pipeline jobs via API
```bash
glab api projects/:id/pipelines/12345/jobs | jq '.[] | {name, status}'
```

### Get project variables (when glab variable isn't enough)
```bash
glab api projects/:id/variables --paginate
```

### Trigger pipeline from another project
```bash
glab api -X POST projects/:id/trigger/pipeline -f ref=main -f token=TRIGGER_TOKEN
```

### List all project releases with pagination
```bash
glab api projects/:id/releases --paginate --output ndjson | jq -r '.name'
```

### Get detailed changelog for specific release
```bash
glab api projects/:id/releases/v1.2.3 | jq '.description'
```

### Fetch MR changes for AI description generation
```bash
glab api projects/:id/merge_requests/123/changes | jq '.changes[] | {old_path, new_path, diff}'
```

### Get MR discussions/comments
```bash
glab api projects/:id/merge_requests/123/discussions --paginate
```

### Update MR description programmatically
```bash
glab api -X PUT projects/:id/merge_requests/123 -f description="Updated description"
```

### Get project members and permissions
```bash
glab api projects/:id/members --paginate | jq '.[] | {username, access_level}'
```

### Search issues across project
```bash
glab api projects/:id/issues?search=bug --paginate
```

### Get commit details with stats
```bash
glab api projects/:id/repository/commits/abc123 | jq '{message, stats}'
```
