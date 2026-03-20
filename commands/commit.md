---
description: Create a proper git commit from current changes
---

Create a proper git commit for the current repository changes.

Treat `$ARGUMENTS` as optional commit-framing suggestions only. They may suggest a type, scope, summary, or emphasis, but they do not override the actual diff.

Use the `git-commit` skill internally to draft and create the commit.

## Workflow

1. Inspect the real commit candidate.
   - Review `git status`, the staged and unstaged diff that would be committed, and recent commit subjects for local style.
   - Do not rely on conversation history or `$ARGUMENTS` alone.

2. Decide whether one commit is honest.
   - If the changes clearly belong in one commit, continue.
   - If the changes are unrelated enough that they should be split, propose the split plan before creating multiple commits.

3. Treat `$ARGUMENTS` as hints, not instructions.
   - If arguments are present, interpret them as suggestions for likely type, scope, description, or the part of the change to emphasize.
   - Keep suggestions only when they match the actual changes.
   - If the suggestions conflict with the diff, prefer the diff and say so briefly.

4. Apply the `git-commit` skill's message rules.
   - Write a Conventional Commits subject line that matches the real change.
   - Add a high-signal body with `Why:` and `What:`.
   - Keep the body high-level and durable.
   - Do not leak internal conversation details, drafting caveats, prompt mechanics, or low-value implementation narration into the commit body.

5. Show the exact final commit message before creating the commit.
   - Print the full final text exactly as it will be committed.
   - Include the subject, body sections, and any footers.
   - Make it easy for me to inspect so I can catch mistakes before the commit is created.
   - Show the preview for visibility only; do not turn it into a confirmation gate.
   - Continue with the commit flow unless I interrupt with corrections.

6. Create the commit when the change is ready.
   - If there are no changes to commit, say so and stop.
   - Stage the relevant files for the chosen commit.
   - Create the commit with the final subject and body after showing the preview.

7. Report the result concisely.
   - Return the final commit subject.
   - Summarize the main context captured in the body.
   - Mention any follow-up note only if it matters, such as split-commit advice or a breaking-change warning.
