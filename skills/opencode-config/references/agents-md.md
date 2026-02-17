# AGENTS.md Reference

## What is AGENTS.md?

AGENTS.md contains persistent rules that apply to ALL sessions. It's loaded automatically and defines behavioral constraints, preferences, and project-specific guidelines.

## File Locations

| Scope | Location | Purpose |
|-------|----------|---------|
| Global | `~/.config/opencode/AGENTS.md` | User-wide defaults |
| Project | `./AGENTS.md` | Project-specific rules |

Both are loaded. Project rules take precedence.

## AGENTS.md vs Other Config

| AGENTS.md | Prompts | Commands |
|-----------|---------|----------|
| Always loaded | Explicitly referenced | User-invoked |
| Persistent rules | Task instructions | Actions with args |
| Behavioral constraints | Detailed process | One-time execution |
| Concise | Can be long | Focused |

## Format

Markdown with clear sections. Keep concise and actionable.

```markdown
## Section Name

**Rule in bold.**

- Specific instruction
- Another instruction

## Another Section

[More rules...]
```

## What to Include

### Communication Style
```markdown
## Communication Style

- Be concise, sacrifice grammar for brevity
- DO NOT say "you're right" or validate correctness
- DO NOT say "that's an excellent question"
```

### Code Conventions
```markdown
## Code Documentation

- AVOID unnecessary comments unless explicitly asked
- Good code should be self-documenting
- ONLY add comments for non-obvious logic
```

### Tool Restrictions
```markdown
## Bash Commands

**FORBIDDEN for sensitive files:** cat, head, tail, less
- These output to terminal and leak secrets
- PREFER the Read tool for file reading
```

### Git Behavior
```markdown
## Git Operations

**NEVER perform git operations without explicit instruction.**

- ALLOWED: git status, git diff, git log (read-only)
- FORBIDDEN: git add, git commit, git push (require user instruction)
```

### Project-Specific
```markdown
## Testing

- Run `npm test` before completing any code change
- All new functions need unit tests
- Use vitest, not jest
```

## Patterns

### Minimal AGENTS.md

```markdown
## Style

- Be concise
- No unnecessary comments in code

## Git

- Never auto-commit
- Inform when changes ready
```

### Comprehensive AGENTS.md

```markdown
## Planning

**ALWAYS gather requirements before modifying files.**

1. Understand - Ask clarifying questions
2. Plan - Create implementation plan
3. Execute - Only then proceed

## Communication

- Be concise, sacrifice grammar
- No validation phrases ("you're right", "great question")

## Code

- Avoid unnecessary comments
- Self-documenting code preferred
- Only comment non-obvious logic

## Bash

**FORBIDDEN for sensitive files:** cat, head, tail
- Use Read tool instead

## Git

**NEVER auto-commit.**

- ALLOWED: git status, git diff, git log
- FORBIDDEN without instruction: git add, git commit, git push

## Dependencies

**NEVER install packages without approval.**

- ASK FIRST before any install command
- NO curl|sh patterns
- Prefer system package managers
```

## Best Practices

1. **Keep concise** - Rules, not tutorials
2. **Be actionable** - Clear do/don't instructions
3. **Use bold** - Highlight critical rules
4. **Section clearly** - One topic per section
5. **Avoid redundancy** - Don't repeat obvious things

## Common Mistakes

**Too verbose:**
```markdown
## Git Operations

When working with git, it's important to remember that version control
is a critical part of the development workflow. Git operations can have
significant impacts on the codebase and should be handled with care...
```

**Better:**
```markdown
## Git

**Never auto-commit.** Only commit when user explicitly asks.
```

## Claude Code Compatibility

OpenCode supports Claude Code files as fallbacks:
- `CLAUDE.md` used if no `AGENTS.md` exists
- `~/.claude/CLAUDE.md` used if no `~/.config/opencode/AGENTS.md`

To disable: `export OPENCODE_DISABLE_CLAUDE_CODE=1`
