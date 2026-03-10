# OpenCode Agents Reference

## What is an Agent?

An agent is a specialized AI persona with specific capabilities, tools, and instructions. Agents handle complex tasks autonomously.

## File Locations

| Scope | Location |
|-------|----------|
| Global | `~/.config/opencode/agents/` |
| Project | `.opencode/agents/` |

Filename becomes agent name: `reviewer.md` → `@reviewer`

## Frontmatter Fields

```yaml
---
description: When to use this agent (CRITICAL - include examples)
mode: subagent          # primary | subagent | all
model: inherit          # inherit | opencode/claude-... | openai/...
temperature: 0.1        # Optional: 0.0-1.0
tools:
  read: true
  write: false
  edit: false
  bash: true
  grep: true
  glob: true
---
```

### description (CRITICAL)

The description determines when Claude triggers this agent. Must include:
- Triggering conditions ("Use when...")
- Anti-patterns ("Do NOT use for...")

**Good:**
```yaml
description: Reviews code for bugs and security. Use proactively for significant changes. Do NOT use for trivial fixes or formatting.
```

**Bad:**
```yaml
description: Code reviewer
```

### mode

| Value | Meaning |
|-------|---------|
| `primary` | User invokes directly |
| `subagent` | Other agents invoke (not user-facing) |
| `all` | Both (default) |

### model

- `inherit` - Use parent's model (recommended)
- Full model ID: `opencode/claude-sonnet-4-5`, `openai/gpt-4o`, etc.

### tools

Control which tools agent can use:

```yaml
tools:
  read: true      # Read files
  write: false    # Create new files
  edit: false     # Modify existing files
  bash: true      # Execute commands
  grep: true      # Search file contents
  glob: true      # Find files by pattern
  list: true      # List directories
  webfetch: false # Fetch URLs
  todoread: false # Read todos
  todowrite: false # Write todos
  patch: false    # Apply patches
```

**Principle of least privilege:** Only enable tools the agent needs.

## System Prompt (Body)

The markdown body becomes the agent's system prompt. Write in second person.

### Structure

```markdown
You are [role] specializing in [domain].

## Responsibilities
- [Primary task]
- [Secondary task]

## Process
1. [Step one]
2. [Step two]
3. [Step three]

## Output Format
[What to return]

## What NOT to Do
- [Anti-pattern]
- [Another anti-pattern]
```

## Patterns

### Read-Only Analyzer

```markdown
---
description: Analyzes codebase architecture. Use when exploring unfamiliar code or understanding structure. Do NOT use for making changes.
mode: subagent
model: inherit
tools:
  read: true
  grep: true
  glob: true
  write: false
  edit: false
  bash: false
---

You analyze codebases to understand architecture and patterns.

## Process
1. Identify entry points
2. Map dependencies
3. Document patterns
4. Report findings

## Output
- Architecture overview
- Key files and their purposes
- Patterns used
- Recommendations
```

### Code Reviewer

```markdown
---
description: Reviews code for bugs and best practices. Use for significant changes before completion. Do NOT use for trivial changes.
mode: subagent
model: inherit
temperature: 0.1
tools:
  read: true
  bash: true
  grep: true
  glob: true
  write: false
  edit: false
---

You review code changes. Bugs are your primary focus.

## What to Look For
- Logic errors, off-by-one mistakes
- Edge cases: null inputs, error conditions
- Security issues: injection, auth bypass

## Before Flagging
- Be certain it's actually a bug
- Only review changed code
- Don't flag style preferences

## Output Format
🔴 CRITICAL: [Issue] at file:line
🟡 SUGGEST: [Improvement] at file:line
```

### Implementer

```markdown
---
description: Makes focused code changes to single files. Use for parallel edits when changes are isolated. Do NOT use when changes depend on each other.
mode: subagent
model: inherit
tools:
  read: true
  write: true
  edit: true
  bash: true
  grep: true
  glob: true
---

You implement focused code changes.

## Process
1. Read target file
2. Understand context
3. Make minimal changes
4. Verify syntax

## Rules
- Stay focused on assigned task
- Don't expand scope
- Preserve existing patterns
```

## JSON Alternative

Agents can be defined in `opencode.json`:

```json
{
  "agent": {
    "reviewer": {
      "description": "Reviews code for bugs",
      "mode": "subagent",
      "model": "opencode/claude-sonnet-4-5",
      "prompt": "{file:./prompts/review.md}",
      "tools": {
        "write": false,
        "edit": false
      }
    }
  }
}
```

## Best Practices

1. **Description is critical** - Include when/when-not triggers
2. **Limit tools** - Only what's needed
3. **Use subagent mode** - Unless user-facing
4. **Inherit model** - Unless specific capability needed
5. **Clear process** - Step-by-step in system prompt

## Common Mistakes

- Generic description without triggers
- Granting all tools when subset needed
- Vague system prompt without process steps
- Missing "what NOT to do" section
