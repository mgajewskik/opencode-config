---
name: commit
description: Draft, create, or rewrite Git commit messages for explicit requests such as “commit this,” `/commit`, independently authorized autonomous commits, amend/reword, revert, squash, and message-only drafting. Use for every authorized commit-message operation. Do not use for generic Git help. Triggering this skill does not authorize creating, amending, rewriting, staging, or otherwise performing Git operations.
---

# Commit

Write durable messages from the actual candidate and only within existing user or automation authority.

## Select the operation and candidate

Inspect `git status`, the relevant diff or targets, and recent subjects. Treat request arguments as hints. Classify the operation first:

- New commit: use exactly a non-empty index; do not alter it. Otherwise, when authorized, stage only task changes.
- Message-only amend/reword: use the targeted commit and diff; preserve index and worktree.
- Content-changing amend: require explicit authority; use the target plus exactly the staged set and stage nothing else.
- Revert: use explicit targets and the inverse change; stop if unrelated changes prevent it.
- Squash: use the combined diff of explicit targets; preserve unrelated state and pause on ambiguity.
- Preserve unrelated tracked and untracked changes.
- If the candidate contains unrelated concerns, propose atomic groups and pause. Do not create an umbrella commit or multiple commits without the required authority.
- For message-only drafting, do not stage or commit. Use the supplied diff, description, or repository candidate and stop after returning the message.

## Protect repository context

Before drafting or previewing, screen the candidate and message. Exclude by default internal plans, handoffs, scratch/progress/review notes, task memory, prompts/transcripts, agent/tool/session metadata, command histories, runtime logs, and local indexes/caches/temp artifacts.

Classify by purpose, not filename: real source, tests, or durable docs named `plan` or `handoff` remain eligible. If unstaged, omit internal helpers silently. If the exact staged set contains an unauthorized one, preserve the index and stop without echoing its path or content.

Include an internal helper only when the user explicitly identifies and authorizes it; then describe only its repository-safe durable role.

Use only candidate-backed repository facts. Never expose private absolute or machine-local paths; non-target file names, paths, or contents; conversation, deliberation, rejected options; local probes, validation or approval flow; identities, tokens, session IDs, or private customer/system data. Use repository-relative identifiers only when tracked or in the candidate and useful. Candidate-backed public runtime paths are allowed when part of the documented interface. Generalize sensitive deletions or reverts. Sanitize before literal preview; if no truthful safe message exists, stop generically.

## Choose the type

Use exactly one of these types. Repository history may guide wording and scopes, but cannot add types or remove required sections.

- `feat`: add user-visible capability or meaningful product behavior.
- `fix`: correct broken behavior, wrong output, or a regression.
- `refactor`: change structure without changing intended behavior.
- `perf`: improve performance as the primary outcome.
- `docs`: change documentation only.
- `test`: add or correct tests only.
- `build`: change dependencies, packaging, build tooling, or release mechanics.
- `ci`: change continuous-integration workflows or pipeline automation.
- `style`: change formatting or style without behavior impact.
- `revert`: revert an earlier commit as the primary outcome.
- `chore`: perform maintenance that fits no more precise type.

Use `chore` only as the fallback.

## Construct the message

For a non-breaking change, use this exact shape:

```text
<type>(<optional-scope>): <imperative lowercase description>

Why:
- durable motivation

What:
- important change
- up to two more important changes
```

For a breaking change, use this exact shape:

```text
<type>(<optional-scope>)!: <imperative lowercase description>

Why:
- durable motivation

What:
- important change
- up to two more important changes

BREAKING CHANGE: compatibility impact and migration
```

Every message must include both `Why:` and `What:`. Keep `What:` to 1–3 important changes. Do not add source-code comments merely to preserve commit rationale.

Use an imperative, lowercase description with no trailing period. Describe the net outcome. Do not impose a line-length limit beyond repository-enforced hooks.

Add a short scope only when exactly one clear subsystem is affected and the scope improves scanning. Otherwise omit it.

For a breaking change, add `!` before the colon and the `BREAKING CHANGE:` footer with concrete compatibility impact and migration guidance. For a non-breaking change, omit both. Include other footers only when they are factual and required by the repository or request.

## Preview and execute

Show the literal final message, including all blank lines and footers, before any authorized commit operation. This is a visibility checkpoint, not a confirmation gate: continue without asking unless the user interrupts. Draft-only requests stop after the message.

When execution is authorized, perform only the requested operation and report the resulting commit subject and identifier. Do not infer permission to amend, reword, squash, revert, stage, commit, or rewrite history from this skill triggering.

## Pass/fail check

Pass only when:

- the candidate is atomic and matches the files being committed;
- the header uses the fixed type set, an honest optional scope, and the required subject style;
- both `Why:` and `What:` add concise, durable context;
- the candidate and message contain only authorized, candidate-backed repository context;
- breaking changes use both `!` and the migration footer;
- the literal message is previewed before an authorized operation;
- unrelated changes and existing staging are preserved.

Fail and recover as follows:

- No candidate: report that there is nothing to commit and stop.
- Mixed concerns: propose atomic groups and pause.
- Private or process context: preserve state, stop, and report without echoing it.
- Unclear motivation, type, or compatibility impact: inspect nearby tests, docs, issues, and history; ask only if materially different messages remain plausible.
- Hook or commit failure: report the exact relevant failure, re-inspect repository state, and revise or retry only within existing authority.
- Requested framing conflicts with the candidate: follow the candidate and state the mismatch briefly.
