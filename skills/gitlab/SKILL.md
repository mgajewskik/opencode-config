---
name: gitlab
description: "Unified GitLab skill for issues, merge requests, reviews, CI/CD, releases, and repository operations. Use whenever the user mentions GitLab, GitLab issues, merge requests/MRs, pipelines, releases, repo administration, or glab. Prefer the bundled Python CLI first for issue and MR workflows; if that path is unavailable, unsupported, or fails, fall back to glab CLI and load only the matching reference module."
compatibility: Requires uv. Python-first path uses GITLAB_HOST and GITLAB_TOKEN env vars. glab fallback uses glab auth and/or the same env vars.
---

# gitlab

One GitLab skill. Use it for all GitLab work.

## Default Tool Preference

1. **Use `scripts/gl.py` first** for issue and merge request workflows.
   - Structured JSON output
   - Better for agent consumption
   - Best default for read/create/update/review flows
2. **Fail over to `glab`** when:
   - `gl.py` does not implement the requested action
   - `gl.py` fails because auth/env/runtime is broken
   - the workflow is glab-only or materially easier in glab
   - the user explicitly asks for glab
3. **Lazy load only the needed reference module** before advanced or uncommon work.

## Core Decision Tree

```text
GitLab request?
├─ Issue or MR workflow?
│  ├─ Supported by scripts/gl.py? → Use gl.py first
│  └─ Not supported / failing? → Use glab fallback
├─ CI/CD, releases, repo admin, variables, tokens, or raw API?
│  └─ Load matching reference and usually use glab
└─ Auth / TLS / self-hosted trouble?
   └─ Load references/configuration.md
```

## Python-First CLI

Script location: `scripts/gl.py`

### Preflight

```bash
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" detect
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" whoami
```

If these fail because the environment is not ready, switch to `glab` and load [references/configuration.md](references/configuration.md).

## Primary Daily Workflows

### Issues

Prefer `gl.py` for the common issue lifecycle:

```bash
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" issue list
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" issue info 45
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" issue create "Bug title" --description "Details"
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" issue update 45 --title "New title"
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" issue comment 45 "Working on this"
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" issue close 45
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" issue reopen 45
```

Load [references/issues.md](references/issues.md) when:
- updating labels, milestones, or assignees
- using fallback `glab issue ...`
- needing less common issue actions

### Merge Requests

Prefer `gl.py` for read/review/create/update flows:

```bash
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" mr list --reviewer me
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" mr info 123
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" mr diff 123
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" mr discussions 123 --unresolved-only
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" mr create "Feature title"
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" mr update 123 --description-file /tmp/mr.md
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" mr assign 123 -r reviewer1
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" mr draft add 123 "Needs tests"
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" mr draft publish 123
```

Load [references/mr-review.md](references/mr-review.md) when:
- reviewing an MR end-to-end
- adding line comments, suggestions, or draft reviews
- deleting comments or handling diff-note edge cases
- switching to glab or raw API fallback

### CI / Pipelines

Use `gl.py` first for structured status, jobs, and retries:

```bash
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" pipeline list
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" pipeline status 12345
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" job log 67890 --tail 100
```

Load [references/ci-cd.md](references/ci-cd.md) when:
- you need `glab ci view` / `trace` / `run` / `lint`
- you need manual jobs, trigger tokens, variables, or typed inputs

### Work Status / Pending Actions

Start with:

```bash
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" actionable
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" mr list --reviewer me
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" mr list --author me
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" pipeline list --mine --status failed
```

Load [references/work-status.md](references/work-status.md) when:
- the user asks for todos, pending work, recent activity, or unresolved threads
- you need APIs that `gl.py` does not expose directly

## Commenting Rules for MR Diff Notes

Line comments and suggestions must target changed lines in the MR diff. If a line comment fails or lands in the wrong place:

- load [references/position-calculation.md](references/position-calculation.md)
- load [references/mr-review.md](references/mr-review.md)

## Safety Rules

### Safe by default
- reading issues, MRs, discussions, diffs, pipelines, logs
- creating or updating issue/MR metadata
- adding comments or draft reviews

### Confirm before executing
- merging an MR
- deleting comments if the request is ambiguous
- deleting releases, pipelines, projects, tokens, or variables
- repo transfer, archive, or delete actions

### Prefer UI when practical
- final merge when the user wants a visual check of approvals/pipeline state
- destructive admin actions

## Fallback Rules

Switch from Python to glab when any of these is true:

1. `gl.py` returns an auth/env/runtime error
2. `gl.py` lacks the command you need
3. the task is naturally glab-driven:
   - `glab ci view`
   - `glab ci run` / `run-trig`
   - `glab release ...`
   - `glab repo ...`
   - `glab variable ...`
   - `glab token ...`
   - raw `glab api` / GraphQL

When fallback happens, state it briefly so the user knows why.

## Lazy-Loaded Reference Modules

Load only what matches the task:

- [references/issues.md](references/issues.md)
  - issue create/read/update/comment flows
  - issue-specific glab fallback
- [references/mr-review.md](references/mr-review.md)
  - MR review, suggestions, drafts, replies, deletes, fallback API/glab paths
- [references/ci-cd.md](references/ci-cd.md)
  - pipelines, jobs, manual jobs, tracing, linting, run/trigger flows
- [references/work-status.md](references/work-status.md)
  - todos, activity, unresolved threads, pending work dashboards
- [references/configuration.md](references/configuration.md)
  - Python env setup, glab auth, self-hosted hosts, TLS/debugging
- [references/api-advanced.md](references/api-advanced.md)
  - raw `glab api`, GraphQL, pagination, advanced endpoints
- [references/admin-and-integrations.md](references/admin-and-integrations.md)
  - releases, repo admin, variables, tokens, snippets, labels, milestones, integrations
- [references/troubleshooting.md](references/troubleshooting.md)
  - Python CLI troubleshooting and common failure modes

## Minimal glab Fallback Reference

```bash
glab auth status
glab mr list --reviewer=@me
glab mr view 123 --comments
glab mr diff 123
glab issue view 45 --comments
glab ci status
```

## Failure Modes

| Scenario | Detection | Fallback |
|----------|-----------|----------|
| Python CLI cannot auth | `gl.py whoami` or any command fails with auth error | Load `references/configuration.md`, then use `glab auth status` |
| Python CLI lacks needed action | No matching `gl.py` command | Load the matching reference and use glab |
| MR line comment fails | position / line error | Load `references/position-calculation.md` and `references/mr-review.md` |
| User asks for rare admin/integration action | request mentions releases, variables, repo admin, tokens, K8s, OpenTofu, MCP | Load `references/admin-and-integrations.md` |

## Anti-Pattern

Do not load every GitLab reference file up front. Start with the core skill, use `gl.py` first, and pull in only the module that matches the current action.
