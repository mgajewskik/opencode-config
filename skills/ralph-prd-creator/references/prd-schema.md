# PRD JSON Schema Reference

## Why JSON, Not Markdown

Anthropic's research on long-running agents found that agents are less likely to inappropriately modify JSON files compared to Markdown. Markdown PRDs get subtly edited — fields reworded, criteria softened, stories reordered. JSON resists this because the structure is rigid and parseable.

## Root Schema

```json
{
  "project": "string — human-readable project name",
  "branchName": "string — kebab-case, prefixed with ralph/",
  "description": "string — one paragraph describing the feature and tech stack",
  "constraints": {
    "quantitative": ["exact thresholds and numeric limits from the conversation"],
    "prohibitions": ["what must never happen"],
    "requirements": ["what must happen"],
    "assumptions": ["defaults, conventions, and non-goals that matter"]
  },
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

**constraints**: Compact extraction of the conversation's decision-relevant constraints. Keep it high-signal only.

- `quantitative`: explicit numeric thresholds, budgets, concurrency limits, coverage targets, size limits, latency SLOs
- `prohibitions`: scope boundaries, must-not rules, forbidden dependencies, forbidden behaviors
- `requirements`: hard requirements that must be satisfied somewhere in the PRD
- `assumptions`: implicit defaults, conventions, and non-goals that shape implementation

If a category has nothing useful, use an empty array rather than inventing filler.

## User Story Schema

The example below uses Go-flavored quality gates for illustration. Replace them with the real quality gates for your stack.

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
  "antiCriteria": [
    "Must not modify or weaken existing test assertions",
    "Must not add dependencies outside the approved stack"
  ],
  "quantitativeCriteria": [
    "Coverage on pkg/handler remains >=80%",
    "p95 latency stays <200ms for 1000 records"
  ],
  "effort": "low | medium | high",
  "priority": 1,
  "passes": false,
  "notes": "",
  "dependsOn": [],
  "supersedes": [
    {
      "storyId": "US-000",
      "reason": "Replaces an earlier temporary or obsolete requirement"
    }
  ]
}
```

### Field Details

**id**: Sequential identifier. Format: `US-001`, `US-002`, etc. Some implementations use `TASK-001`. Be consistent within a PRD.

**title**: What the agent sees first when scanning for the next task. Make it specific and actionable. Good: "Define RBACBinding CRD with validation markers". Bad: "Set up the CRD stuff".

**description**: User story format ("As a... I want... so that...") gives the agent purpose and context. The "so that" clause is important — it tells the agent WHY this matters, which helps it make better implementation decisions.

**acceptanceCriteria**: The most critical field. This is how the agent knows it's done. Rules:
- Every item must be machine-verifiable (a command or concrete observable state)
- Functional criteria FIRST, quality gates LAST
- Project quality gates from the user's stack MUST appear on every story
- See `references/acceptance-criteria.md` for language-specific examples

**antiCriteria**: Explicit failure boundaries. Use this field for things the agent must NOT do while satisfying the story. Rules:

- Include at least one anti-criterion for every non-trivial story
- Prefer concrete non-occurrence checks over vague warnings
- Good examples: test files must not shrink, forbidden dependency must not appear, existing endpoint response must not change

**quantitativeCriteria**: Numeric thresholds and measurable limits. Use this field when the conversation, domain, or tooling provides a real number. Rules:

- Preserve user-provided numbers verbatim
- If the user gave no real threshold, leave the array empty instead of inventing one
- Prefer checks with explicit units: ms, MB, %, seconds, concurrency counts

**effort**: Estimation for iteration planning.
- `low`: Scaffolding, config, single-file changes. Usually 1 iteration.
- `medium`: New logic, new module, 2-3 file changes. Usually 1-2 iterations.
- `high`: Complex logic, integration tests, cross-cutting changes. Usually 2-3 iterations.

**priority**: Integer. Lower number = higher priority = executed first. The agent picks the highest-priority story where `passes: false` and all `dependsOn` stories have `passes: true`. Use priority to enforce dependency ordering when stories at the same layer could go in either order.

**passes**: Boolean. Starts `false`. Agent flips to `true` after the story's acceptance, anti-, and quantitative criteria are satisfied. You can flip it back to `false` to force a redo (add notes explaining why). The loop exits only when ALL stories have `passes: true`.

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

**supersedes**: Optional list of earlier stories this story invalidates or replaces. Use it only when a later story makes an earlier requirement obsolete, not for normal dependency flow.

```json
[
  {
    "storyId": "US-003",
    "reason": "Replaces the temporary filesystem config approach with S3-backed config"
  }
]
```

Canonical direction is forward-looking: put `supersedes` on the new story. The later story wins if its requirements conflict with the superseded story.

Use this field only for full story replacement or invalidation. If only one old criterion became obsolete, split that temporary behavior into its own story or rewrite the old story instead of superseding a mostly-still-valid story.

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

// ❌ WRONG: inventing fake quantitative precision
{ "quantitativeCriteria": ["Response time < 137ms"] }

// ❌ WRONG: using supersedes as a normal dependency marker
{ "supersedes": [{ "storyId": "US-001", "reason": "Needs US-001 first" }] }
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

# See supersession relationships
cat prd.json | jq '.userStories[] | select((.supersedes // []) | length > 0) | {id, supersedes}'
```

## Iteration Estimation

Do not invent math from `low | medium | high` effort labels. Use a rough range based on story count and effort mix.

| Stories | Average Effort | Estimated Iterations | Suggested Max |
|---------|---------------|---------------------|---------------|
| 4-6     | low           | 6-8                 | 15            |
| 6-8     | medium        | 10-14               | 25            |
| 8-12    | mixed         | 14-20               | 35            |
| 12+     | mixed         | 20+                 | 50            |

Treat these as planning bands, not precise forecasts. Always set a max iteration cap. Infinite loops with stochastic systems burn money.
