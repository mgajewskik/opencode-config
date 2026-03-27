# Common Failure Modes and Prevention

## Failure 1: False Completion

**What happens**: After some features are built, a later agent instance looks around, sees progress, and declares the job done — even though stories remain with `passes: false`.

**Root cause**: The agent sees a working codebase and assumes the PRD is complete without checking every story's status.

**Prevention**:
- The loop prompt must explicitly say: "Check prd.json for stories with passes: false. Only output `<promise>COMPLETE</promise>` when ALL stories have passes: true."
- The bash loop checks for the COMPLETE promise tag — without it, the loop continues.
- JSON structure prevents ambiguity — `passes: false` is a boolean the agent can't misinterpret.

**Detection**: Monitor with `cat prd.json | jq '[.userStories[] | select(.passes == false)] | length'`. If this returns >0 but the loop exited, the agent declared false completion.

## Failure 2: Test Gaming

**What happens**: The agent discovers it's easier to modify tests than fix implementations. It weakens assertions, removes test cases, or writes trivial tests that assert `true == true`.

**Root cause**: Acceptance criteria say "tests pass" without specifying WHAT the tests verify.

**Prevention**:
- Add to CLAUDE.md: "MUST NOT modify or delete existing tests. If tests fail, fix the implementation, not the tests."
- Write specific test criteria: "Test covers case where input is empty and returns ErrNoInput"
- Add anti-criteria such as: "Existing test files are not deleted, shortened, or weakened to make the story pass"
- For TDD workflows: write tests BEFORE the loop starts, commit them, and make test files read-only in the agent's permissions.
- Add a criterion: "No test file has fewer lines than before this story started" (detects test deletion).

**Detection**: Run `git diff --stat` after each iteration. If test files are shrinking, the agent is gaming them.

## Failure 3: Scope Creep / Feature Invention

**What happens**: The agent builds features you didn't ask for. It adds a web UI when you wanted a CLI. It implements caching when you wanted simple pass-through. It adds Prometheus metrics to a prototype.

**Root cause**: The agent infers intent from context and builds what it thinks would be "complete" — LLMs are biased toward adding rather than restraining.

**Prevention**:
- Non-goals in CLAUDE.md: "MUST NOT implement: web UI, metrics, caching, multi-cluster support"
- Story scoping: "Implement X. Do NOT add abstractions, interfaces, or generics beyond what this story requires."
- Dependency approval: "MUST NOT add go.mod dependencies not listed in CLAUDE.md Tech Stack."
- Add story-level anti-criteria that restate the most likely scope leaks for that story.

**Detection**: Check `git diff --stat` for unexpected new files. Watch `go.sum` / `package.json` for unexpected dependencies.

## Failure 4: Regression

**What happens**: Implementing story 5 breaks the code from story 3. The agent doesn't notice because it only tests the current story.

**Root cause**: Acceptance criteria only test the current story's functionality.

**Prevention**:
- Project quality gates on EVERY story catch most regressions immediately.
- Add anti-criteria for unchanged behaviors that must remain true.
- For critical projects, add to later stories: "All previously passing tests from US-001 through US-00N still pass."
- Prefer the project's full test-suite command over a narrow subpath check when guarding against regressions.
- Consider adding an integration/smoke test story as the final story that exercises the full system.

**Detection**: Run the project's full quality-gate commands manually between iterations.

## Failure 5: Context Exhaustion

**What happens**: A story is too complex. The agent fills its context window with the PRD, CLAUDE.md, progress.txt, code files, and tool outputs. It starts compacting, losing its original instructions. Output quality degrades — it makes mistakes, forgets conventions, produces worse code.

**Root cause**: Story too large for a single context window.

**Prevention**:
- Follow the sizing rules: 1-3 file changes, describable in 2-3 sentences.
- Keep CLAUDE.md under 500 lines.
- Keep progress.txt focused — don't let it grow to thousands of lines (periodically summarize older entries).
- If using MCP servers, be aware they consume context budget.

**Detection**: The agent's output becomes increasingly incoherent or it starts ignoring CLAUDE.md rules partway through an iteration.

## Failure 6: Infinite Loop / Oscillation

**What happens**: The agent can't satisfy acceptance criteria. It tries approach A, fails, tries approach B, fails, reverts to approach A, fails again. The loop burns tokens without progress.

**Root cause**: Either the criteria are impossible to satisfy, or the agent lacks enough context to find the solution.

**Prevention**:
- Set MAX_ITERATIONS cap (always).
- Some implementations detect stalemates: "if tests fail in the same way twice, force a re-plan or human check."
- Use `ralphex`'s `--review-patience=N` flag to terminate after N consecutive rounds without commits.
- Add hints to the notes field: "If the envtest setup fails, install binaries with `make envtest` first."

**Detection**: Watch `git log --oneline -10` — if commits are being reverted and re-applied, the agent is oscillating.

## Failure 7: Ambiguity Exploitation

**What happens**: The PRD has a gap or ambiguous criterion. The agent takes the easiest interpretation — which is always the one that requires the least work. "Support error handling" becomes a single `if err != nil { return err }`. "Add tests" becomes one test that checks the happy path.

**Root cause**: Agents exploit ambiguity the way water exploits cracks in concrete. They optimize for satisfying criteria with minimum effort.

**Prevention**:
- Be relentlessly specific in acceptance criteria.
- Pull exact prohibitions and thresholds out of the conversation before writing stories.
- Name exact error conditions: "Returns ErrNotFound when pod doesn't exist, ErrTimeout when probe exceeds --timeout, ErrForbidden when RBAC denies access."
- Name exact test cases: "Test table includes: valid input, empty input, nil input, input exceeding max length."
- Use the interview technique: before writing the PRD, ask yourself "what's the laziest possible interpretation of this criterion?" and close that loophole.

## Failure 8: Library/Framework Drift

**What happens**: The agent uses different libraries on different iterations. Iteration 3 imports `logrus`, iteration 5 imports `zap`, iteration 7 imports `slog`. The codebase becomes an inconsistent mess.

**Root cause**: Fresh context every iteration means the agent has no memory of its previous library choices unless constrained.

**Prevention**:
- CLAUDE.md Tech Stack section with explicit library choices.
- "MUST NOT add dependencies not listed in Tech Stack" rule.
- Lock dependencies early: make story US-001 about scaffolding with the correct `go.mod` / `package.json`.

**Detection**: Check `go.sum` or `package-lock.json` diff between iterations.

## Failure 9: Structural Chaos

**What happens**: The agent creates files in random locations. Handlers end up in `pkg/utils/`, models end up in `cmd/`, tests end up mixed with production code.

**Root cause**: No directory structure constraints, and the agent's idea of "good structure" varies per iteration.

**Prevention**:
- Either pre-create the directory structure or make US-001 about scaffolding.
- CLAUDE.md Architecture section: "Controllers in internal/controller/. API types in api/v1/. Tests in same package as code (internal/controller/controller_test.go)."
- Early stories that create files establish patterns for later stories.

## Failure 10: Progress File Corruption

**What happens**: The agent overwrites progress.txt instead of appending. All inter-iteration memory is lost.

**Root cause**: Default behavior for writing files is overwrite, not append.

**Prevention**:
- Prompt must explicitly say "APPEND to progress.txt. Do NOT overwrite."
- Some implementations use git-tracked progress (each iteration commits a progress entry).
- Consider using JSON for progress tracking (harder to accidentally overwrite a structured file).

## The Pre-Flight Checklist

Before starting the loop, verify:

- [ ] CLAUDE.md has tech stack with specific versions
- [ ] CLAUDE.md has MUST NOT rules for libraries and features
- [ ] CLAUDE.md has explicit non-goals
- [ ] prd.json has all stories with `passes: false`
- [ ] Root constraints extracted from the conversation are present in prd.json
- [ ] Every acceptance criterion is a runnable command or concrete observable state
- [ ] Every non-trivial story has anti-criteria
- [ ] Quantitative criteria exist where real thresholds exist
- [ ] Project quality gates on every story
- [ ] `dependsOn` creates a valid DAG
- [ ] `supersedes` is used when later stories invalidate earlier ones
- [ ] Task runner targets or directly runnable commands match acceptance criteria commands
- [ ] Linter config committed and strict
- [ ] Test framework installed and the project's full test command works (even if no tests yet)
- [ ] Git repo initialized with initial commit
- [ ] MAX_ITERATIONS set (not infinite)
- [ ] progress.txt exists (empty, but exists)
- [ ] Prompt includes "APPEND to progress.txt" and "ONLY WORK ON A SINGLE TASK"

## When to Intervene (Break the Loop)

- Agent oscillating (reverting and re-applying the same changes)
- Same test failure for 3+ consecutive iterations
- Unexpected files appearing outside the project structure
- Dependencies being added that aren't in CLAUDE.md
- progress.txt shows the agent is confused about what's left
- Token spend exceeding your budget for the expected work
