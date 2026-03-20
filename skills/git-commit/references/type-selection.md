# Type Selection

Use the repository's recent commit history first. If the repo already has stable commit types or scope names, follow them unless they clearly conflict with the real change.

If there is no strong local convention, use this order:

1. `revert`
   - Use when the commit primarily reverts an earlier commit.

2. `fix`
   - Use when the main outcome is correcting broken behavior, wrong output, regressions, or bugs.

3. `feat`
   - Use when the main outcome is a new user-visible capability or meaningful product behavior change.

4. `perf`
   - Use when the change is primarily a performance improvement without a new feature as the main story.

5. `refactor`
   - Use when code structure changes but intended behavior does not.

6. `docs`
   - Use for documentation-only changes.

7. `test`
   - Use for test-only additions or corrections.

8. `style`
   - Use for formatting or style-only changes with no behavior impact.

9. `build`
   - Use for build tooling, dependencies, packaging, or release mechanics.

10. `ci`
   - Use for CI workflow or automation pipeline changes.

11. `chore`
   - Use as the fallback for maintenance work that does not fit a more precise type.

12. `ops`
   - Use only when the repository already distinguishes operational or infrastructure-only changes with `ops`.
   - If the repo does not use `ops`, prefer the local convention or fall back to `chore` or `build` as appropriate.

## Scope Rules

- Scope is optional.
- Omit scope by default unless it clearly helps the reader.
- Add scope when the project is modularized enough that the affected area is obvious and the extra label improves clarity.
- In mixed or generalized projects, skip scope unless the boundary is unusually clear and useful.
- Use a short noun that names the affected area, such as `auth`, `parser`, `cli`, or `docs`.
- Do not use issue IDs as the scope.
- If the change spans multiple areas and no single scope is honest, omit the scope.

## Subject Rules

- Format: `<type>(<optional-scope>): <description>`
- Use imperative, present-tense wording: `add`, `fix`, `remove`, `rename`, `align`
- Start the description lowercase.
- Do not end the description with a period.
- Describe the outcome, not the mechanical steps.
- Do not oversell: avoid calling a refactor a `feat` just because it sounds more positive.

## Breaking Changes

- Add `!` before the colon when the commit introduces an incompatible change.
- Add a `BREAKING CHANGE:` footer when migration details, removed behavior, or compatibility impact needs to be spelled out.
- Check for:
  - removed or renamed APIs
  - renamed config keys or file formats
  - changed defaults that break existing workflows
  - output/schema changes consumers must adapt to

## Quick Examples

- `fix(parser): handle empty scope names`
- `feat(cli): add config doctor command`
- `refactor(agent-router): simplify skill dispatch`
- `docs(readme): document local setup flow`
- `build(deps): upgrade markdown parser`
- `feat(api)!: remove legacy token endpoint`
