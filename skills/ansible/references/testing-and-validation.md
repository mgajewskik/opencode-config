# Testing and Validation

Use this reference when the task is about confidence, CI gates, check mode, idempotency, Molecule, or rollout safety.

## Validation Doctrine

For Ansible, syntax is the floor, not the finish line.

Default validation ladder:

1. syntax and static checks
2. inventory and config sanity
3. host/task preview for risky runs
4. check mode and diff where meaningful
5. canary execution
6. idempotency verification
7. scenario or role tests
8. staged rollout or production rollout

## Required Core Gates

For non-trivial changes, prefer all of these:

- `ansible-playbook --syntax-check`
- `ansible-lint`
- `yamllint`
- inventory sanity check
- `--list-hosts` and `--list-tasks` for destructive or broad plays
- `--check --diff` against a safe target when semantics allow it

For production-impacting runs, `--list-hosts` must use the exact `-i`, `--limit`, and extra-vars shape intended for the real run. This catches implicit-localhost fallback and wrong inventory selection.

## Inventory and Config Sanity

Before blaming a playbook, verify:

- `ansible-config dump --only-changed`
- `ansible-inventory --graph`
- `ansible-inventory --host <host>` for resolved host data
- cache invalidation if facts or inventory may be stale

## Check Mode Doctrine

Use check mode aggressively, but do not oversell it.

Remember:

- some modules simulate well
- some tasks are skipped in check mode
- shell-driven tasks often make check-mode confidence weak
- a green check-mode run is not proof when the workflow depends on skipped side effects
- module `Attributes` for `check_mode` and `diff_mode` matter more than generic assumptions
- diff output can expose sensitive rendered content; use `diff: false` on secret-bearing files/templates

If a probe must run in check mode to keep later logic meaningful, consider `check_mode: false` on that probe task.

## Canary First

For risky changes, recommend a canary host or the smallest safe inventory slice.

Examples:

- one host
- one AZ
- one shard
- one batch via `serial`

## Idempotency Is Mandatory

When the play or role claims steady state, verify a second run produces zero unintended changes.

At minimum:

1. run once
2. run again on the same target set
3. inspect unexpected `changed` results

Second-run-no-change is the canonical role confidence check. If a task must always report changed, document why and isolate the handler implications.

## Molecule

Use Molecule when:

- developing or changing roles
- you want reproducible ephemeral scenario testing
- idempotency needs to be enforced automatically
- linters and verifier integration belong in the same workflow

Pair it with:

- `ansible-lint`
- `yamllint`
- Testinfra or goss when state assertions matter

For role work, prefer scenarios that cover converge, idempotency, and verify. `ansible-lint --profile production` is a strong default for shared code.

## CI Gate Recommendation

For shared or production-facing Ansible, default CI gates are:

1. dependency install with pinned requirements
2. lint
3. syntax-check
4. Molecule or scenario tests for changed roles
5. `--check --diff` against a canary or controlled environment where possible

## Secrets Review

Validation also includes secret hygiene.

Check for:

- accidental plaintext secrets in vars files
- sensitive values emitted by debug tasks
- missing `no_log` on secret-bearing tasks
- missing `diff: false` on secret-bearing templates or files
- CI logs exposing encrypted-file contents after decryption steps
- Runner/AWX/controller artifacts retaining secret-bearing stdout or event data
- canary secret grep in artifacts when validating a sensitive pipeline

## Validation by Task Type

| Task type | Minimum validation |
|---|---|
| small task edit | syntax-check + nearest functional check |
| role change | lint + syntax + Molecule or equivalent + idempotency |
| custom plugin or module change | packaging/import sanity + runtime-specific probe + consuming integration path |
| inventory or precedence change | inventory graph + resolved host check + canary |
| rollout logic change | canary + `serial` plan + rollback path |
| controller workflow change | variable-passing check + workflow dry run + namespacing review |
| secret-handling change | redaction check + diff suppression + artifact/canary-secret scan |
| EE or AAP runtime change | run with the intended EE via navigator/runner + capture `ansible --version` and collection list |
| air-gap content change | verify PAH import/signature + EE pull from disconnected registry + no external network dependency |

## Anti-Patterns

- merging after lint only
- treating check mode as full proof of safety
- skipping second-run idempotency validation
- validating against prod first because staging is inconvenient
- broad inventory rollouts with no canary or `serial` control
- approving dangerous plays without a host-set preview
- accepting a green check-mode run when required side-effect tasks were skipped
- forgetting that diff output can expose rendered secrets

## Good Recommendation Shape

When suggesting validation, provide:

1. required gates
2. optional deeper gates
3. idempotency expectation
4. canary scope
5. what the result would falsify
