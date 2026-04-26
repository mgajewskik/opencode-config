# Inventory, Variables, and Data Flow

Use this reference when the problem involves precedence, `hostvars`, delegation, inventory plugins, cross-host orchestration, or workflow data passing.

## Core Mental Model

Inventory is a **graph** of hosts, groups, inherited variables, and merge order.

When diagnosing a variable problem, ask:

1. Which source defined it?
2. At what scope?
3. In what merge order?
4. At parse time or run time?
5. Is it host-scoped, play-scoped, cached, or workflow-scoped?

## Safe Variable Defaults

- use `defaults/main.yml` for role inputs the caller may override
- keep project-wide environment defaults in the relevant inventory tree
- use high-precedence role vars only when override resistance is intentional
- avoid top-level shared `group_vars` by default

## High-Value Precedence Reminders

You do not need all precedence levels memorized in every answer. Usually the important ones are:

1. extra vars (`-e`) win
2. task/block/role vars are high-precedence
3. `host_vars` beat broader `group_vars`
4. role defaults are lowest

If the user is debugging a real collision, do not guess. Reason from the actual sources and inventory layout.

## Inventory Merge and Typing Sharp Edges

- inventory variables flatten to host scope before execution; groups are not runtime variable scopes
- multiple inventory sources merge in the order passed on the command line
- inventory directories load alphabetically
- same-level groups merge alphabetically unless `ansible_group_priority` is set in inventory
- playbook-relative `group_vars` can override inventory-relative `group_vars`
- INI inline host vars parse as Python literals, but `:vars` entries parse as strings; YAML inventory avoids this inconsistency

For wrong-host or wrong-variable incidents, first prove the resolved view with `ansible-inventory --graph` and `ansible-inventory --host <host>`.

## `register`, `set_fact`, and Host Scope

- `register` is local to the current host for the current run
- `set_fact` creates host-scoped data for later tasks and plays in the same run
- `set_fact cacheable=true` can persist through the fact cache, but later runs see cached-fact precedence, not the original transient host-var precedence

Important nuance:

- `set_fact cacheable=true` creates a runtime host variable now and a lower-precedence cached fact for later runs
- this is a common source of “it changed between runs” confusion

## `hostvars`

Use `hostvars` for cross-host reads only when the target host facts or vars are actually available.

Default caution:

- facts must be gathered or cached
- play vars are not magically a durable cross-host state store
- if cross-host discovery is important, perform it early and normalize it

## Delegation

`delegate_to` runs a task elsewhere while keeping the current host context.

Use it for:

- load balancer or API calls
- controller-side orchestration
- one-off control-plane actions

Foot-gun:

- facts set inside a delegated task attach to the original host unless `delegate_facts: true` is used

## Recommended Cross-Host Patterns

### One-time control-plane action

```yaml
- name: register all backends from one place
  ansible.builtin.uri:
    url: https://lb.internal/api/backends/{{ item }}
    method: POST
  run_once: true
  delegate_to: localhost
  loop: "{{ ansible_play_hosts_all }}"
```

### Push a fact onto other hosts intentionally

```yaml
- name: delegate token to workers
  ansible.builtin.set_fact:
    api_token: "{{ token_output.stdout }}"
  delegate_to: "{{ item }}"
  delegate_facts: true
  loop: "{{ groups['workers'] }}"
```

## Dynamic Variable Loading

Use `include_vars` when runtime data chooses the file.

Good use cases:

- distro-specific vars
- environment-specific overlays
- structured artifacts written by earlier steps

Prefer explicit `combine` merges near the use site over hidden global merge behavior.

## Dynamic Inventory

Prefer inventory **plugins** over scripts.

When the source is expensive or rate-limited:

- cache inventory data
- cache facts when repeated discovery is expensive
- use constructed grouping for dynamic host classification

## Workflow and Cross-Playbook State

Default preference order:

1. one playbook with multiple plays
2. fact cache for host-scoped persistence
3. explicit artifact files for crude but reliable passing
4. external state store when orchestration truly needs it

### `set_stats`

Use `set_stats` for workflow-level data passing, especially in controller workflows.

Cautions:

- global merge behavior can collide unexpectedly
- namespacing matters
- per-host convergence can surprise you if keys are not unique

Use dictionary aggregation with unique host keys when collecting per-host results.

## Custom Facts

For durable host-local metadata, prefer custom facts in `/etc/ansible/facts.d/` over repeated ad hoc parsing commands.

This is useful for:

- installed app version
- organizational host metadata
- durable target-side feature flags

## Anti-Patterns

- relying on implicit role order for shared vars
- scraping human-readable stdout as a state contract
- assuming `hostvars` works before facts exist
- using top-level shared env data
- using hidden global merge behavior instead of explicit `combine`
- changing inventory topology mid-run without deliberate need
- passing multiple environment inventories together as routine practice

## Debug Questions

- What inventory source won?
- Which scope actually defined this key?
- Is the value needed now, later in the run, or across runs?
- Is this host data, workflow data, or external state pretending to be both?
