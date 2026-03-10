# OpenCode Commands Reference

## What is a Command?

A slash command is a markdown file containing instructions that OpenCode executes when user types `/command-name`. Commands are **instructions FOR the AI**, not messages to the user.

## File Locations

| Scope | Location |
|-------|----------|
| Global | `~/.config/opencode/commands/` |
| Project | `.opencode/commands/` |

Filename becomes command name: `test.md` → `/test`

## Frontmatter Fields

```yaml
---
description: Brief description shown in /help (required)
agent: agent-name        # Optional: which agent executes
model: opencode/...     # Optional: override model
---
```

**Supported fields:**
- `description` (string) - Shown in TUI, describes command
- `agent` (string, optional) - Agent to execute (defaults to current)
- `model` (string, optional) - Override model for this command

**NOT supported in OpenCode:**
- `argument-hint` (Claude Code only)
- `allowed-tools` (Claude Code only)
- `disable-model-invocation` (Claude Code only)

## Arguments

### All Arguments as String
```markdown
Create a component named $ARGUMENTS with TypeScript.
```
Usage: `/create Button` → "Create a component named Button..."

### Positional Arguments
```markdown
Create file $1 in directory $2 with content: $3
```
Usage: `/create foo.ts src "export const x = 1"`

## Dynamic Content

### Shell Output Injection
```markdown
Recent commits:
!`git log --oneline -5`

Review these changes.
```

Executes in project root, output injected into prompt.

### File References
```markdown
Review @src/api/users.ts for security issues.
```

File content automatically embedded.

## Patterns

### Simple Action
```markdown
---
description: Run tests with coverage
---

Run the test suite with coverage:
!`npm test -- --coverage`

Analyze results and suggest improvements.
```

### With Arguments
```markdown
---
description: Fix GitHub issue
---

Fix issue #$ARGUMENTS following project conventions.

1. Read the issue details
2. Understand the problem
3. Implement a fix
4. Write tests
```

### Review Pattern
```markdown
---
description: Review code changes
---

Files changed:
!`git diff --name-only`

Review each file for:
- Code quality
- Potential bugs
- Test coverage
```

### Agent Override
```markdown
---
description: Deep analysis
agent: plan
model: opencode/claude-opus-4-5
---

Analyze $ARGUMENTS thoroughly without making changes.
```

## Best Practices

1. **Write for AI consumption** - Commands instruct Claude, not user
2. **Use description** - Always include for `/help` visibility
3. **Keep focused** - One command, one task
4. **Validate inputs** - Handle missing arguments gracefully

## Common Mistakes

**Wrong (message to user):**
```markdown
This command will review your code and provide feedback.
```

**Right (instruction for AI):**
```markdown
Review the code for bugs and security issues.
Provide specific feedback with file:line references.
```

## JSON Alternative

Commands can also be defined in `opencode.json`:

```json
{
  "command": {
    "test": {
      "template": "Run tests with coverage...",
      "description": "Run tests",
      "agent": "build"
    }
  }
}
```
