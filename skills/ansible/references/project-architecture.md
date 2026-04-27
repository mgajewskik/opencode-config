# Project Architecture

Use this reference when the task is about repo shape, dependency boundaries, inventories, collections, Git strategy, or long-lived maintainability.

## Default Architecture

For production-scale work, default to **collection-first automation with environment-scoped inventory data**.

```text
ansible/
├── ansible.cfg
├── requirements.yml
├── collections/
│   └── ansible_collections/
│       └── <namespace>/<collection>/
├── inventories/
│   ├── prod/
│   │   ├── hosts.yml
│   │   ├── group_vars/
│   │   │   └── all/
│   │   │       ├── 00-defaults.yml
│   │   │       └── 99-vault.yml
│   │   └── host_vars/
│   ├── stage/
│   └── dev/
├── playbooks/
├── roles/                  # authored roles only
├── plugins/                # or collection-local plugins/
├── execution-environments/
└── ci/
```

## Default Rules

1. Commit `ansible.cfg` in the repo root.
2. Keep one inventory tree per environment.
3. Keep `group_vars/all/` as a directory, not a single `all.yml`.
4. Keep authored roles separate from third-party dependencies.
5. Pin roles and collections in `requirements.yml`.
6. Treat execution environments as versioned runtime artifacts.
7. Treat inventory as a database: single-writer per source, CRUD-able, versioned, and validated before production runs.

## `ansible.cfg` Safety

Config lookup is part of the runtime contract. Ansible uses the first config found in this order:

1. `ANSIBLE_CONFIG`
2. `ansible.cfg` in the current directory
3. `~/.ansible.cfg`
4. `/etc/ansible/ansible.cfg`

Operational defaults:

- verify active config with `ansible-config dump --only-changed`
- keep CI from relying on ambient user-level config
- treat world-writable current directories as unsafe; Ansible ignores local config there for security reasons

## Why This Layout Scales

- separates reusable automation content from environment state
- reduces “works on my machine” controller drift
- makes review boundaries visible
- supports CI path filtering and team ownership
- keeps secret scope closer to the environment that owns it

## Collections vs Roles

Default to **collections** as the packaging boundary for reusable automation.

Use a collection when you need:

- reusable roles across projects or teams
- plugins, modules, docs, and roles packaged together
- versioned interfaces and tests
- cleaner integration with linting and ecosystem tooling

Use plain repo-local roles when:

- the content is private to one repo
- you do not need plugin packaging or wider reuse yet
- the overhead of a collection would not buy anything yet

Do not treat Galaxy publication as the primary reason to use collections. Use them because they improve packaging and interface discipline.

Senior posture: start flat enough to understand, extract roles when behavior repeats, and promote to collections when distribution, versioning, plugins, signed content, or EE packaging make the boundary real. New long-lived shared content should usually be collection-first; standalone roles are acceptable for narrow repo-local work.

## Role Interface Contract

Reusable roles should expose an interface, not just a task folder:

- `defaults/main.yml` documents caller-overridable inputs
- `meta/argument_specs.yml` validates typed role arguments where practical
- `meta/main.yml` declares real role dependencies
- `handlers/` contains only handler work triggered by real changes
- `molecule/` or equivalent scenario tests cover converge and idempotency
- environment-specific values stay in inventory, not role internals

## Repo Boundaries

### Prefer one repo when:

- the same PR often touches shared roles and playbooks together
- teams need global visibility into reuse and impact
- you want one review surface and one validation pipeline

### Split repos when all are true:

- ownership boundaries are stable
- release cadences truly differ
- versioned consumption is real, not hypothetical
- you are prepared to pin and test cross-repo dependencies

If you split, prefer **versioned collections** over git submodules.

## Git Defaults

- protect `main`
- require review from path owners for shared areas
- pin released dependencies, never live branches
- avoid long-lived environment branches by default
- tag stable infra states when you need controlled backports or hotfixes

## Inventory Structure Doctrine

Prefer:

- `inventories/prod/group_vars/...`
- `inventories/stage/group_vars/...`
- `inventories/dev/group_vars/...`

Avoid by default:

- top-level shared `group_vars/`
- secrets that can bleed across environments
- hidden environment overrides spread across unrelated paths

Inventory sharp edges to call out in reviews:

- multiple `-i` sources merge in supplied order; later definitions can win
- inventory directories load alphabetically, so prefix files when order matters
- same-level groups merge alphabetically unless `ansible_group_priority` is set in inventory
- INI inventory parses inline host variables differently from `:vars`; prefer YAML when types matter
- missing inventory paths may fall back to implicit localhost; preview prod hostsets with `--list-hosts` before risky runs

## Dependency Placement

Default to project-local paths via `ansible.cfg`:

```ini
[defaults]
collections_paths = ./collections
roles_path = ./roles
```

This avoids controller-global dependency drift and allows multiple automation projects to coexist safely on one machine or runner.

## Execution Environments

Do not build one giant “everything” image unless there is a real reason.

Prefer multiple smaller execution environments by domain:

- base/linux ops
- cloud provider specific
- network automation
- controller-specific workflows

Why:

- smaller blast radius for dependency changes
- easier CVE patching
- faster image builds and pulls
- clearer ownership

Air-gapped or regulated default: build layered EEs with an org base image that contains internal CA trust and package mirror configuration, then team/application EEs `FROM` that base. Pin production job templates by digest, not mutable tags.

## Architectural Anti-Patterns

- uncommitted `ansible.cfg`
- top-level `group_vars` shared across environments
- vendoring third-party roles into authored `roles/`
- unpinned `requirements.yml`
- environment branches used to mask poor inventory separation
- one giant execution environment for every team and use case
- hand-built EEs with no `execution-environment.yml` source
- mutable `latest` tags in production job templates
- mixing staging and production inventories without an explicit cross-environment reason

## Good Default Recommendation Shape

When recommending architecture, answer in this order:

1. repo boundary
2. inventory boundary
3. content packaging boundary
4. runtime boundary
5. validation boundary

## Minimal Review Checklist

- Is the inventory scoped per environment?
- Is `ansible.cfg` committed and repo-local?
- Are dependencies pinned and project-local?
- Are authored roles separate from external content?
- Is reuse packaged via collection where it actually helps?
- Is runtime reproducibility addressed via EE or equivalent?
