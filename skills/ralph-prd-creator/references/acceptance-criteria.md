# Writing Machine-Verifiable Acceptance Criteria

## The Golden Rule

Every acceptance criterion must be either:
1. **A command** that returns a clear pass/fail (exit code 0 = pass)
2. **A concrete observable state** the agent can verify by inspection

If the agent cannot determine success by running a command or checking a file, the criterion is useless.

## Vague vs Verifiable

| ❌ Vague (NEVER use)               | ✅ Verifiable (ALWAYS use)                                         |
|-------------------------------------|--------------------------------------------------------------------|
| "Works correctly"                   | "`make test` exits 0 with no failures"                             |
| "Handles edge cases"               | "Returns 400 with JSON error when `name` field is missing"         |
| "Good error handling"              | "All errors wrapped with `fmt.Errorf('context: %w', err)`"        |
| "Well-structured code"             | "`golangci-lint run` exits 0"                                      |
| "Easy to use"                      | "`./tool --help` prints usage with all flags documented"           |
| "Secure"                           | "Secrets loaded from env vars, not hardcoded in source"            |
| "Fast"                             | "Benchmark `go test -bench=. -benchtime=3s` shows <10ms/op"       |
| "Handles large files"              | "Processes 1GB input file without OOM (tested with `ulimit -v`)"  |
| "Good UX"                          | "CLI exits 1 on error, exits 0 on success, all output to stderr"  |
| "Properly tested"                  | "`go test -cover ./...` shows >80% coverage on pkg/handler"       |

## Quality Gates (append to EVERY story)

Quality gates are the commands that keep the entire codebase healthy. They MUST appear in the acceptance criteria of every single story, regardless of what the story does. This creates backpressure — the agent can't break story 3 while implementing story 5.

### Go Projects

```
"go build ./... exits 0",
"go vet ./... exits 0",
"go test ./... -v -count=1 passes with no failures",
"golangci-lint run exits 0"
```

Optional additions for critical projects:
```
"go test -race ./... passes (no race conditions)",
"go test -cover ./... shows >80% coverage"
```

### Python Projects

```
"mypy --strict passes with no errors",
"ruff check . exits 0",
"pytest -v --tb=short exits 0 with no failures"
```

Optional:
```
"pytest --cov=src --cov-fail-under=80 passes",
"bandit -r src/ exits 0 (security scan)"
```

### TypeScript/Node Projects

```
"pnpm typecheck (or npx tsc --noEmit) exits 0",
"pnpm lint (or npx eslint .) exits 0",
"pnpm test (or npx vitest run) exits 0"
```

Optional:
```
"pnpm build exits 0 with no warnings",
"npx prettier --check . exits 0"
```

### Terraform Projects

```
"terraform fmt -check -recursive exits 0",
"terraform validate exits 0",
"tflint exits 0"
```

Optional:
```
"terraform plan -detailed-exitcode returns 0 or 2 (not 1)",
"tfsec . exits 0 (security scan)",
"checkov -d . passes all checks"
```

### Kubernetes / Helm Projects

```
"kubectl apply --dry-run=server -f manifests/ exits 0",
"kubeconform -strict manifests/ exits 0",
"helm template . | kubeconform -strict exits 0"
```

### Docker Projects

```
"docker build -t <image-name> . exits 0",
"docker run --rm <image-name> --help exits 0",
"Final image size < 50MB (check with docker images)"
```

## Functional Criteria Patterns

### API / HTTP Endpoints

```
"GET /health returns 200 with body {\"status\": \"ok\"}",
"POST /api/users with valid JSON returns 201 with Location header",
"POST /api/users with missing 'email' returns 400 with error message",
"GET /api/users/nonexistent returns 404",
"All endpoints return Content-Type: application/json"
```

### CLI Tools

```
"Running `./tool --help` prints usage with all documented flags",
"Running `./tool check` with valid kubeconfig exits 0",
"Running `./tool check` with invalid kubeconfig exits 1 with descriptive error",
"Running `./tool check --output=json` produces valid JSON to stdout",
"Running `./tool check --output=table` produces aligned columns",
"Exit code 0 when all checks pass, exit code 1 when any fail"
```

### Database / Migration

```
"Migration file exists in migrations/ with timestamp prefix",
"migrate up applies without error on clean database",
"migrate down fully reverses the migration",
"Schema matches expected columns (verified with SQL query in test)"
```

### Kubernetes Operators / Controllers

```
"CRD spec includes fields: targetNamespace, roleRef, subjects[]",
"make manifests generates valid CRD YAML",
"Reconcile loop creates ClusterRoleBinding matching CRD spec",
"Reconcile returns RequeueAfter: 30s on transient errors (not Requeue: true)",
"envtest integration test verifies full reconcile cycle"
```

### Configuration / Environment

```
"Config loaded from --config flag, falls back to CONFIG_PATH env, then ./config.yaml",
"Missing required env var produces error naming the missing variable",
"All secrets loaded from environment variables, none hardcoded in source"
```

### File Structure / Scaffolding

```
"cmd/server/main.go exists with HTTP server startup",
"internal/handler/ directory exists for HTTP handlers",
"internal/repository/ directory exists for database access",
"Makefile has targets: build, test, lint, migrate-up, migrate-down",
"go.mod module path matches github.com/<user>/<project>"
```

## Criteria Ordering Within a Story

Order criteria from most specific to most general:

1. **File/structural criteria** — "file X exists with fields Y"
2. **Behavioral criteria** — "endpoint returns X when given Y"
3. **Error handling criteria** — "returns 400 when field missing"
4. **Quality gates** — build, test, lint (always last)

This ordering helps the agent prioritize: implement the structure first, then behavior, then edge cases, then verify everything passes.

## Testing Criteria Specifically

When a story involves writing tests:

```
"Unit test file exists at internal/handler/handler_test.go",
"Tests use table-driven pattern with t.Run subtests",
"Test covers happy path: valid input produces expected output",
"Test covers error path: invalid input returns expected error",
"Tests do NOT depend on external services (use mocks/fakes)",
"go test ./internal/handler/ -v passes with all subtests passing"
```

CRITICAL: Never write acceptance criteria that say "tests pass" without specifying WHAT is being tested. The agent will write trivial tests that assert `true == true` and declare victory.

## Anti-Patterns in Criteria Writing

### The "Make It Work" Anti-Pattern
```
❌ "The feature works as expected"
```
Expected by whom? The agent has no shared understanding of your expectations. Be explicit.

### The "Good Code" Anti-Pattern
```
❌ "Code follows best practices"
```
Which practices? Use linters to enforce style, not natural language criteria.

### The "Comprehensive" Anti-Pattern
```
❌ "All edge cases handled"
```
Name the edge cases. The agent cannot enumerate your domain's edge cases.

### The "Existing Tests" Anti-Pattern
```
❌ "All existing tests still pass"
```
This is actually fine as an ADDITIONAL criterion, but never as the ONLY criterion. Pair it with specific new test criteria.

### The "Performance" Anti-Pattern
```
❌ "Response time is fast"
```
Use benchmarks with specific thresholds: "Benchmark shows <10ms/op" or "Response under 200ms for 1000 records".
