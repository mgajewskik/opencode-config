# OpenCode Modes Reference

## What is a Mode?

A mode customizes OpenCode's behavior, tools, and prompts for different workflows. Modes control what the AI can do during a session.

## Modes vs Agents

| Aspect | Modes | Agents |
|--------|-------|--------|
| **Purpose** | Session-wide behavior | Task-specific persona |
| **Invocation** | Tab key toggle | `@name` or auto |
| **Scope** | Entire session | Single task |
| **Focus** | Tool permissions | Specialized expertise |

## Built-in Modes

- **build** - Full editing (write/edit/bash enabled)
- **plan** - Read-only analysis (write/edit/bash disabled)

Toggle with **Tab** key during session.

## File Locations

| Scope | Location |
|-------|----------|
| Global | `~/.config/opencode/modes/` |
| Project | `.opencode/modes/` |

Filename becomes mode name: `review.md` → `review` mode

## Frontmatter Fields

```yaml
---
description: Mode description
model: anthropic/claude-sonnet-4-5  # Optional
temperature: 0.1                     # Optional
tools:
  read: true
  write: true
  edit: true
  bash: false
  grep: true
  glob: true
---
```

### tools

Control which tools are enabled in this mode:

```yaml
tools:
  read: true      # Read files
  write: true     # Create new files
  edit: true      # Modify existing files
  bash: false     # Execute commands
  grep: true      # Search file contents
  glob: true      # Find files by pattern
```

## Patterns

### Read-Only Mode

```markdown
---
description: Analysis mode - no changes allowed
tools:
  read: true
  write: false
  edit: false
  bash: false
  grep: true
  glob: true
---

You are in read-only mode. Analyze and explain, but do not modify any files.

Focus on:
- Understanding architecture
- Identifying patterns
- Answering questions
```

### Documentation Mode

```markdown
---
description: Documentation writing mode
tools:
  read: true
  write: true
  edit: true
  bash: false
  grep: true
  glob: true
---

You are in documentation mode. Focus on writing clear docs.

Guidelines:
- Read code to understand behavior
- Write comprehensive documentation
- No code changes, only docs
```

### Safe Refactor Mode

```markdown
---
description: Refactoring with no bash access
tools:
  read: true
  write: true
  edit: true
  bash: false
  grep: true
  glob: true
---

You are in safe refactor mode. Make code changes but cannot run commands.

Process:
1. Read and understand code
2. Make focused changes
3. User will run tests manually
```

## JSON Configuration

Modes can be defined in `opencode.json`:

```json
{
  "mode": {
    "build": {
      "model": "anthropic/claude-sonnet-4-5",
      "prompt": "{file:./prompts/build.md}",
      "tools": {
        "write": true,
        "edit": true,
        "bash": true
      }
    },
    "plan": {
      "model": "anthropic/claude-haiku-4-5",
      "tools": {
        "write": false,
        "edit": false,
        "bash": false
      }
    }
  }
}
```

## When to Use Modes

**Use modes when:**
- Need different tool permissions for workflows
- Want to toggle behavior mid-session
- Configuring session-wide constraints
- Different models for different workflows

**Use agents instead when:**
- Need specialized personas
- Want orchestration (primary spawns subagents)
- Task-specific execution
- Multi-agent workflows

## Best Practices

1. **Focus on tools** - Modes primarily control what's allowed
2. **Keep prompts short** - Detailed instructions go in agents
3. **Clear purpose** - Each mode for specific workflow
4. **Sensible defaults** - Enable only needed tools
