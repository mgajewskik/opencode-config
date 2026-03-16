# Environment Modes

Use this reference when the same skill workflow needs to adapt to different execution environments.

## Principle

Keep the architectural guidance stable and adapt the mechanics.

The skill should still know how to discover, structure, test, and improve itself. What changes is how much automation, parallelism, and UI support are available.

## OpenCode / Claude Code / Codex

OpenCode is the primary scripted mode supported by the bundled trigger-optimization scripts. Claude Code and Codex can still use the architecture, scaffolding, validation, and evaluation guidance, but they need a matching backend if you want automated trigger testing.

Use when available:

- parallel runs and subagents for with-skill vs baseline comparisons
- general scripts in `scripts/` for scaffolding, validation, packaging, and benchmark aggregation
- OpenCode-backed scripts for description optimization and trigger evaluation
- packaging utilities
- benchmark aggregation
- file-based iteration workspaces

Preferred flow:

1. architecture and draft
2. realistic evals
3. baseline comparison
4. scripted scoring where possible
5. human review
6. iterate

### Script portability

- `init_skill.py`, `quick_validate.py`, `package_skill.py`, `generate_report.py`, and `aggregate_benchmark.py` are general enough for OpenCode, Codex, or other local workflows.
- `run_eval.py`, `improve_description.py`, and `run_loop.py` are now OpenCode-first because they depend on `opencode run --agent smart --format json`.
- To support Claude Code or another runtime, swap the backend invocation and skill-detection logic rather than changing the evaluation methodology.

## Headless or Remote Environments

If you cannot open a browser or graphical review artifact:

- write outputs to disk
- summarize key diffs in conversation
- ask for targeted human review inline
- prefer static HTML or JSON artifacts over live local servers

Do not block progress just because a browser helper is unavailable.

## Claude.ai or Single-Agent Environments

If you do not have subagents or strong local execution:

- run eval prompts serially
- skip expensive baseline comparisons unless the user specifically wants them
- focus on architecture quality plus representative manual tests
- ask the user for faster qualitative review in conversation

Be honest that this is a weaker verification mode than independent parallel runs.

## Tool-Limited Environments

If the environment lacks one or more utilities:

- degrade gracefully to manual evaluation
- keep schemas and directory layouts compatible so the workflow can be resumed later
- preserve snapshots of the current skill before major edits
- if nested `opencode run` trigger testing is unavailable, do manual trigger reviews instead of claiming scripted optimization

## Packaging Guidance

Packaging is optional during drafting and mandatory only when the user wants a distributable artifact.

If the skill directory might be read-only:

1. copy it to a writable temp location
2. edit and validate there
3. package from the writable copy

## Safety Guidance

- do not assume browser access
- do not assume subagents exist
- do not assume the current environment can run nested OpenCode processes
- explicitly state what verification level you achieved: manual, scripted, baseline-compared, or benchmarked
