---
name: opencode-config
description: Create and configure OpenCode customizations - commands, agents, prompts, modes, and AGENTS.md. Use when user says "create command", "add agent", "opencode prompt", "create mode", "edit AGENTS.md", "customize opencode", "opencode config", or needs guidance on OpenCode-specific configuration patterns.
---

# OpenCode Configuration

Create commands, agents, prompts, modes, and AGENTS.md for OpenCode.

## Decision Tree

**Route user request to correct config type:**

```
User wants to customize OpenCode behavior
│
├─ User-invoked action with arguments?
│  └─ Yes → COMMAND (load references/commands.md)
│
├─ Autonomous task handler / specialized persona?
│  └─ Yes → AGENT (load references/agents.md)
│
├─ Reusable system instructions for agents?
│  └─ Yes → PROMPT (load references/prompts.md)
│
├─ Session-wide behavior/tool toggle?
│  └─ Yes → MODE (load references/modes.md)
│
└─ Persistent rules across all sessions?
   └─ Yes → AGENTS.md (load references/agents-md.md)
```

## Quick Reference

| Type | Purpose | Location | Invocation |
|------|---------|----------|------------|
| **Command** | User action with args | `commands/*.md` | `/name args` |
| **Agent** | Specialized AI persona | `agents/*.md` | `@name` or auto |
| **Prompt** | Reusable instructions | `prompts/*.md` | Referenced by agents |
| **Mode** | Tool/behavior toggle | `modes/*.md` or JSON | Tab key |
| **AGENTS.md** | Persistent rules | Root `AGENTS.md` | Always loaded |

## Workflow

### Step 1: Identify Config Type

Ask if unclear:
- "Should this be triggered by user (`/command`) or automatically?"
- "Is this a one-time action or persistent behavior?"
- "Does this need arguments from user?"

### Step 2: Load Reference

Based on decision tree, load the appropriate reference file:
- Commands → `references/commands.md`
- Agents → `references/agents.md`
- Prompts → `references/prompts.md`
- Modes → `references/modes.md`
- AGENTS.md → `references/agents-md.md`

### Step 3: Create Config

Follow patterns from loaded reference. Key principles:
- **Commands**: Instructions FOR the AI, not messages to user
- **Agents**: Include triggering examples in description
- **Prompts**: Keep reusable, reference via `{file:./prompts/name.md}`
- **Modes**: Focus on tool permissions
- **AGENTS.md**: Concise rules, not tutorials

### Step 4: Place File

**Global** (all projects):
- `~/.config/opencode/commands/`
- `~/.config/opencode/agents/`
- `~/.config/opencode/prompts/`
- `~/.config/opencode/modes/`
- `~/.config/opencode/AGENTS.md`

**Project-specific**:
- `.opencode/commands/`
- `.opencode/agents/`
- `.opencode/prompts/`
- `.opencode/modes/`
- `./AGENTS.md`

## Common Patterns

### Command for User Action
```markdown
---
description: Brief description for /help
---

Do X with $ARGUMENTS.

[Instructions for AI...]
```

### Agent for Specialized Task
```markdown
---
description: Use when [trigger]. Do NOT use for [anti-trigger].
mode: subagent
model: inherit
tools:
  write: false
  edit: false
---

You are [role]. Focus on [responsibilities].

[Process steps...]
```

### Prompt for Reusable Instructions
```markdown
You are [role]. Your task is to [objective].

[Detailed instructions...]
```

Referenced by agent: `"prompt": "{file:./prompts/name.md}"`

### Mode for Behavior Toggle
```markdown
---
description: Mode description
tools:
  write: true
  bash: false
---

[Instructions when in this mode...]
```

### AGENTS.md for Persistent Rules
```markdown
## Section Name

**Rule in bold.**

- Specific instruction
- Another instruction

[Keep concise, actionable]
```

## NEVER

- Create commands that message user instead of instructing AI
- Create agents without triggering examples in description
- Put "when to use" in agent body instead of description
- Create verbose AGENTS.md with tutorials
- Use Claude Code-specific features (`argument-hint`, `allowed-tools`)

## ALWAYS

- Use `$ARGUMENTS` or `$1`, `$2` for command arguments
- Include `mode: subagent` for non-primary agents
- Keep AGENTS.md rules actionable and concise
- Test commands work with OpenCode syntax
