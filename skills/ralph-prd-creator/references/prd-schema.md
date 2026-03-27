# PRD JSON Schema Reference

## Why JSON, Not Markdown

Anthropic's research on long-running agents found that agents are less likely to inappropriately modify JSON files compared to Markdown. Markdown PRDs get subtly edited — fields reworded, criteria softened, stories reordered. JSON resists this because the structure is rigid and parseable.

## Root Schema

```json
{
  "project": "string — human-readable project name",
  "branchName": "string — kebab-case, prefixed with ralph/",
  "description": "string — one paragraph describing the feature and tech stack",
  "userStories": [ "...array of story objects..." ]
}
```

### Field Details

**project**: Human-readable name. Used in commit messages and progress logging.

**branchName**: MUST be kebab-case, MUST be prefixed with `ralph/`. Examples: `ralph/k8s-operator-rbac`, `ralph/terraform-vpc-module`, `ralph/cli-health-checker`. The agent creates/switches to this branch automatically.

**description**: Critical context field. Include:
- What the feature does (one sentence)
- Target tech stack (language, framework, key libraries)
- Scope boundary (MVP, phase 1, spike)

This field is read by the agent on EVERY iteration. Keep it under 200 words.

## User Story Schema

```json
{
  "id": "US-001",
  "title": "Short descriptive title (max 10 words)",
  "description": "As a [role], I want [feature] so that [benefit]",
  "acceptanceCriteria": [
    "Functional criterion 1 — concrete, observable",
    "Functional criterion 2 — concrete, observable",
    "Quality gate: go build ./... exits 0",
    "Quality gate: go test ./... -v passes",
    "Quality gate: golangci-lint run exits 0"
  ],
  "effort": "low | medium | high",
  "priority": 1,
  "passes": false,
  "notes": "",
  "dependsOn": []
}
```

### Field Details

**id**: Sequential identifier. Format: `US-001`, `US-002`, etc. Some implementations use `TASK-001`. Be consistent within a PRD.

**title**: What the agent sees first when scanning for the next task. Make it specific and actionable. Good: "Define RBACBinding CRD with validation markers". Bad: "Set up the CRD stuff".

**description**: User story format ("As a... I want... so that...") gives the agent purpose and context. The "so that" clause is important — it tells the agent WHY this matters, which helps it make better implementation decisions.

**acceptanceCriteria**: The most critical field. This is how the agent knows it's done. Rules:
- Every item must be machine-verifiable (a command or concrete observable state)
- Functional criteria FIRST, quality gates LAST
- Quality gates (build, test, lint) MUST appear on every story
- See `references/acceptance-criteria.md` for language-specific examples

**effort**: Estimation for iteration planning.
- `low`: Scaffolding, config, single-file changes. Usually 1 iteration.
- `medium`: New logic, new module, 2-3 file changes. Usually 1-2 iterations.
- `high`: Complex logic, integration tests, cross-cutting changes. Usually 2-3 iterations.

**priority**: Integer. Lower number = higher priority = executed first. The agent picks the highest-priority story where `passes: false` and all `dependsOn` stories have `passes: true`. Use priority to enforce dependency ordering when stories at the same layer could go in either order.

**passes**: Boolean. Starts `false`. Agent flips to `true` after all acceptance criteria pass. You can flip it back to `false` to force a redo (add notes explaining why). The loop exits only when ALL stories have `passes: true`.

**notes**: Agent-writable field for inter-iteration memory. The agent records:
- What was accomplished
- Patterns discovered ("kubebuilder v4 changed the scaffold layout")
- Gotchas and workarounds
- Build quirks for future iterations

You can also pre-populate notes with hints: "Use the existing helper in internal/util/retry.go for backoff logic".

**dependsOn**: Array of story IDs that must be complete (`passes: true`) before this story can be selected. Creates a dependency DAG. Common patterns:
- `[]` — no dependencies, can be picked first
- `["US-001"]` — depends on scaffolding
- `["US-003", "US-004"]` — depends on multiple prior stories

### Schema Anti-Patterns (DO NOT USE)

```json
// ❌ WRONG: wrapping in a "prd" object
{ "prd": { "userStories": [...] } }

// ❌ WRONG: using "tasks" instead of "userStories"
{ "tasks": [...] }

// ❌ WRONG: using "status" instead of "passes"
{ "userStories": [{ "id": "US-001", "status": "open" }] }

// ❌ WRONG: nested phases/milestones
{ "phases": [{ "stories": [...] }] }
```

The PRD MUST be a flat JSON object with `userStories` at the root level. Even if you think in phases, flatten everything into a single array and use `dependsOn` + `priority` for ordering.

## Progress Tracking

Monitor progress without interrupting the loop:

```bash
# See story status
cat prd.json | jq '.userStories[] | {id, title, passes}'

# See learnings
cat progress.txt

# See commits from the loop
git log --oneline -20

# Count remaining work
cat prd.json | jq '[.userStories[] | select(.passes == false)] | length'
```

## Iteration Estimation

Total iterations ≈ (sum of story efforts) × 1.3 safety factor

| Stories | Average Effort | Estimated Iterations | Suggested Max |
|---------|---------------|---------------------|---------------|
| 4-6     | low           | 6-8                 | 15            |
| 6-8     | medium        | 10-14               | 25            |
| 8-12    | mixed         | 14-20               | 35            |
| 12+     | mixed         | 20+                 | 50            |

Always set a max iteration cap. Infinite loops with stochastic systems burn money.
