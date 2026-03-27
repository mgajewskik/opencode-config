# Story Sizing, Splitting, and Dependency Ordering

## The Context Window Constraint

Each Ralph iteration spawns a fresh agent with no memory of previous iterations. The agent must: read the PRD, read progress.txt, read CLAUDE.md, understand the codebase via git, pick a story, implement it, run tests, commit, and update the PRD — all within a single context window.

**Rule of thumb**: If you can't describe the change in 2-3 sentences, it's too big for one story.

**Practical limit**: A story should produce 1-3 file changes with clear inputs and outputs. Effective working context after accounting for CLAUDE.md, MCP servers, and tool definitions can be as low as ~120k tokens.

## Stories That Are Too Big (Split These)

| Oversized Story | Split Into |
|----------------|-----------|
| "Implement the entire RBAC operator" | This is a PRD, not a story |
| "Set up CI/CD pipeline" | 1) GitHub Actions workflow skeleton, 2) test job, 3) build + push job, 4) deploy job |
| "Create Terraform module for VPC" | 1) VPC + subnets, 2) NAT + routes, 3) security groups, 4) flow logs |
| "Add authentication" | 1) user model/schema, 2) registration endpoint, 3) login endpoint + JWT, 4) middleware |
| "Write all the tests" | One test story per feature story, or bundle tests with each feature |

## Stories That Are Too Small (Merge These)

| Undersized Stories | Merge Into |
|-------------------|-----------|
| "Create types.go" → "Add Spec field" → "Add Status field" | "Define CRD types with validation markers" |
| "Add one test case" | Bundle with implementation story |
| "Fix a typo in README" | Append to documentation story |
| "Add import statement" | Not a story at all |

## Right-Sized Stories (Examples by Domain)

### Kubernetes / Operator

- "Scaffold kubebuilder project with CRD group/version/kind"
- "Define CRD spec types with kubebuilder validation markers and generate manifests"
- "Implement Reconcile loop: create ClusterRoleBinding from CRD spec"
- "Add finalizer for cleanup on CRD deletion"
- "Write envtest integration test for full reconcile cycle"
- "Add RBAC ClusterRole for the controller manager"

### Terraform / Infrastructure

- "Create VPC module with configurable CIDR, public/private subnets, AZs"
- "Add NAT gateway and route tables for private subnets"
- "Create EKS cluster module with managed node group"
- "Add security groups for RDS with least-privilege ingress"
- "Write Terratest integration test for VPC module"

### Go CLI Tool

- "Initialize project with Cobra CLI skeleton and root/subcommand"
- "Implement kubeconfig client initialization with context switching"
- "Add pod discovery across namespaces using fake clientset for tests"
- "Implement concurrent health probing with errgroup"
- "Add JSON and table output formatters with exit code semantics"
- "Write Dockerfile and README with usage examples"

### Python / Data Pipeline

- "Create Airflow DAG skeleton with config-driven schedule"
- "Implement extraction task: read from source API with retry logic"
- "Implement transformation task: normalize schema with Pydantic models"
- "Implement load task: upsert to PostgreSQL with conflict resolution"
- "Write pytest fixtures with mocked API responses"
- "Add monitoring: task failure alerts via SNS"

## Dependency Ordering

Stories MUST be ordered by real dependencies. The agent picks the highest-priority story with `passes: false` whose dependencies are all satisfied.

### Common Dependency Pattern

```
1. Scaffolding / Project Setup     (priority: 1)
   └── Module init, directory structure, Makefile, linter config

2. Types / Schema / Models         (priority: 2-3)
   └── Data structures, CRD types, database schemas, API types

3. Core Logic / Business Rules     (priority: 3-5)
   └── Controllers, handlers, service layer, algorithms

4. Integration / Wiring            (priority: 5-7)
   └── Connecting components, routes, middleware, config loading

5. Validation / Edge Cases         (priority: 7-8)
   └── Error handling, input validation, boundary conditions

6. Polish / Documentation          (priority: 8-10)
   └── README, Dockerfile, CI config, examples
```

Use this pattern only when it matches the real dependency graph. Do not force a layer-first plan if a smaller independently verifiable slice would be better.

### Parallel Tracks

Some stories at the same layer can run in either order. Use `dependsOn` to express this — don't artificially serialize them.

```json
{
  "id": "US-004",
  "title": "JSON output formatter",
  "dependsOn": ["US-003"],
  "priority": 4
},
{
  "id": "US-005",
  "title": "Namespace filtering",
  "dependsOn": ["US-003"],
  "priority": 5
}
```

US-004 and US-005 both depend on US-003 but not on each other. The agent picks US-004 first (lower priority number), but either order would work.

### Cross-Cutting Stories

Some stories touch multiple layers. Handle them by:

1. **Splitting vertically**: Instead of "add logging everywhere", create "add structured logging to controller" as part of the controller story's criteria
2. **Making them depend on all touched layers**: If a cross-cutting story really must exist, set `dependsOn` to include all stories it might affect
3. **Placing them late**: Cross-cutting concerns (monitoring, auth, logging) are safer to add after core logic is stable

## Splitting Strategies

### By Smallest Verifiable Slice (Preferred)

Prefer the smallest complete slice that leaves the codebase in a working state after each story.

Often that is a vertical slice:

```
US-001: CRD type + controller + test for RBACBinding
US-002: CRD type + controller + test for NamespaceQuota
US-003: Shared webhook validation
```

But layer-first stories are acceptable when the stack has hard sequencing constraints or scaffolding-heavy setup:

```
US-001: Project scaffolding + Makefile + lint config
US-002: Core types/schema
US-003: Core controller/handler logic
US-004: Integration wiring
```

Rule: avoid horizontal batching that creates large, non-verifiable work packets such as "all controllers" or "all tests".

### By Risk

Put risky/uncertain stories early. If story 3 turns out to be impossible, you want to discover that at iteration 3, not iteration 15.

### By Test Boundary

Each story should have a clear test boundary. If you can't write a test for a story in isolation, it's either too small (merge it) or too entangled (split differently).

## Estimating Story Count

Use the rough iteration-range guidance in `references/prd-schema.md` as the canonical source.

For projects with 15+ stories, consider splitting into multiple PRDs that build on each other (phase 1, phase 2) rather than one giant PRD.

## Mid-Loop Adjustments

The PRD is a living document. You can adjust it between iterations:

- **Story too big**: Set `passes` back to `false`, split into two stories, add notes explaining the split
- **Missing feature**: Add a new story with appropriate `dependsOn` and `priority`
- **Wrong approach**: Set `passes` back to `false`, update notes with "Previous implementation used X, which doesn't work because Y. Use Z instead."
- **Story done but wrong**: Set `passes` to `false`, add specific notes about what's wrong
- **Scope change**: Add or remove stories, adjust priorities, and add `supersedes` when a new story invalidates an earlier one

The agent reads the PRD fresh every iteration, so your changes take effect immediately.
