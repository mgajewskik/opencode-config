---
name: git-commit
description: Create proper git commits from repository changes using Conventional Commits headers and a high-signal commit body that explains why the change was needed and what was done. Use when the user says commit this, make a commit, create a commit, draft a commit message from current changes, or asks for a proper git commit.
compatibility: Requires git and a repository with changes to review
---

# Git Commit

Create commit messages that stay useful after the diff is closed.

## Purpose / Not For

Use this skill when the task includes drafting or creating a git commit.

In scope:
- Turn staged or unstaged changes into an accurate Conventional Commit header.
- Add a commit body that explains why the change was necessary and what was done.
- Follow the repository's existing commit taxonomy when it already has a stable pattern.
- Flag commits that should probably be split before creating misleading history.

Out of scope:
- Pull request writing, release notes, or changelog generation by themselves.
- Rebases, history rewriting, or force-push workflows.
- Generic git troubleshooting unrelated to the commit message itself.

## Archetype

Recommend Lightweight with a small decision layer.

Why:
- The workflow is linear and repeatable.
- Most quality checks are binary: correct type, correct scope, correct body structure, correct breaking-change signaling.
- The only subjective part is choosing the most accurate framing, which is handled by the type and body references.

## Trigger Boundary

Trigger this skill when the user asks for any of the following:
- `commit this`
- `make a commit`
- `create a commit`
- `write a commit message from this diff`
- `draft a proper git commit`
- any request whose next meaningful step is creating a real git commit

Do not trigger when the user only wants:
- a pull request
- a changelog
- release/version planning without a commit task
- a generic explanation of Git or Conventional Commits with no commit-writing task

## Start Here

Classify the job before doing anything else.

- `draft-only`
  - User wants a commit message but not the actual commit command yet.
  - Load `references/type-selection.md`
  - Load `references/message-shape.md`

- `create-commit`
  - User explicitly wants the commit created.
  - Load `references/type-selection.md`
  - Load `references/message-shape.md`
  - Follow the repository and session git-safety rules already in effect.

- `repair-message`
  - A commit hook failed, the draft is weak, or the type/body needs correction.
  - Load `references/type-selection.md`
  - Load `references/message-shape.md`
  - Re-draft from the actual staged changes instead of defending the old message.

## Core Workflow

1. Inspect the commit candidate, not just the latest file touched.
   - Review `git status`, the staged/unstaged diff that will be committed, and recent `git log` subjects.
   - Follow existing repo commit style when it is consistent.

2. Check whether the changes belong in one commit.
   - If the diff contains unrelated concerns, recommend splitting it.
   - If the user still wants one commit, write the most honest umbrella message and avoid over-specific scopes.

3. Choose the type and optional scope.
   - Prefer the repository's established types first.
   - Otherwise use `references/type-selection.md`.
   - Omit scope when the boundary is fuzzy; do not invent one just to fill the pattern.
   - Add a scope only when the project is modularized enough that it clearly improves clarity.

4. Write the subject line.
   - Format: `<type>(<optional-scope>): <description>`
   - Use imperative, present-tense wording.
   - Start the description lowercase and do not end it with a period.
   - Describe the net change, not the implementation chore list.

5. Write the body.
   - For normal commits handled by this skill, the body is expected, not optional.
   - First explain why the change was necessary.
   - Then summarize the most important details of what changed.
   - Keep the body high-level and high-signal; do not leak internal conversation details, drafting caveats, or prompt-era reasoning that is not useful in git history.
   - Use the labeled structure in `references/message-shape.md` unless the repository clearly prefers another body format.

6. Add footers when needed.
   - Mark every incompatible change with `!` in the header.
   - Add `BREAKING CHANGE:` when migration, removed behavior, or compatibility details need to be spelled out.
   - Add issue references only when they are real and known.

7. Verify before finalizing.
   - The title matches the main intent of the change.
   - The body adds context instead of repeating the title.
   - Breaking changes are explicit, not implied.

8. Show the exact commit message before creating the commit.
   - Print the full final message exactly as it will be committed.
   - Include the subject, body sections, and any footers.
   - Make the full text easy for the user to inspect so they can catch mistakes before `git commit` runs.
   - Show the preview for visibility only; do not turn it into a confirmation gate.
   - Continue with the commit flow unless the user interrupts with corrections.

## Success Checklist

Pass when ALL are true:
- The header follows Conventional Commits format.
- The selected type matches the primary change.
- The scope is accurate or intentionally omitted.
- The body explains why the commit exists and what changed.
- The body gives durable context without leaking internal conversation details or low-value drafting rationale.
- The message reflects the actual changes being committed.
- Any breaking change is marked with `!`, with a `BREAKING CHANGE:` footer when extra compatibility detail is needed.
- For real commit creation, the exact final message was shown to the user before the commit was made.

Fail when ANY are true:
- The subject is vague, such as `update stuff` or `fix issue`.
- The body only restates the subject with no added context.
- The body leaks internal conversation notes, prompt caveats, or rejected drafting paths that do not belong in project history.
- The type is chosen to sound nicer instead of sounding accurate.
- One commit hides obviously unrelated changes without calling out the tradeoff.
- A breaking change is present but not labeled.
- A real commit is created without first showing the exact final subject, body sections, and footers to the user.

## Failure Modes and Recovery

- Mixed changes in one diff
  - Recovery: recommend split commits before drafting a misleading message.

- No clear scope
  - Recovery: omit scope rather than guessing.

- Repo uses a custom type taxonomy
  - Recovery: follow existing repo history if it is internally consistent and still Conventional-Commits-compatible.

- The diff does not make the motivation obvious
  - Recovery: infer from tests, docs, issue references, and neighboring changes; ask only if multiple materially different stories would change the type or breaking-change status.

- Breaking change is easy to miss
  - Recovery: explicitly check removed behavior, renamed config, changed output contracts, and migration requirements.

## Output Contract

- If the user wants a draft, return:
  - the final commit subject
  - the final commit body
  - a one-line note on why the chosen type fits

- If the user wants the actual commit created, return:
  - the exact final commit message preview before execution
  - any notable body sections or footers included
  - after commit, the committed subject and any follow-up note such as split-commit advice or breaking-change warning
