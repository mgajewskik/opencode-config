# Admin and Integrations

Use this module for GitLab actions outside the normal issue/MR/CI daily loop.

## Releases

```bash
glab release list
glab release view v1.0.0
glab release create v1.0.1 --notes "bugfix release"
```

Confirm before destructive release operations.

## Repository Admin

```bash
glab repo view
glab repo clone group/project
glab repo fork
glab repo create my-project --private
glab repo update --description "new desc"
```

Confirm before archive, transfer, or delete actions.

## Variables, Tokens, Snippets, Labels, Milestones

```bash
glab variable list
glab variable set MY_VAR "value"
glab token list --type personal
glab snippet create -t "Title" -f file.py
glab label list
glab milestone list
```

## Issue Extras

```bash
glab issue subscribe 42
glab issue board view
```

## Rare Integrations

These are not part of the core flow. Reach for them only when the request clearly asks for them:

- GitLab Kubernetes agents
- OpenTofu / Terraform state in GitLab
- MCP-server style GitLab integrations

If one of these appears, keep the task narrow and prefer `glab` or raw API guidance over expanding the Python CLI first.
