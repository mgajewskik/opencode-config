---
name: ansible
description: Senior-level Ansible guidance for production automation. Use when designing or reviewing Ansible project structure, playbooks, roles, custom modules or plugins, inventories, variable flow, execution environments, AWX or AAP workflows, testing, debugging, upgrades, performance tuning, secrets handling, or large-scale rollout patterns.
metadata:
  author: local
  version: "0.2"
---

# Ansible

Production-first Ansible guidance for senior users. Optimize for correctness, idempotency, maintainability, security, scale, and minimal diffs. Skip beginner tutorials unless the user explicitly asks for them.

This skill is based on a bundled senior-level Ansible source corpus and is intentionally opinionated toward large-project, production-grade Ansible work.

## Start Here

Classify the request first, then load only the smallest useful reference.

- Project layout, repo boundaries, inventories, `ansible.cfg`, collections, Git strategy -> read [references/project-architecture.md](references/project-architecture.md)
- Playbooks, tasks, handlers, tags, includes/imports, roles as APIs, `shell`/`command` tradeoffs -> read [references/playbook-and-role-patterns.md](references/playbook-and-role-patterns.md)
- Custom modules, callbacks, filters, lookups, plugins, collection packaging, extensibility boundaries -> read [references/plugins-and-extensibility.md](references/plugins-and-extensibility.md)
- Inventory graph, precedence, `hostvars`, `set_fact`, `set_stats`, delegation, cross-play data flow -> read [references/inventory-vars-and-data-flow.md](references/inventory-vars-and-data-flow.md)
- Execution environments, `ansible-builder`, `ansible-navigator`, AWX/AAP, job slicing, execution nodes, automation mesh -> read [references/runtime-and-platform.md](references/runtime-and-platform.md)
- `ansible-core` upgrades, porting risk, compatibility review, rollout strategy -> read [references/upgrades-and-porting.md](references/upgrades-and-porting.md)
- Syntax checks, linting, check mode, canaries, Molecule, idempotency, CI gates -> read [references/testing-and-validation.md](references/testing-and-validation.md)
- Undefined vars, interpreter drift, temp dir issues, handler surprises, debugger workflow, race conditions -> read [references/debugging-and-failure-modes.md](references/debugging-and-failure-modes.md)
- Forks, pipelining, caching, `serial`, `free`, `async`, `throttle`, ansible-pull, scale tuning -> read [references/performance-and-orchestration.md](references/performance-and-orchestration.md)
- Vault, SOPS, runtime secret lookup, `no_log`, privileged auditing, supply-chain hygiene -> read [references/security-and-secrets.md](references/security-and-secrets.md)
- Reviewing or refactoring an existing Ansible codebase -> read [references/review-and-refactor.md](references/review-and-refactor.md)
- Fast command/checklist lookup -> read [references/quick-reference.md](references/quick-reference.md)

## Use This Skill For

- designing or restructuring an Ansible repository
- authoring or reviewing playbooks, roles, inventories, plugins, and controller workflows
- debugging failures in production or CI
- improving idempotency, validation, and rollout safety
- deciding between runtime, packaging, and scaling approaches
- hardening secret handling and auditability
- turning ad hoc Ansible into a predictable, testable system

## Do Not Use This Skill For

- basic YAML or beginner Ansible syntax unless the user explicitly asks
- provider-specific API reference when current docs are required
- cloud-specific assumptions without evidence from the user
- rewriting a whole automation estate when a local fix is enough
- defaulting to `shell`/`command` when a real module exists

## Default Operating Stance

- Answer directly for small, local tasks.
- Interview first for larger or riskier tasks.
- Prefer project-local dependencies, pinned versions, and explicit interfaces.
- Treat roles as APIs, not dumping grounds.
- Prefer FQCNs, native modules, and explicit validation.
- Prefer environment-scoped inventories over shared global variable sprawl.
- Prefer canary validation and smallest-safe rollout over cleverness.
- State unknowns when runtime, controller, inventory, or version details matter.

## Core Mental Models

1. **Ansible is a controller-driven state engine, not bash with YAML.**
2. **Inventory is a graph with merge order and precedence, not just a file.**
3. **Parse time and run time are different universes.** `import_*` and `include_*` are not interchangeable.
4. **Idempotency is a contract.** If a task cannot prove its change semantics, treat it as risky.
5. **Roles are interfaces.** Defaults, validation, and side effects should be deliberate.
6. **Performance tuning starts by removing work, not by blindly raising `forks`.**
7. **Secrets discipline and runtime reproducibility are architecture concerns, not polish.**
8. **`changed` is a control signal.** False positives restart services; false negatives skip handlers.

## Interview Triggers

Ask a focused follow-up set when any of these are true:

- the request changes rollout blast radius, concurrency, or controller topology
- the request touches secrets, privilege escalation, or controller credentials
- the request depends on AWX/AAP, execution environments, or inventory plugins
- the request asks for broad restructuring across multiple roles or inventories
- the request depends on version-specific behavior that the user did not specify

High-value discovery questions:

1. What executes this: local CLI, CI runner, AWX, AAP, or `ansible-navigator`?
2. What is the inventory source: static files, dynamic plugin, CMDB, cloud, or mixed?
3. What is the validation path: syntax only, canary, check mode, Molecule, staging, or prod?
4. Where do secrets come from: Vault files, external secret store, controller credentials, or mixed?
5. Is the task path-local or architecture-wide?
6. What is the rollback or blast-radius expectation?

## Mode Router

Choose one primary mode and at most one secondary mode.

| Mode | Use when | Load |
|---|---|---|
| `design` | new repo, restructuring, layout, dependency boundaries, collection-first architecture | `references/project-architecture.md` |
| `build` | writing or modifying playbooks, roles, handlers, and task includes | `references/playbook-and-role-patterns.md` |
| `extend` | writing or reviewing custom modules, callbacks, filters, lookups, or collection-packaged extensibility | `references/plugins-and-extensibility.md` |
| `data-flow` | debugging vars, precedence, `hostvars`, delegation, workflow artifacts, fact cache behavior | `references/inventory-vars-and-data-flow.md` |
| `runtime` | execution environments, builder, navigator, AWX/AAP, mesh, job slicing | `references/runtime-and-platform.md` |
| `upgrade` | `ansible-core` upgrades, porting-readiness, version pinning, compatibility fallout | `references/upgrades-and-porting.md` |
| `validate` | syntax, lint, check mode, idempotency, canary, Molecule, CI policy | `references/testing-and-validation.md` |
| `debug` | failures, transport, interpreter, temp paths, race conditions, handler order, task debugger | `references/debugging-and-failure-modes.md` |
| `scale` | slow runs, large inventories, forks, caching, strategies, async, pull model | `references/performance-and-orchestration.md` |
| `secure` | Vault, external secret lookup, `no_log`, auditability, signing, version pinning | `references/security-and-secrets.md` |
| `review` | code review, smell detection, refactor plan, risk ranking | `references/review-and-refactor.md` |

Common combinations:

- `design` + `validate`
- `build` + `validate`
- `extend` + `validate`
- `data-flow` + `debug`
- `upgrade` + `validate`
- `runtime` + `scale`
- `secure` + `review`

## Core Workflow

1. Identify the operating mode and actual execution context.
2. Load only the nearest reference file.
3. Recover the key invariants: inventory scope, variable source, runtime, validation path, secrets path, blast radius.
4. Recommend the smallest viable change that improves correctness first.
5. Include a validation path, not just code or advice.
6. Name the main risks and anti-patterns explicitly.
7. For broad changes, phase them into behavior-preserving steps.

## Output Contract

Default response shape:

1. `Verdict` - one-line assessment or recommended direction
2. `Why` - the main mechanism or senior-level reason
3. `Recommended pattern` - concise design or code direction
4. `Risks / edge cases` - what can still go wrong
5. `Validation` - the smallest convincing check sequence
6. `Next step` - the smallest action to take now

Mode-specific additions:

- `review`
  - override the default shape with: `Verdict`, `Blockers`, `Risks`, `Evidence`, `Suggested fixes`, `Smallest next step`
- `debug`
  - `Likely failure layer`
  - `Smallest next probe`
- `validate`
  - `Required gates`
  - `Canary / idempotency expectation`
- `design`
  - `Proposed repo shape`
  - `Non-goals`

## Guardrails

- Do not default to `shell` or `command` if a maintained module can express the state.
- Do not recommend top-level shared `group_vars/` by default.
- Do not assume AWX/AAP, a cloud, or a secret manager unless the user says so.
- Do not recommend environment branches by default; prefer one mainline with environment-scoped data unless divergence is truly required.
- Do not suggest huge rewrites when a local interface or inventory fix is enough.
- Do not hide uncertainty around precedence, runtime dependencies, or check-mode behavior.
- Do not leak secrets in examples, logging advice, or debug output.
- Do not present Galaxy publication or public distribution as the default reason to use collections.
- Do not treat Vault, lint, or check mode as complete proof of production safety.

## Success Criteria

Pass when all are true:

- advice is senior-level and skips basics
- recommendations preserve or improve idempotency
- validation path is explicit
- guidance prefers project-local, reproducible runtime and dependency control
- response avoids cloud-specific or controller-specific assumptions unless stated
- refactor guidance prefers minimal, path-local rollout before broad redesign

Fail when any are true:

- default answer is a tutorial instead of actionable production guidance
- `shell`/`command` is suggested without justification and change/failure controls
- variable or inventory advice ignores scope and precedence
- performance advice starts with concurrency before removing unnecessary work
- security advice normalizes plaintext secrets or unsafe debug output

## Failure Modes

| Scenario | Detection | Fallback |
|---|---|---|
| Runtime unclear | User did not say CLI vs AWX/AAP vs CI | Ask only for execution path and validation path |
| Variable issue is ambiguous | Same key may exist in multiple scopes | Use inventory graph and precedence reasoning before suggesting code changes |
| Performance complaint is vague | No timing data, just “slow” | Start with fact gathering, cache, and profile checks before tuning concurrency |
| Security-sensitive request | Secrets or privileged tasks involved | Default to external lookup or encrypted-at-rest guidance and redact examples |
| Broad refactor requested | Many roles/inventories touched | Propose phased rollout with validation checkpoints |

### When in doubt

- Prefer explicit interfaces over hidden inheritance.
- Prefer controlled rollouts over maximal speed.
- Prefer showing the smallest safe example over a full rewrite.
- Prefer asking one precise clarifying question over assuming platform details.
