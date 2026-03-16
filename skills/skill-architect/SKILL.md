---
name: skill-architect
description: "Design, create, evaluate, and improve Claude Skills with structure matched to the task. Use when creating a new skill, auditing or refactoring an existing skill, deciding how a skill should be structured, choosing between Simple/Complex/Lightweight archetypes, adding evals or validation patterns, optimizing a skill description, or packaging a skill for reuse. Covers discovery interviews, archetype selection, structural patterns, evaluation loops, benchmarking, and trigger-tuning."
---

# Skill Architect

Design skills with structure matched to task requirements, then iterate until they are actually good.

Keep the moat behind progressive disclosure. Do not load every reference file up front. Detect the user's stage, load only what that stage needs, and keep the core `SKILL.md` focused on routing, architecture, and high-leverage decisions.

## Core Formula

> **Good Skill = Expert Knowledge - What Claude Already Knows**

Only add what Claude does not already have: decision trees, trade-offs, edge cases, anti-patterns, trigger boundaries, and domain-specific workflows. Delete tutorials, basic explanations, and routine tooling instructions.

## Primary Job

Move the user through the full skill lifecycle:

1. Understand what the skill is for
2. Choose the right architecture
3. Draft or refactor the skill
4. Validate triggering and functional behavior
5. Iterate based on evidence, not vibes alone
6. Optimize description, package, and hand off

## Stage Detection

Before doing anything else, classify the request into one or more stages:

| Stage | Typical user intent | What you should optimize for |
|------|----------------------|------------------------------|
| **Discover** | "Help me create a skill", "What should this skill be?" | Scope, trigger boundaries, archetype |
| **Architect** | "How should I structure it?" | Archetype, patterns, references, scripts |
| **Draft** | "Write the skill" | Compact core instructions + on-demand moat |
| **Evaluate** | "Test this skill", "Is it better?" | Realistic evals, baselines, assertions |
| **Iterate** | "Improve based on feedback" | Generalization, de-overfitting, reusable tools |
| **Optimize Triggering** | "Improve the description" | Trigger precision/recall |
| **Package** | "Ship this skill" | Validation, portability, distributable output |

If the request spans multiple stages, work in that order unless the user explicitly wants a later stage only.

## Load Only What You Need

Use these loading triggers aggressively. Read the listed files before acting in that area.

### 1. Architecture and Discovery

**MANDATORY:** Read these files when creating a new skill, restructuring an existing one, or deciding what shape a skill should take:

- `references/discovery-questions.md`
- `references/archetypes.md`
- `references/patterns.md`
- `references/frontmatter-spec.md`

These files contain the core moat for choosing the right architecture, not just writing instructions.

### 2. Evaluation and Iteration

**MANDATORY:** Read these files when the user wants to test, compare, benchmark, or improve a skill based on evidence:

- `references/testing-methodology.md`
- `references/skill-lifecycle.md`
- `references/schemas.md`

Load `agents/grader.md`, `agents/comparator.md`, and `agents/analyzer.md` only when you are running graded evals or blind comparisons.

### 3. Description Optimization

**MANDATORY:** Read this file when the user wants to improve triggering accuracy, reduce undertriggering, or compare description variants:

- `references/description-optimization.md`

Use the scripts in `scripts/` for repeatable trigger-evaluation work.

### 4. Environment-Specific Adaptation

Read this file when tool availability matters or the user is on Claude.ai, OpenCode, Cowork, or a headless environment:

- `references/environment-modes.md`

### 5. MCP-Specific Workflows

Read this file only when the skill orchestrates MCP tools or multi-service workflows:

- `references/mcp-integration.md`

### Do NOT Load Unless Needed

- Do NOT load `references/mcp-integration.md` for non-MCP skills.
- Do NOT load evaluation references when the user only wants a quick architecture recommendation.
- Do NOT load every agent doc just because they exist.
- Do NOT stuff detailed schemas or large examples into the core SKILL.md.

## Skill Anatomy

```text
skill-name/
├── SKILL.md              # Required: routing + core instructions
├── references/           # Optional: loaded on-demand
├── scripts/              # Optional: deterministic operations
├── agents/               # Optional: specialist grading/comparison guidance
└── assets/               # Optional: templates or review artifacts
```

**Three-layer loading:**

1. **Metadata** (~100 tokens) - always in context
2. **SKILL.md body** (<5k words, ideally much less) - loaded when the skill triggers
3. **Bundled resources** - loaded only when a workflow branch requires them

Preferred organization:

- `SKILL.md` = routing + architecture + stage detection
- `references/` = deep guidance, schemas, workflows, examples
- `scripts/` = deterministic utilities and reusable automation
- `agents/` = specialist grading/comparison/analyzer instructions
- `assets/` = templates or review artifacts only when truly useful

## Frontmatter (Agent Skills Spec)

Skills follow the open Agent Skills standard (https://agentskills.io/specification).

**Required:**

```yaml
---
name: skill-name
description: What + when + trigger boundaries
---
```

**Optional:**

```yaml
license: Apache-2.0
compatibility: Requires git, docker
metadata:
  author: example-org
  version: "1.0"
allowed-tools: Bash(git:*) Read
```

**NOT in spec (avoid for portability):**

- `version` at root level -> use `metadata.version`
- `tools` -> implementation-specific
- `category`, `color`, `displayName` -> UI-specific

Read `references/frontmatter-spec.md` before authoring or refactoring frontmatter.

## Archetype Selection

Use discovery questions to determine the archetype.

| Archetype | When to Use | Key Indicators |
|-----------|-------------|----------------|
| **Simple** | Transform existing content | Linear workflow, existing input, subjective quality |
| **Complex** | Create from scratch via discovery | Multi-phase, no content, high variation |
| **Lightweight** | Binary execution tasks | Linear, pass/fail quality, low variation |

**Decision tree:**

```text
Multi-phase workflow? -> Complex
Binary quality + low variation? -> Lightweight
Existing content + transformation? -> Simple
Default -> Complex
```

Read `references/archetypes.md` for the full logic and justification templates.

## Structural Elements

### Universal (every reusable skill)

1. Purpose and non-goals
2. Trigger boundaries
3. Input/output expectations
4. Guardrails and defaults
5. Failure modes and fallbacks

### Conditional (load when discovery says they are needed)

| Trigger | Add Element |
|---------|-------------|
| Subjective quality | 8-criteria rubric with scoring |
| High variation | Two-pass diagnostic/reconstruction |
| Binary quality | Pass/fail checklist only |
| Transformation task | Fact preservation rules |
| Multi-phase | Question bank + approval gates |
| Repeat use | Memory/configuration pattern |
| High stakes | Enhanced failure modes + disclaimers |
| 3+ components | Decomposition-first step |

Read `references/patterns.md` for implementation patterns.

## Extensions

| Extension | When to Use |
|-----------|-------------|
| `references/testing-methodology.md` | Validate triggers, function, consistency, and iteration signals |
| `references/skill-lifecycle.md` | Run the full draft/test/review/improve loop |
| `references/description-optimization.md` | Tune the description using trigger evals |
| `references/environment-modes.md` | Adapt the workflow to different tool/runtime environments |
| `references/mcp-integration.md` | Design skills that orchestrate MCP tools |
| `references/schemas.md` | Use shared artifact formats for evals and benchmarks |

## Freedom Calibration

Match specificity to task fragility:

| Task Type | Freedom Level | Format |
|-----------|---------------|--------|
| Creative/design | High | Text-based principles |
| Code review, analysis | Medium | Pseudocode, parameterized |
| File operations, fragile | Low | Exact scripts, few parameters |

**Rule:** High consequence of mistakes -> Low freedom.

## Skill-Splitting Detection

**Split into two skills when:**

- intermediate output is reused across multiple workflows
- phases happen hours or days apart
- different users run different phases
- failure isolation matters more than convenience

**Keep as one skill when:**

- phases run sequentially in one session
- intermediate output is used once
- the combined skill is still maintainable

Pattern: "interview about X, then generate Y" often becomes Skill 1 = gatherer (Complex) and Skill 2 = generator (Simple).

## Creation Process

### 1. Recover intent from the conversation first

Before asking new questions, inspect the current conversation for:

- tools the user already used
- correction patterns they made
- output format expectations
- examples that already reveal edge cases
- signs that this is a new skill vs a refactor of an existing one

Only ask for information that is still missing.

### 2. Understand with examples

Ask:

- What should this skill do? Give examples.
- What would trigger this skill?
- How will you know the output is good?

### 3. Run discovery questions

Use `references/discovery-questions.md` to determine:

- archetype
- structural elements needed
- validation approach

### 4. Plan reusable contents

For each example, identify:

- scripts for repeated work
- references for domain knowledge
- agents for specialist review or comparison
- assets for templates or review artifacts

If multiple eval runs or revisions would recreate the same helper repeatedly, promote it into `scripts/`.

### 5. Initialize or refactor the skeleton

```bash
uv run scripts/init_skill.py <skill-name> --path <output-directory>
```

### 6. Implement the smallest correct architecture

Start with the smallest structure that still matches the archetype.

Then write `SKILL.md` so it:

- includes all trigger scenarios in the description
- routes to deeper references instead of inlining everything
- explains defaults and fallbacks
- points to scripts for deterministic work

### 7. Evaluate before declaring success

If the skill will be reused, do not stop at a pretty draft.

- create realistic eval prompts
- compare with-skill against an appropriate baseline
- add assertions only when they test meaningful outcomes
- collect human review for subjective tasks
- revise based on repeated failures and transcript evidence

Read `references/testing-methodology.md`, `references/skill-lifecycle.md`, and `references/description-optimization.md` when working in this phase.

### 8. Validate and package

```bash
uv run scripts/package_skill.py <path/to/skill-folder>
```

Useful utilities in `scripts/`:

- General/OpenCode-friendly: `scripts/init_skill.py`, `scripts/quick_validate.py`, `scripts/package_skill.py`, `scripts/generate_report.py`, `scripts/aggregate_benchmark.py`
- OpenCode trigger tooling: `scripts/run_eval.py`, `scripts/improve_description.py`, `scripts/run_loop.py`

## NEVER

- explain basics Claude already knows
- create a bloated `SKILL.md` when a reference file would do
- add rubrics to binary tasks
- split skills without a reuse or isolation reason
- put "when to use" guidance only in the body instead of the description
- create README-style maintenance docs inside the skill
- overfit the skill to three eval prompts and call it done
- optimize descriptions by turning them into keyword dumps
- skip human review for subjective quality problems

## ALWAYS

- include description with WHAT + WHEN + trigger keywords
- match structure to task fragility and variation
- test scripts by running them
- provide failure modes and safe defaults
- use imperative instructions
- preserve architecture quality while adding lifecycle rigor
- prefer progressive disclosure over dumping moat into one file
- generalize from feedback instead of patching one prompt at a time

## Conflict Detection

When discovery answers contradict, resolve them before recommending structure:

| Conflict | Ask |
|----------|-----|
| Binary quality + high variation | "Does quality vary subjectively, or is it truly pass/fail?" |
| Existing content + multi-phase | "Is this transformation or creation from scratch?" |
| Ready-to-publish + high variation | "Is output consistently final, or does it need iteration?" |

## Exit Criteria

The skill is ready when all of these are true:

- the archetype fits the task
- the description triggers for the right kinds of requests
- the core SKILL.md is compact and routes correctly
- deep guidance is pushed into references instead of duplicated
- repeatable work is encoded in scripts where useful
- evaluation shows the skill improves on baseline or clearly reduces user effort

If progress flattens out, say so explicitly and recommend the smallest next experiment.
