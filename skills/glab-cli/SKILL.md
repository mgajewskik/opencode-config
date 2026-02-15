---
name: glab-cli
description: "GitLab CLI (glab) for managing merge requests, CI/CD pipelines, releases, and repositories from the terminal. Use when user says 'glab', 'gitlab cli', 'merge request', 'MR', 'pipeline status', 'ci trace', 'gitlab release', asks to create/review/approve MRs, check pipeline status, view CI logs, manage GitLab releases, clone/fork GitLab repos, or any GitLab repository management from CLI. Covers glab mr, glab ci, glab release, glab repo commands. Extensions available for configuration/auth, advanced CI/CD, raw API access, and other commands (issues, variables, snippets, labels, schedules)."
---

# GitLab CLI (glab)

## Mental Model

glab auto-detects the GitLab instance from git remotes in the current directory. Override with `GITLAB_HOST` env var. Most repo-scoped subcommands (`mr`, `ci`, `release`, `repo`, `issue`, `variable`) support `-R OWNER/REPO` for cross-repo operations — check `glab <cmd> --help` if unsure.

**Preflight before any operation:**
1. Verify auth: `glab auth status`
2. Verify target: glab uses current git remote's host. Outside a repo, set `GITLAB_HOST` or `glab config set -g host <hostname>`
3. For cross-repo: use `-R group/project` (accepts `GROUP/NAMESPACE/REPO`, full URL, git URL)

## Operation Risk Tiers

| Tier | Operations | Safety Rule |
|------|-----------|-------------|
| **Read-only** | list, view, diff, status, trace, search | Safe — no confirmation needed |
| **Reversible** | approve, revoke, note, subscribe, rebase, retry, cancel | Low risk — can be undone |
| **Irreversible** | merge, delete (pipeline/release), transfer, archive | **Confirm repo + branch + state before executing** |
| **Prefer UI** | merge (final), release delete with tag | UI provides visual confirmation of title, labels, approvals |

## Merge Request Workflows

### Create MR from Current Branch

```bash
# Interactive — prompts for title/description
glab mr create

# Auto-fill from commit messages, push branch, open as draft
glab mr create --fill --fill-commit-body --draft --push

# Full automation: fill + push + skip confirmation
glab mr create -f --fill-commit-body -y

# With metadata
glab mr create -f --label bugfix --reviewer username1,username2 -b main

# From an issue (copies title, optionally labels)
glab mr create --related-issue 42 --copy-issue-labels

# Open in browser after creation
glab mr create -f --web
```

**Decision tree — creating MRs:**

| Situation | Command |
|-----------|---------|
| Want to write title/description manually | `glab mr create` |
| Quick MR from commits | `glab mr create -f -y` |
| Draft for early feedback | `glab mr create -f --draft` |
| Need reviewers immediately | `glab mr create -f --reviewer user1,user2` |
| MR for a specific issue | `glab mr create --related-issue 42 --copy-issue-labels` |
| Recovery after failed creation | `glab mr create --recover` (EXPERIMENTAL) |

### Generate MR Description from Branch Changes

To help generate a description, first gather the diff:

```bash
# View diff against target branch
glab mr diff           # for existing MR on current branch
git diff main...HEAD   # before MR exists

# Then create with custom description
glab mr create -t "feat: add user auth" -d "$(cat description.md)"
# Or use "-" to open editor
glab mr create -t "feat: add user auth" -d -
```

### Review MRs

```bash
# List MRs assigned to you
glab mr list --assignee=@me

# List MRs where you're reviewer
glab mr list --reviewer=@me

# List all open MRs
glab mr list

# Filter by label, branch, author
glab mr list --label needs-review --target-branch main
glab mr list --author username --source-branch feature-x

# View MR details
glab mr view 123
glab mr view 123 --comments        # with discussion
glab mr view feature-branch        # by branch name
glab mr view 123 --web             # open in browser

# View diff
glab mr diff 123

# JSON output for scripting
glab mr list -F json
glab mr view 123 -F json
```

### Comment, Approve, Merge

```bash
# Add comment
glab mr note 123 -m "LGTM, minor nit on line 42"
glab mr note feature-branch -m "needs rebase"

# Approve
glab mr approve 123

# Revoke approval
glab mr revoke 123

# Merge (prefer UI for final merge, but CLI available)
glab mr merge 123                          # auto-merge enabled by default
glab mr merge 123 --squash                 # squash commits
glab mr merge 123 --rebase                 # rebase before merge
glab mr merge 123 -d                       # delete source branch
glab mr merge 123 --sha abc123            # safety: only merge if HEAD matches
glab mr merge 123 --squash -d -y          # squash + delete branch + skip prompt
```

### Other MR Operations

```bash
glab mr checkout 123          # checkout MR branch locally
glab mr rebase 123            # trigger server-side rebase
glab mr close 123             # close without merging
glab mr reopen 123            # reopen closed MR
glab mr update 123 --title "new title" --add-label urgent
glab mr subscribe 123         # get notifications
glab mr todo 123              # add to your todo list
glab mr issues 123            # list issues that MR closes
```

## CI/CD Pipeline Management

### Check Pipeline Status

```bash
# Current branch pipeline status
glab ci status
glab ci status --live          # real-time updates until done
glab ci status --compact       # compact view
glab ci status -b main         # specific branch

# Interactive TUI — view all jobs, navigate with arrow keys
glab ci view
glab ci view main              # specific branch
glab ci view -p 12345          # specific pipeline ID
glab ci view --web             # open in browser
```

**`ci view` keybindings (non-obvious):**
- `Enter` — toggle job logs/traces, open child pipeline (trigger jobs marked `»`)
- `Esc` / `q` — close logs, return to parent pipeline
- `Ctrl+R` / `Ctrl+P` — run/retry/play a job (Tab to navigate modal, Enter to confirm)
- `Ctrl+D` — cancel running/pending job, or quit if job not active
- `Ctrl+Q` — quit
- `Ctrl+Space` — suspend app, view logs (like `glab ci trace`)
- Supports `vi` bindings + arrow keys

### Trace Job Logs

```bash
# Interactive job selection
glab ci trace

# By job ID or name
glab ci trace 224356863
glab ci trace lint
glab ci trace lint -b main
glab ci trace lint -p 12345    # specific pipeline
```

### Pipeline Operations

```bash
# List recent pipelines
glab ci list

# Get specific pipeline details
glab ci get 12345

# Retry a failed job (by job ID or name)
glab ci retry 224356863        # by job ID
glab ci retry lint             # by job name
glab ci retry lint -p 12345    # within specific pipeline

# Trigger a manual job (jobs with when: manual)
glab ci trigger                # interactive selection
glab ci trigger deploy         # by job name
glab ci trigger 224356863      # by job ID

# Cancel running pipeline
glab ci cancel 12345

# Delete pipeline
glab ci delete 12345

# Run new pipeline
glab ci run                    # current branch
glab ci run -b main            # specific branch
glab ci run --mr               # MR pipeline (not branch pipeline)
glab ci run --web              # open in browser

# Run pipeline with trigger token (for cross-project or external triggers)
glab ci run-trig -t $TRIGGER_TOKEN -b main
glab ci run-trig -t $TRIGGER_TOKEN --variables key1:val1

# Lint .gitlab-ci.yml
glab ci lint                   # current directory
glab ci lint path/to/.gitlab-ci.yml
glab ci lint --dry-run         # simulate pipeline creation
glab ci lint --include-jobs    # show jobs that would run
```

### Pipeline Decision Tree

| Need | Command |
|------|---------|
| Quick status check | `glab ci status` |
| Watch pipeline live | `glab ci status --live` |
| Interactive job browser | `glab ci view` |
| Stream specific job log | `glab ci trace <job-name>` |
| Retry a failed job | `glab ci retry <job-name>` |
| Trigger manual job | `glab ci trigger <job-name>` |
| Start new pipeline | `glab ci run -b <branch>` |
| Trigger with token | `glab ci run-trig -t TOKEN -b <branch>` |
| Validate CI config | `glab ci lint --dry-run --include-jobs` |

## Release Management

### View Releases

```bash
# List releases
glab release list
glab release list -R group/project    # different repo

# View specific release
glab release view v1.0.0
glab release view v1.0.0 -F json     # JSON output

# Download release assets
glab release download v1.0.0
glab release download v1.0.0 -D ./downloads
```

### Create Releases (when needed manually)

```bash
# Interactive
glab release create v1.0.1

# With notes
glab release create v1.0.1 --notes "bugfix release"

# From file (changelog)
glab release create v1.0.1 -F CHANGELOG.md

# With assets
glab release create v1.0.1 './dist/*.tar.gz'
glab release create v1.0.1 '/path/to/asset.zip#Display Label'

# From specific ref (not default branch)
glab release create v1.0.1 --ref feature-branch

# With milestones
glab release create v1.0.1 -m "Sprint 42" -m "Sprint 43"
```

## Repository Management

```bash
# Clone (supports group/project or full URL)
glab repo clone group/project

# Fork current or specified repo
glab repo fork
glab repo fork group/project

# Create new project
glab repo create my-project --private
glab repo create my-project --group my-group --description "desc"

# View / search / list
glab repo view                          # current repo
glab repo view group/project --web      # open in browser
glab repo search -s "query"
glab repo list --member                 # repos you're a member of
```

**Irreversible repo operations (confirm before executing):**
```bash
glab repo archive                              # archives project (read-only after)
glab repo transfer --target-namespace new-group # moves project
glab repo delete OWNER/REPO --yes              # permanent deletion
```

## Common Errors → Fix

| Error | Cause | Fix |
|-------|-------|-----|
| `401 Unauthorized` | Token expired/missing | `glab auth login` or check `GITLAB_TOKEN` |
| `404 Project Not Found` | Wrong repo/host or no access | Verify `-R` path, check `glab auth status` |
| `could not determine source branch` | Branch not pushed | Push branch first, or use `--push` / `-f` |
| `merge request already exists` | MR exists for this source→target | Use `glab mr list -s <branch>` to find it |
| TLS/certificate errors | Self-signed cert or mTLS | Load [references/configuration.md](references/configuration.md) |
| `ci view` blank/crashes | Non-TTY environment | Use `glab ci status` or `glab ci trace` instead |

## NEVER

- NEVER use `glab mr merge` without `--sha` flag in automated scripts — race condition if new commits pushed
- NEVER pass tokens via command line flags in shared environments — use `GITLAB_TOKEN` env var or `glab auth login --stdin < token.txt`
- NEVER use `glab ci run --variables` or `--input` with `--mr` flag — they're incompatible, command will fail
- NEVER assume `glab ci view` works in non-TTY environments (CI jobs, pipes) — it's interactive TUI only
- NEVER use `glab mr create` without `--push` or `-f` if branch isn't pushed — MR creation will fail silently or error
- NEVER forget `-R OWNER/REPO` when operating on a different repo than current directory
- NEVER use `glab release delete` without confirming tag deletion intent — `--with-tag` deletes the git tag too
- NEVER confuse `glab ci retry` (retries a job) with retrying an entire pipeline — use `glab ci run` to start a new pipeline
- NEVER confuse `glab ci trigger` (triggers manual jobs) with `glab ci run-trig` (runs pipeline with trigger token)

## Extension Loading

**Load [references/configuration.md](references/configuration.md) when:**
- Setting up glab for first time
- Configuring auth (login, tokens, OAuth, CI job tokens)
- Multi-instance setup (self-managed + gitlab.com)
- Config file locations, precedence, env vars
- mTLS or self-signed certificate setup
- Debugging connection/auth issues (401, TLS errors)
- **Do NOT load** for routine MR/CI/release operations

**Load [references/ci-cd-advanced.md](references/ci-cd-advanced.md) when:**
- Running pipelines with variables or inputs
- Managing CI/CD schedules
- Working with CI config (`glab ci config`)
- Advanced job management or pipeline triggering
- **Do NOT load** for basic `ci status`, `ci view`, `ci trace`

**Load [references/api-and-advanced.md](references/api-and-advanced.md) when:**
- Making raw GitLab API calls (`glab api`)
- GraphQL queries
- Pagination of large result sets
- Creating aliases
- Operations not covered by built-in commands
- **Do NOT load** for standard mr/ci/release/repo commands

**Load [references/other-commands.md](references/other-commands.md) when:**
- Working with issues (`glab issue`)
- Managing CI/CD variables (`glab variable`)
- Working with snippets, labels, milestones
- Managing tokens, deploy keys, SSH/GPG keys
- Incidents, iterations, secure files, shell completions
- **Do NOT load** for MR, CI/CD, release, or repo operations
