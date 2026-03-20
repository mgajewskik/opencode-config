# Message Shape

Default to a commit body that carries real context. The subject says what changed. The body explains why it had to happen and the most important details of how the change was made.

## Default Template

```text
<type>(<optional-scope>): <description>

Why:
- explain the problem, gap, risk, or goal

What:
- summarize the most important code, config, or docs changes
- keep it to the 1-3 details someone would want when scanning history later
```

Use this labeled structure by default because it reliably captures the extra context the diff title cannot.

## Body Rules

- `Why:` is expected for normal commits handled by this skill.
- `What:` is expected for normal commits handled by this skill.
- Keep the body specific and high-signal.
- Keep the body at the project-history level, not the conversation-transcript level.
- Prefer concise bullets over dense paragraphs when the change has several moving parts.
- Do not simply repeat the subject line in longer words.
- Mention tests only when they materially support the story of the commit.
- Mention migrations, rollout notes, or follow-up work only when they matter to future readers.

## Avoid Leaking Drafting Context

Do not put internal conversation or prompt mechanics into the commit body.

Avoid content like:
- why the assistant hesitated, debated options, or considered multiple prompt interpretations
- caveats about what was said in the conversation but not reflected in the code or long-term project rationale
- low-level implementation narration that reads like a work log instead of commit context
- verbose lists of every tiny edit when only 1-3 high-value changes matter
- references to agent limitations, token usage, or drafting process

Good commit bodies preserve durable context such as:
- the product, codebase, or workflow problem that made the change necessary
- the main architectural or behavioral decision captured by the commit
- the few important changes future readers need in order to understand the diff quickly

If a detail only mattered while drafting the commit message, but would not help someone understand the repository history later, leave it out.

## Optional Sections

Add only when useful:

```text
Impact:
- note user-visible effects, migration notes, or operational consequences
```

## Footers

Add footers after one blank line below the body.

Common examples:

```text
Refs: #123
Closes: #456
```

For breaking changes:

```text
BREAKING CHANGE: explain what is no longer compatible and what the reader must update
```

## Preview Before Commit

Before creating a real commit, show the exact final commit message to the user.

That preview should include:
- the full subject line
- the full body text under sections like `Why:` and `What:`
- any footers such as `Refs:` or `BREAKING CHANGE:`

Show it as the literal final text, not a paraphrase, so the user can catch mistakes before it is committed.
After showing the preview, continue with the commit flow unless the user interrupts with corrections.

## Examples

```text
fix(parser): handle empty scope names

Why:
- prevent commit generation from crashing when the user omits a scope

What:
- guard the empty-scope path before formatting the header
- keep scope optional instead of forcing a placeholder value
```

```text
chore(deps): upgrade tree-sitter bindings

Why:
- align local parsing behavior with the current runtime and remove version drift

What:
- bump the dependency to the supported release
- update the small compatibility shim used by the parser wrapper
```

```text
feat(api)!: remove legacy token endpoint

Why:
- retire the deprecated auth path before the next API rollout

What:
- remove the old endpoint and its compatibility handler
- route callers through the current token exchange flow

BREAKING CHANGE: clients must switch from `/v1/token` to `/v2/token/exchange`
```
