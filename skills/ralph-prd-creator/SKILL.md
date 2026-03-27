---
name: ralph-prd-creator
description: "Create effective PRDs (Product Requirements Documents) for Ralph loops / Ralph Wiggum autonomous AI coding agents. Use whenever the user wants to create a PRD, task list, or specification for use with Ralph loops, Claude Code loops, Codex loops, or any autonomous agent loop. Also use when the user says 'create a PRD', 'write a task list for ralph', 'break this down into stories', 'plan this feature for autonomous coding', 'help me write acceptance criteria', 'prepare this for a ralph loop', or mentions creating prd.json. Also trigger when the user asks how to structure work for AI agents, wants to decompose a feature into agent-executable tasks, or needs help writing CLAUDE.md / AGENTS.md companion files for autonomous coding. Covers PRD schema, story decomposition, machine-verifiable acceptance criteria, quality gates, progress tracking, failure prevention, and companion file creation for DevOps/cloud-native/infrastructure projects."
---

# Ralph PRD Creator

Create machine-executable PRDs that drive autonomous AI coding loops to reliable completion. A Ralph PRD is not a traditional spec — it's a **living data structure** the agent reads, executes against, and updates every iteration.

## Core Principle

**The PRD defines the end state. The agent figures out how to get there.** You describe WHAT done looks like with machine-verifiable acceptance criteria. You do NOT describe HOW to implement it step by step.

## Reference Files

Load these based on the task:

- **PRD JSON schema and field reference**: See `references/prd-schema.md`
- **Writing acceptance criteria by language/tool**: See `references/acceptance-criteria.md`
- **Story sizing, splitting, and dependency ordering**: See `references/story-decomposition.md`
- **CLAUDE.md, AGENTS.md, and progress.txt patterns**: See `references/companion-files.md`
- **Common failure modes and prevention**: See `references/failure-modes.md`
- **Complete working example (Go/K8s)**: See `references/example-prd.json`

## Workflow: Creating a PRD from Scratch

### Step 1: GATHER REQUIREMENTS

Ask the user:

1. **What are you building?** (feature, tool, module, operator, pipeline)
2. **What's the tech stack?** (language, framework, database, infra tools)
3. **What does "done" look like?** (observable behaviors, outputs, endpoints)
4. **What's the scope?** (MVP, full feature, spike/prototype)
5. **What quality tooling exists?** (linter, type checker, test framework, CI)
6. **What should NOT be built?** (explicit non-goals prevent scope creep)

If the user provides a vague description ("build me a CLI tool"), use the interview technique: ask the agent-relevant questions the user hasn't thought about — error handling strategy, output formats, configuration approach, testing strategy.

### Step 2: READ REFERENCES

Before writing the PRD, load ALL reference files:

- `references/prd-schema.md` — to use the correct JSON structure
- `references/acceptance-criteria.md` — to write verifiable criteria for the user's stack
- `references/story-decomposition.md` — to size stories correctly
- `references/companion-files.md` — to create the supporting files
- `references/failure-modes.md` — to proactively prevent common failures

### Step 3: DECOMPOSE INTO STORIES

Follow the decomposition rules in `references/story-decomposition.md`:

1. Identify the dependency layers (schema → core logic → integration → validation → polish)
2. Split into stories that each fit one agent context window (1-3 file changes, describable in 2-3 sentences)
3. Set `dependsOn` to enforce ordering
4. Assign priority numbers (lower = higher priority = executed first)
5. Assign effort labels (low/medium/high) for iteration estimation

### Step 4: WRITE ACCEPTANCE CRITERIA

For each story, write criteria following `references/acceptance-criteria.md`:

1. Start with story-specific functional criteria (concrete, observable)
2. Append quality gates from the user's tooling (build, test, lint — on EVERY story)
3. Verify every criterion is machine-checkable (a command that returns pass/fail)
4. Check for vague language — "works correctly", "handles edge cases", "good UX" are NEVER acceptable

### Step 5: WRITE COMPANION FILES

Create the supporting files per `references/companion-files.md`:

1. **CLAUDE.md or AGENTS.md** — tech stack, conventions, MUST/MUST NOT rules, non-goals
2. **progress.txt** — empty file, will be populated by the agent
3. **Makefile or task runner** — with targets referenced in acceptance criteria

### Step 6: VALIDATE THE PRD

Run through this checklist before delivering:

- [ ] Every story fits in one context window (1-3 file changes)
- [ ] Every acceptance criterion is a runnable command or concrete observable state
- [ ] No vague criteria ("works correctly", "handles edge cases", "good UX")
- [ ] Quality gates (build, test, lint) appear on EVERY story
- [ ] `dependsOn` creates a valid DAG (no circular dependencies)
- [ ] Stories ordered by dependency: schema → backend → integration → UI → polish
- [ ] Non-goals explicitly listed in CLAUDE.md
- [ ] Tech stack fully specified (no ambiguous choices left to the agent)
- [ ] `branchName` is kebab-case and prefixed with `ralph/`
- [ ] All stories start with `"passes": false`
- [ ] Effort labels assigned for iteration estimation

### Step 7: DELIVER

Output these files:

1. **prd.json** — the structured PRD
2. **CLAUDE.md** (or AGENTS.md) — project constraints and conventions
3. **Makefile** (or equivalent) — build/test/lint commands referenced in criteria
4. Optionally: **progress.txt** — empty, ready for agent use
5. Optionally: **.golangci-lint.yaml** / **.eslintrc** / linter config — quality tooling

Present a summary: total stories, estimated iterations (sum of effort × multiplier), dependency graph overview, and any risks or ambiguities the user should resolve before running.

## Workflow: Reviewing an Existing PRD

When the user provides an existing PRD for review:

1. Load `references/prd-schema.md` and validate the JSON structure
2. Load `references/acceptance-criteria.md` and check every criterion for vagueness
3. Load `references/story-decomposition.md` and check story sizing
4. Load `references/failure-modes.md` and scan for known anti-patterns
5. Report issues using the validation checklist from Step 6
6. Suggest specific fixes with before/after examples

## Quick Reference: The 10 Rules

These are the most common mistakes. Check them first:

1. **JSON, not Markdown** — agents are less likely to edit JSON inappropriately
2. **One story = one context window** — if you can't describe the change in 2-3 sentences, split it
3. **Commands, not adjectives** — every criterion must be a command that returns pass/fail
4. **Quality gates on EVERY story** — build + test + lint appended to every story's criteria
5. **Explicit tech stack** — agents have no opinions; without constraints they pick randomly
6. **Non-goals listed** — agents cannot infer from omission; explicitly exclude unwanted features
7. **MUST/MUST NOT language** — "consider using X" gets ignored; "MUST use X, MUST NOT use Y" gets followed
8. **Notes field for inter-iteration memory** — agents write discoveries here for future iterations
9. **Start human-in-the-loop** — watch 2-3 iterations before going AFK
10. **Set iteration caps** — infinite loops with stochastic systems burn money and produce garbage
