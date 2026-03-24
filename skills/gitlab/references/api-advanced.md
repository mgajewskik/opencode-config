# Raw API and Advanced GitLab Access

Use this module when `gl.py` and standard `glab` subcommands do not cover the required operation.

## Raw REST Calls

```bash
glab api projects/:id/merge_requests?state=opened
glab api projects/:id/issues?search=bug --paginate
glab api projects/:id/merge_requests/123/discussions --paginate
glab api projects/:id/pipelines/12345/jobs | jq '.[] | {name, status}'
```

## GraphQL

```bash
glab api graphql -f query='query { currentUser { username } }'
```

## Useful Patterns

```bash
# MR approval status
glab api projects/:id/merge_requests/123/approvals

# Update MR description
glab api -X PUT projects/:id/merge_requests/123 -f description="Updated"

# Trigger pipeline from another project
glab api -X POST projects/:id/trigger/pipeline -f ref=main -f token=TRIGGER_TOKEN
```

## When to Load This Module

- raw endpoint needed
- GraphQL query needed
- pagination or bulk listing matters
- built-in commands do not expose the needed field

## Rule

Prefer `gl.py` first, then normal `glab` subcommands, then `glab api` / GraphQL as the final fallback.
