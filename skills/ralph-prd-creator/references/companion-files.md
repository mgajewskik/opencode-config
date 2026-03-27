# Companion Files: CLAUDE.md, AGENTS.md, and progress.txt

## Why Companion Files Matter

The PRD defines WHAT to build. Companion files define HOW the project works, WHAT decisions are locked, and WHAT the agent has learned from previous iterations. Without them, each fresh agent instance makes its own decisions about libraries, patterns, and conventions — and those decisions may differ every iteration.

## CLAUDE.md

Claude Code reads this file automatically on every invocation. It's your primary mechanism for constraining agent behavior.

### Structure

```markdown
# Project: [name]

## Tech Stack (DO NOT DEVIATE)
- [Language and version]
- [Framework and version]
- [Database and version]
- [Key libraries — name each one]

## MUST Rules
- [Absolute requirements the agent MUST follow]
- [Use imperative language: "MUST use", not "should consider"]

## MUST NOT Rules
- [Things the agent MUST NOT do]
- [Explicit exclusions prevent scope creep]

## Build & Test Commands
- Build: [exact command]
- Test: [exact command]
- Lint: [exact command]
- [Any other commands referenced in acceptance criteria]

## Architecture / Conventions
- [Directory layout rules]
- [Naming conventions]
- [Error handling patterns]
- [Testing patterns]

## Non-Goals (DO NOT IMPLEMENT)
- [Feature A — will be done in phase 2]
- [Feature B — out of scope entirely]
- [Feature C — explicitly excluded]
```

### Writing Effective Rules

**Use MUST/MUST NOT, not suggestions.** Research shows MUST/MUST NOT language achieves 70-90% compliance. Phrases like "consider using" or "preferably" get ignored.

```markdown
❌ "Consider using structured logging"
✅ "MUST use slog for all logging. MUST NOT use logrus, zap, or fmt.Printf for log output."

❌ "Try to keep functions small"
✅ "MUST NOT create functions longer than 50 lines. Split into helpers."

❌ "It would be nice to have table-driven tests"
✅ "MUST use table-driven tests with t.Run subtests. MUST NOT write single-case test functions."
```

**Constrain library choices explicitly.** Without this, the agent picks whatever it wants:

```markdown
## Allowed Dependencies
- HTTP router: chi v5 (MUST NOT use gin, echo, fiber, gorilla/mux)
- SQL: sqlc for queries (MUST NOT use gorm, sqlx raw queries)
- Config: viper (MUST NOT use envconfig, kelseyhightower/envconfig)
- Logging: slog (MUST NOT use logrus, zap, zerolog)

## Adding New Dependencies
MUST NOT add dependencies not listed above without explicit approval noted in prd.json story notes.
```

**Non-goals prevent the most expensive failure mode** — the agent building features you didn't ask for:

```markdown
## Non-Goals (DO NOT IMPLEMENT)
- No web UI or dashboard (this is a CLI tool only)
- No Helm chart (deploy via kustomize)
- No multi-cluster support (single cluster only in this phase)
- No Prometheus metrics (future phase, not now)
- No user authentication (the operator uses ServiceAccount RBAC)
- No database (all state lives in Kubernetes CRDs)
```

### Length Budget

Keep CLAUDE.md **under 500 lines**. Frontier LLMs follow approximately 150-200 instructions with reasonable consistency before performance degrades uniformly. Every line competes for the agent's attention budget. Prefer:

- Linters/formatters for style enforcement (100% compliance, zero attention cost)
- Short, absolute rules over long explanations
- Links to external docs rather than inline documentation

### Go Project Template

```markdown
# Project: kube-healthcheck

## Tech Stack (DO NOT DEVIATE)
- Go 1.23
- Cobra for CLI framework
- client-go v0.31 for Kubernetes client
- slog for structured logging
- testify for test assertions
- golangci-lint for linting

## MUST Rules
- MUST wrap all errors with fmt.Errorf("context: %w", err)
- MUST use table-driven tests with t.Run
- MUST use context.Context as first parameter for functions that do I/O
- MUST use structured logging with slog (not fmt.Printf for debugging)

## MUST NOT Rules
- MUST NOT use global variables (pass dependencies via constructors)
- MUST NOT use init() functions
- MUST NOT add dependencies not listed in Tech Stack without approval
- MUST NOT modify existing test assertions (fix implementation, not tests)

## Build & Test
- make build → go build -o bin/kube-healthcheck ./cmd/
- make test → go test ./... -v -race -count=1
- make lint → golangci-lint run
- make all → build + test + lint

## Architecture
- cmd/ — CLI entry points (main.go, root.go, check.go)
- internal/kube/ — Kubernetes client, discovery, probing
- internal/report/ — output formatting (JSON, table)
- internal/config/ — configuration loading

## Non-Goals
- No web UI
- No Prometheus metrics
- No persistent state or database
- No multi-cluster support
```

### Terraform Project Template

```markdown
# Project: terraform-aws-vpc

## Tech Stack (DO NOT DEVIATE)
- Terraform >= 1.9
- AWS provider ~> 5.0
- Terratest for integration tests (Go)
- tflint for linting
- tfsec for security scanning

## MUST Rules
- MUST use variables for all configurable values (no hardcoded strings)
- MUST include description for every variable and output
- MUST use locals for computed values
- MUST tag all resources with var.tags merged with module-specific tags

## MUST NOT Rules
- MUST NOT use count for conditional resources (use for_each)
- MUST NOT hardcode AWS region or account ID
- MUST NOT use deprecated resource types

## Commands
- terraform fmt -check -recursive
- terraform validate
- tflint
- tfsec .
- cd test && go test -v -timeout 30m

## Non-Goals
- No Transit Gateway (separate module)
- No VPN connections
- No custom DHCP options
```

## AGENTS.md

AGENTS.md is the cross-tool equivalent of CLAUDE.md, recognized by Codex, Cursor, Copilot, Gemini CLI, and others. If you use multiple AI tools, put shared instructions in AGENTS.md and tool-specific features in CLAUDE.md.

The format is identical to CLAUDE.md. Some teams use both:
- `AGENTS.md` — universal rules (tech stack, conventions, non-goals)
- `CLAUDE.md` — Claude-specific features (@ imports, MCP server references, skill references)

## progress.txt

An append-only log of what happened in each iteration. The agent reads this at the start of every iteration and writes to it at the end.

### Critical Instruction

Your prompt to the agent MUST include the word **"append"** when referencing progress.txt. Without it, agents overwrite previous entries, destroying the memory chain.

```
"After completing a story, APPEND a summary to progress.txt. Do NOT overwrite existing content."
```

### Format

```markdown
## Iteration 1 — US-001: Scaffold kubebuilder project
- Ran kubebuilder init with domain=example.com
- Created Makefile targets: build, test, lint, manifests
- All acceptance criteria pass
- Codebase Pattern: Run make generate before make manifests (order matters)

## Iteration 2 — US-002: Define RBACBinding CRD
- Created api/v1/rbacbinding_types.go
- Added //+kubebuilder:validation:Required markers
- Discovered: kubebuilder v4 places controllers in internal/controller/ (not controllers/)
- All acceptance criteria pass
- Codebase Pattern: CRD changes require make generate && make manifests (both, in order)

## Iteration 3 — US-003: Reconcile loop (attempt 1 — FAILED)
- Implemented basic Reconcile in internal/controller/rbacbinding_controller.go
- Tests fail: envtest requires KUBEBUILDER_ASSETS env var
- Notes: Need to install envtest binaries first, add to Makefile
- Setting passes=false, will retry next iteration
```

The "Codebase Pattern" entries are read FIRST by future iterations. They accumulate project-specific knowledge.

### Guardrails File (Advanced)

Some implementations maintain a separate `.ralph/guardrails.md` for failure-driven rules:

```markdown
### Sign: Check existing methods before adding new ones
- Trigger: Adding a new Reconcile method
- Instruction: First check if Reconcile already exists in the controller
- Added after: Iteration 4 — duplicate method caused compilation failure

### Sign: Always run make generate before make manifests
- Trigger: Changing CRD types
- Instruction: Run make generate first, then make manifests
- Added after: Iteration 2 — stale generated code caused test failures
```

These accumulate from observed failures and become the project's institutional memory.

## Makefile / Task Runner

The Makefile is the glue between acceptance criteria and actual commands. Set it up BEFORE running Ralph. The agent references these targets in every iteration.

```makefile
.PHONY: build test lint all clean

build:
	go build -o bin/$(PROJECT) ./cmd/

test:
	go test ./... -v -race -count=1

lint:
	golangci-lint run

manifests:
	make generate
	controller-gen crd paths="./..." output:crd:artifacts:config=config/crd/bases

generate:
	controller-gen object paths="./..."

all: lint test build
```

**Key principle**: Every command referenced in any acceptance criterion must have a Makefile target or be directly runnable. The agent should never need to guess how to build or test.
