# Review and Refactor

Use this reference when reviewing an existing Ansible codebase or planning a refactor.

## Review Output Contract

Prefer this structure:

1. `Verdict`
2. `Blockers`
3. `Risks`
4. `Evidence`
5. `Suggested fixes`
6. `Smallest next step`

## Review Priorities

Inspect in this order:

1. runtime reproducibility
2. inventory scope and variable bleed risk
3. module choice and idempotency
4. role interfaces and hidden coupling
5. validation and rollout safety
6. secret handling and logging exposure
7. performance or scale traps only after correctness
8. platform/ecosystem fit when Ansible is being used as Terraform, GitOps, or a runtime secret manager

## What Good Looks Like

- repo-local `ansible.cfg`
- pinned dependencies
- explicit inventory boundaries
- native modules over shell
- roles with clear inputs
- checkable rollout plan
- canary or batch control for risky changes
- explicit file modes and template validation where applicable
- host-set preview for dangerous or broad runs
- execution environment or other reproducible runtime for controller parity
- explicit AAP/PAH backup scope if platform operations are in scope

## Common Blockers

- top-level shared `group_vars/`
- unpinned `requirements.yml`
- runtime depends on mutable controller state
- broad `shell`/`command` use with no change semantics
- hidden inter-role contracts
- no usable validation beyond lint
- secret-bearing diffs/logs/artifacts are not controlled
- handlers can be skipped after config changes with no deliberate mitigation
- production job templates reference mutable EE tags
- AAP/PAH/AWX workflows have no audit/log retention or backup story

## Refactor Strategy

Prefer phased refactors:

### Phase 1: behavior-preserving cleanup

- pin dependencies
- move config into repo-local `ansible.cfg`
- replace obvious shell calls with modules where semantics are identical
- add validation gates

### Phase 2: interface cleanup

- make role inputs explicit
- move env data to the correct inventory scope
- reduce hidden global defaults

### Phase 3: architecture changes

- collection-first packaging
- execution environment packaging
- repo boundary changes
- controller workflow redesign

## Anti-Criteria

Reject or push back when a refactor:

- rewrites everything before proving the failure mode
- mixes behavior change and architecture change in one giant step
- broadens scope because adjacent cleanup is tempting
- removes useful explicitness for terseness alone

## Smell Catalog

- “works only from one engineer laptop”
- “prod secrets appeared in non-prod context”
- “playbook must be run with the right magic tags to avoid damage”
- “check mode is green but live runs fail regularly”
- “every role assumes another role already ran”
- “performance tuning means only more forks”
- “Vault means secrets are safe”
- “run_once always means once globally”
- “check mode proves production safety”
- “AAP is just a UI for ansible-playbook”
- “Vault is our runtime secret manager”
- “latest EE tag is fine in prod”
- “we use Ansible to provision all cloud resources because it can call APIs”

## Senior Warning Signs

- no `roles/` or collection boundary; only top-level playbooks
- role `tasks/main.yml` is hundreds of lines
- no `meta/argument_specs.yml` for reusable roles
- broad `command` / `shell` use with no idempotency hook
- `all.yml` carries hundreds of unrelated vars and secrets
- static and dynamic inventory sources overlap without documented merge order
- `gather_facts: true` everywhere against large inventories
- `delegate_to: localhost` scattered because controller work has no explicit design
- EEs hand-built in registry with no source definition
- PAH content is assumed to be protected by controller DB backup

## Evidence Guidelines

Tag review claims as:

- `inspected` - visible in code or config
- `executed` - observed in command output
- `tested` - verified by a gate or scenario
- `inferred` - plausible but not yet proven

Do not present inferred issues as hard blockers without supporting evidence.
