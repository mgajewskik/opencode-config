---
name: ralph-prd-creator
description: "Create effective PRDs (Product Requirements Documents) for Ralph loops / Ralph Wiggum autonomous AI coding agents. Use whenever the user wants to create a PRD, task list, or specification for use with Ralph loops, Claude Code loops, Codex loops, or any autonomous agent loop. Also use when the user says 'create a PRD', 'write a task list for ralph', 'break this down into stories', 'plan this feature for autonomous coding', 'help me write acceptance criteria', 'prepare this for a ralph loop', or mentions creating prd.json. Also trigger when the user asks how to structure work for AI agents, wants to decompose a feature into agent-executable tasks, or needs help writing CLAUDE.md / AGENTS.md companion files for autonomous coding. Covers PRD schema, extracted constraints, machine-verifiable acceptance criteria, anti-criteria, quantified criteria, story invalidation tracking, quality gates, progress tracking, failure prevention, and companion file creation for DevOps/cloud-native/infrastructure projects."
---

# Ralph PRD Creator

Create machine-executable PRDs that drive autonomous AI coding loops to reliable completion. A Ralph PRD is not a traditional spec — it's a **living data structure** the agent reads, executes against, and updates every iteration.

## Core Principle

**The PRD defines the end state. The agent figures out how to get there.** Describe WHAT done looks like with:

- acceptance criteria — what must happen
- anti-criteria — what must never happen
- quantitative criteria — thresholds, budgets, and limits when available

Do NOT describe HOW to implement it step by step.

## Working Style

- Keep the PRD high-signal. Skip ceremony.
- Extract constraints from the conversation before decomposing stories.
- Preserve exact user thresholds and hard prohibitions verbatim.
- Do not invent numeric targets just to make the PRD look precise.
- If a later story replaces an earlier requirement, record that explicitly so the agent does not treat obsolete constraints as still active.

## Reference Files

Load these based on the task:

- **PRD JSON schema and field reference**: See `references/prd-schema.md`
- **Writing story criteria (acceptance, anti, quantitative)**: See `references/acceptance-criteria.md`
- **Story sizing, splitting, and dependency ordering**: See `references/story-decomposition.md`
- **CLAUDE.md, AGENTS.md, and progress.txt patterns**: See `references/companion-files.md`
- **Common failure modes and prevention**: See `references/failure-modes.md`
- **Complete working example (Go/K8s)**: See `references/example-prd.json`

## Workflow: Creating a PRD from Scratch

### Step 1: GATHER REQUIREMENTS

Recover from the conversation first. Ask only for information still missing.

Extract these before writing the PRD:

- `EX-Q`: quantitative limits and thresholds
- `EX-P`: prohibitions and must-not rules
- `EX-R`: mandatory requirements
- `EX-I`: assumptions, conventions, and non-goals

Then ask for any missing high-impact gaps:

1. **What are you building?** (feature, tool, module, operator, pipeline)
2. **What's the tech stack?** (language, framework, database, infra tools)
3. **What does "done" look like?** (observable behaviors, outputs, endpoints)
4. **What's the scope?** (MVP, full feature, spike/prototype)
5. **What quality tooling exists?** (linter, type checker, test framework, CI)
6. **What should NOT be built?** (explicit non-goals prevent scope creep)
7. **What exact limits matter?** (latency, coverage, image size, concurrency, budgets)
8. **If this evolves an existing PRD: what older requirement or story is now obsolete?** (capture invalidation explicitly)

If the user provides a vague description ("build me a CLI tool"), use the interview technique: ask the agent-relevant questions the user hasn't thought about — error handling strategy, output formats, configuration approach, testing strategy.

### Step 2: READ ONLY THE NEEDED REFERENCES

Always load:

- `references/prd-schema.md` — to use the correct JSON structure
- `references/acceptance-criteria.md` — to write verifiable story criteria for the user's stack

Load only when needed:

- `references/story-decomposition.md` — when creating or resizing stories
- `references/companion-files.md` — when creating companion files
- `references/failure-modes.md` — when pressure-testing the PRD or reviewing an existing one
- `references/example-prd.json` — when the user wants an example or concrete pattern

### Step 3: EXTRACT THE CONSTRAINTS INTO THE PRD

Create a compact root-level `constraints` block in `prd.json` with only decision-relevant items:

- `quantitative` — explicit limits and thresholds from the conversation
- `prohibitions` — must-not rules and scope boundaries
- `requirements` — hard requirements the agent must satisfy
- `assumptions` — implicit conventions, defaults, and non-goals

Rules:

- Prefer exact values from the conversation.
- If the user gave a relative requirement but no number, convert it into a measurable state when possible.
- Do not invent arbitrary numbers.
- If no quantitative constraint exists, leave the relevant list empty instead of fabricating one.

### Step 4: DECOMPOSE INTO STORIES

Follow the decomposition rules in `references/story-decomposition.md`:

1. Identify the real dependency order and prefer the smallest complete slice that can pass on its own
2. Split into stories that each fit one agent context window (1-3 file changes, describable in 2-3 sentences)
3. Set `dependsOn` to enforce ordering
4. Assign priority numbers (lower = higher priority = executed first)
5. Assign effort labels (low/medium/high) for iteration estimation

### Step 5: WRITE STORY CRITERIA

For each story, write criteria following `references/acceptance-criteria.md`:

1. Write `acceptanceCriteria` for what must happen
2. Write `antiCriteria` for what must never happen
3. Write `quantitativeCriteria` for budgets, thresholds, and numeric limits when the conversation or tooling supports them
4. Append the project's quality gates from the user's tooling to `acceptanceCriteria` on EVERY story
5. Verify every criterion is machine-checkable (a command that returns pass/fail or a concrete observable state)
6. Check for vague language — "works correctly", "handles edge cases", "good UX" are NEVER acceptable

Minimum bar:

- Every non-trivial story should include at least one anti-criterion.
- Add quantitative criteria whenever the conversation, existing tooling, or the domain gives a real number.
- If a story has no honest numeric threshold, keep `quantitativeCriteria` empty rather than guessing.

### Step 6: TRACK INVALIDATED STORIES EXPLICITLY

When a new story replaces or makes an earlier story obsolete, add `supersedes` to the new story.

Use it when:

- a temporary requirement is no longer valid
- a later design decision replaces an earlier one
- an old story would otherwise create false objections during later iterations

Rules:

- Prefer putting the relationship on the new story (`supersedes`) rather than mutating history everywhere.
- Include the reason, not just the story ID.
- Use `supersedes` only when the newer story fully replaces or invalidates the older one.
- Later stories win over superseded earlier stories when they conflict.
- Do not use `supersedes` for normal dependency flow; use it only for true invalidation or replacement.

### Step 7: WRITE COMPANION FILES

Create the supporting files per `references/companion-files.md`:

1. **CLAUDE.md or AGENTS.md** — tech stack, conventions, MUST/MUST NOT rules, non-goals
2. **progress.txt** — empty file, will be populated by the agent
3. **Makefile or task runner** — with targets referenced in acceptance criteria

### Step 8: VALIDATE THE PRD

Run through this checklist before delivering:

- [ ] Every story fits in one context window (1-3 file changes)
- [ ] Root `constraints` block captures the conversation's important thresholds, prohibitions, requirements, and assumptions
- [ ] Every acceptance criterion is a runnable command or concrete observable state
- [ ] Every non-trivial story has at least one anti-criterion
- [ ] Quantitative criteria include exact thresholds when available and stay empty when none exist
- [ ] No vague criteria ("works correctly", "handles edge cases", "good UX")
- [ ] Project quality gates from the user's stack appear on EVERY story
- [ ] `dependsOn` creates a valid DAG (no circular dependencies)
- [ ] `supersedes` appears only where a later story truly replaces an earlier one
- [ ] Stories ordered by real dependency flow, with small complete slices preferred over horizontal batching when practical
- [ ] Non-goals explicitly listed in CLAUDE.md
- [ ] Tech stack fully specified (no ambiguous choices left to the agent)
- [ ] `branchName` is kebab-case and prefixed with `ralph/`
- [ ] All stories start with `"passes": false`
- [ ] Effort labels assigned for iteration estimation

### Step 9: DELIVER

Output these files:

1. **prd.json** — the structured PRD
2. **CLAUDE.md** (or AGENTS.md) — project constraints and conventions
3. **Makefile** (or equivalent) — build/test/lint commands referenced in criteria
4. Optionally: **progress.txt** — empty, ready for agent use
5. Optionally: **.golangci-lint.yaml** / **.eslintrc** / linter config — quality tooling

Present a summary: total stories, rough iteration range, dependency graph overview, extracted constraints summary, any superseded stories, and any risks or ambiguities the user should resolve before running.

## Workflow: Reviewing an Existing PRD

When the user provides an existing PRD for review:

1. Load `references/prd-schema.md` and validate the JSON structure
2. Load `references/acceptance-criteria.md` and check acceptance, anti-, and quantitative criteria for vagueness or loopholes
3. Load `references/story-decomposition.md` and check story sizing
4. Load `references/failure-modes.md` and scan for known anti-patterns
5. Check whether root constraints from the conversation were actually preserved in the PRD
6. Check whether superseded stories are tracked clearly enough to avoid obsolete requirements blocking future work
7. Report issues using the validation checklist from Step 8
8. Suggest specific fixes with before/after examples

## Quick Reference: The 12 Rules

These are the most common mistakes. Check them first:

1. **JSON, not Markdown** — agents are less likely to edit JSON inappropriately
2. **One story = one context window** — if you can't describe the change in 2-3 sentences, split it
3. **Extract constraints first** — capture thresholds, prohibitions, requirements, assumptions before story writing
4. **Acceptance + anti + quantitative** — every story should say what must happen, what must not happen, and which limits matter
5. **Commands, states, thresholds — not adjectives** — criteria must be testable, inspectable, or measurable
6. **Quality gates on EVERY story** — append the project's real build/test/lint/validate/plan checks from the user's stack
7. **Explicit tech stack** — agents have no opinions; without constraints they pick randomly
8. **Non-goals listed** — agents cannot infer from omission; explicitly exclude unwanted features
9. **MUST/MUST NOT language** — "consider using X" gets ignored; "MUST use X, MUST NOT use Y" gets followed
10. **Track invalidation explicitly** — if a later story replaces an earlier one, add `supersedes`
11. **Notes field for inter-iteration memory** — agents write discoveries here for future iterations
12. **Set iteration caps** — infinite loops with stochastic systems burn money and produce garbage
