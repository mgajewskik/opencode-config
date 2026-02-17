---
name: skill-architect
description: "Design and create Claude Skills with appropriate structure based on task requirements. Use when: creating new skills, evaluating existing skills, 'how should I structure this skill', skill architecture decisions, choosing between Simple/Complex/Lightweight archetypes, adding rubrics or validation patterns. Covers discovery interviews, archetype selection, structural element recommendations, and scaffold generation."
---

# Skill Architect

Design skills with structure matched to task requirements.

## Core Formula

> **Good Skill = Expert Knowledge - What Claude Already Knows**

Only add what Claude doesn't have: decision trees, trade-offs, edge cases, anti-patterns. Delete tutorials, basic explanations, standard library usage.

## Skill Anatomy

```
skill-name/
├── SKILL.md              # Required: frontmatter + instructions (<500 lines)
├── references/           # Optional: loaded on-demand
├── scripts/              # Optional: deterministic operations
└── assets/               # Optional: templates, images for output
```

**Three-layer loading:**
1. **Metadata** (~100 tokens) - Always in context (name + description)
2. **SKILL.md body** (<5k words) - Loaded when skill triggers
3. **Bundled resources** - Loaded as needed by Claude

## Frontmatter (Agent Skills Spec)

Skills follow the open Agent Skills standard (https://agentskills.io/specification).

**Required:**
```yaml
---
name: skill-name          # kebab-case, 1-64 chars, matches directory
description: What + When  # 1-1024 chars, include trigger keywords
---
```

**Optional:**
```yaml
license: Apache-2.0
compatibility: Requires git, docker
metadata:
  author: example-org
  version: "1.0"
allowed-tools: Bash(git:*) Read  # Experimental
```

**NOT in spec (avoid for portability):**
- `version` at root level → use `metadata.version`
- `tools` → implementation-specific
- `category`, `color`, `displayName` → UI-specific

**Full spec:** [references/frontmatter-spec.md](references/frontmatter-spec.md)

## Archetype Selection

**Use discovery questions to determine archetype.** See [references/discovery-questions.md](references/discovery-questions.md) for full question set.

| Archetype | When to Use | Key Indicators |
|-----------|-------------|----------------|
| **Simple** | Transform existing content | Linear workflow, existing input, subjective quality |
| **Complex** | Create from scratch via discovery | Multi-phase, no content, high variation |
| **Lightweight** | Binary execution tasks | Linear, pass/fail quality, low variation |

**Decision tree:**
```
Multi-phase workflow? → Complex
Binary quality + low variation? → Lightweight
Existing content + transformation? → Simple
Default → Complex
```

**Full archetype details:** [references/archetypes.md](references/archetypes.md)

## Structural Elements

### Universal (every skill)

1. **PRD-style spec** - Purpose (FOR/NOT for), Users, Workflow, Dependencies, Non-goals
2. **Input/Output schema** - Required fields, types, constraints
3. **Guardrails** - NEVER/ALWAYS rules, "when in doubt" defaults
4. **Failure modes** - Detection triggers, fallback strategies

### Conditional (based on discovery)

| Trigger | Add Element |
|---------|-------------|
| Subjective quality | 8-criteria rubric with scoring |
| High variation | Two-pass diagnostic/reconstruction |
| Binary quality | Pass/fail checklist only |
| Transformation task | Fact preservation rules |
| Multi-phase | Question bank + approval gates |
| Repeat use | Memory patterns (config naming) |
| High stakes | Enhanced failure modes + disclaimers |
| 3+ components | Decomposition-first step |

**Pattern implementations:** [references/patterns.md](references/patterns.md)

## Extensions

| Extension | When to Use |
|-----------|-------------|
| [Testing Methodology](references/testing-methodology.md) | Validating skill triggers, measuring success, iteration signals |
| [MCP Integration](references/mcp-integration.md) | Skills that orchestrate MCP tools, multi-service workflows |

## Freedom Calibration

Match specificity to task fragility:

| Task Type | Freedom Level | Format |
|-----------|---------------|--------|
| Creative/design | High | Text-based principles |
| Code review, analysis | Medium | Pseudocode, parameterized |
| File operations, fragile | Low | Exact scripts, few parameters |

**Rule:** High consequence of mistakes → Low freedom

## Skill-Splitting Detection

**Split into TWO skills when:**
- Intermediate output reused across multiple workflows
- Phases happen hours/days apart
- Different users run different phases
- Failure isolation critical

**Keep as ONE skill when:**
- Phases run sequentially in same session
- Intermediate output used once
- Combined skill is maintainable

**Pattern:** "Interview about X, then generate Y" → Skill 1: gatherer (Complex), Skill 2: generator (Simple)

## Creation Process

### 1. Understand with examples

Ask:
- "What should this skill do? Give examples."
- "What would trigger this skill?"
- "How will you know output is good?"

### 2. Run discovery questions

Use [references/discovery-questions.md](references/discovery-questions.md) to determine:
- Archetype (Simple/Complex/Lightweight)
- Structural elements needed
- Validation approach

### 3. Plan reusable contents

For each example, identify:
- Scripts for repeated code
- References for domain knowledge
- Assets for templates/boilerplate

### 4. Initialize skill

```bash
scripts/init_skill.py <skill-name> --path <output-directory>
```

### 5. Implement

**Start with:** scripts/, references/, assets/ identified in planning

**Then write SKILL.md:**
- Frontmatter: `name` + `description` (include ALL trigger scenarios)
- Body: Instructions using patterns from [references/patterns.md](references/patterns.md)

### 6. Validate and package

```bash
scripts/package_skill.py <path/to/skill-folder>
```

## NEVER

- Explain basics Claude knows (what is X, standard library usage)
- Create >500 line SKILL.md without splitting to references/
- Add rubrics for binary tasks
- Split skills without reusability justification
- Put "when to use" in body instead of description
- Create README.md, CHANGELOG.md, or auxiliary docs
- Use deeply nested references (keep one level from SKILL.md)

## ALWAYS

- Include description with WHAT + WHEN + trigger keywords
- Match structure to task (don't over-engineer Lightweight, don't under-engineer Complex)
- Test scripts by running them
- Provide fallbacks for failure modes
- Use imperative form in instructions

## Conflict Detection

When discovery answers contradict:

| Conflict | Ask |
|----------|-----|
| Binary quality + high variation | "Does quality vary subjectively, or truly pass/fail?" |
| Existing content + multi-phase | "Transform existing, or create from scratch?" |
| Ready-to-publish + high variation | "Consistently ready, or needs iteration?" |

Resolve before recommending structure.
