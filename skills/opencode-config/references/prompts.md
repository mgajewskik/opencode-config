# OpenCode Prompts Reference

## What is a Prompt?

A prompt is a reusable system instruction file that defines AI behavior. Prompts are referenced by agents or modes, not invoked directly by users.

## Prompts vs Commands vs Agents

| Type | Purpose | Invocation |
|------|---------|------------|
| **Prompt** | Reusable instructions | Referenced by agents/modes |
| **Command** | User action with args | `/command-name` |
| **Agent** | Specialized persona | `@agent-name` or auto |

## File Locations

| Scope | Location |
|-------|----------|
| Global | `~/.config/opencode/prompts/` |
| Project | `.opencode/prompts/` |

## Format

Plain text or markdown. No frontmatter needed.

```markdown
You are [role]. Your task is to [objective].

## Guidelines
- [Guideline 1]
- [Guideline 2]

## Process
1. [Step 1]
2. [Step 2]

## Output
[What to produce]
```

## Referencing Prompts

### From Agent (JSON)

```json
{
  "agent": {
    "reviewer": {
      "prompt": "{file:./prompts/code-review.md}"
    }
  }
}
```

### From Mode (JSON)

```json
{
  "mode": {
    "review": {
      "prompt": "{file:./prompts/code-review.md}"
    }
  }
}
```

Path is relative to config file location.

## When to Use Prompts

**Use prompts when:**
- Instructions reused across multiple agents/modes
- Long instructions (>50 lines)
- Version controlling behavior separately
- Sharing across team

**Use inline prompts when:**
- Short, simple instructions
- Agent-specific, not reused
- Quick prototyping

## Patterns

### Code Review Prompt

`prompts/code-review.md`:
```markdown
You review code for bugs and best practices.

## Focus Areas
- Logic errors and edge cases
- Security vulnerabilities
- Error handling gaps

## Rules
- Only review changed code
- Don't flag style preferences
- Be certain before flagging bugs

## Output
🔴 CRITICAL: Security or correctness bug
🟡 SUGGEST: Improvement worth considering

Include file:line references for all issues.
```

### Analysis Prompt

`prompts/analyze.md`:
```markdown
Your task is to analyze the codebase to answer questions.

Read as many files as needed for full context.
Suggest multiple solutions with pros/cons.
Guide through reasoning to foster understanding.
Ask thought-provoking questions.
Optimize for knowledge retention.
```

### Documentation Prompt

`prompts/documentation.md`:
```markdown
You write clear, comprehensive documentation.

## Guidelines
- Clear explanations for the target audience
- Proper structure with headings
- Code examples where helpful
- User-friendly language

## Process
1. Understand what needs documenting
2. Identify target audience
3. Structure content logically
4. Write with clarity
5. Add examples
```

## Best Practices

1. **Keep reusable** - Don't include agent-specific config
2. **Be specific** - Clear guidelines, not vague principles
3. **Include process** - Step-by-step when applicable
4. **Define output** - What should be produced
5. **Version control** - Track changes to behavior

## Prompts vs AGENTS.md

| Prompts | AGENTS.md |
|---------|-----------|
| Agent/mode-specific behavior | Global rules for all sessions |
| Referenced explicitly | Always loaded |
| Detailed instructions | Concise rules |
| Task-focused | Behavior constraints |
