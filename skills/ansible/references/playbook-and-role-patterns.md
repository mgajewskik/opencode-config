# Playbook and Role Patterns

Use this reference when writing or reviewing playbooks, roles, handlers, includes, tags, or module choices.

## Default Doctrine

- express **desired state**, not shell choreography
- prefer native modules over `shell` and `command`
- use FQCNs in shared or long-lived codebases
- treat roles as explicit interfaces with inputs and validation
- keep side effects obvious and local
- remember that `changed` is a control signal, not cosmetic output

## Modules Over Shell

Default rule: `shell` and `command` are last resorts.

If you must use them, require all of these:

- clear reason why no suitable module exists
- `changed_when` is explicit
- `failed_when` is explicit when exit-code semantics are not enough
- `creates` / `removes` when applicable
- validation path covers real idempotency

Use `command` as a safe probe only when it is explicitly non-changing:

```yaml
- name: probe package presence
  ansible.builtin.command: rpm -q nginx
  register: nginx_pkg
  changed_when: false
  failed_when: nginx_pkg.rc not in [0, 1]
```

Bad default:

```yaml
- name: restart nginx
  shell: systemctl restart nginx
```

Safer default:

```yaml
- name: ensure nginx is started
  ansible.builtin.service:
    name: nginx
    state: started
```

## Roles Are APIs

Good roles:

- document expected inputs in `defaults/main.yml`
- validate important inputs with `meta/argument_specs.yml` or explicit `assert` tasks
- keep defaults low-precedence and override-friendly
- fail fast on invalid input
- avoid hidden coupling to other roles
- minimize global side effects

Avoid using `vars/main.yml` for normal configuration. It is too high-precedence for most role inputs.

## Handler Discipline

- notify by topic with `listen:` when handler names may evolve
- flush handlers deliberately only when sequencing matters
- remember: skipped tasks do not notify handlers
- remember: a later task failure can prevent an already notified handler from running on that host
- remember: handlers normally run at end of play; split plays or use `meta: flush_handlers` only when ordering requires it
- with tag-filtered runs, add `always` where a deliberate flush must not be skipped
- do not use handler forcing to paper over bad task structure
- use `force_handlers` only after reasoning about whether applying a pending restart after failure is safer than leaving changed config unapplied

Example:

```yaml
handlers:
  - name: restart nginx service
    ansible.builtin.service:
      name: nginx
      state: restarted
    listen: nginx-restart
```

## `import_*` vs `include_*`

| Need | Prefer | Why |
|---|---|---|
| deterministic structure, static parsing, easier restart/debug | `import_tasks` / `import_role` | resolved at parse time |
| runtime choice, loops, conditional inclusion | `include_tasks` / `include_role` | resolved during execution |

Operational rule:

- prefer `import_*` when the structure is known ahead of time
- prefer `include_*` only when runtime dynamism is necessary
- use `include_tasks` for loops; static imports do not support runtime loops the same way
- watch tag behavior: imports propagate tags at parse time, includes apply them at runtime

Do not treat them as stylistic synonyms.

## Tags

Use tags sparingly.

Tags are useful for:

- targeted dev/test runs
- clearly bounded operational playbooks
- operator-facing selection such as `--tags upgrade`

Tags become harmful when they create hidden production control surfaces. Prefer modular playbooks and explicit conditionals over tag webs.

Do not use tags as control flow. If `--tags configure` secretly runs most of the estate, the play/role boundary is wrong.

## Block and Error Flow

Use `block` / `rescue` / `always` for structured failure handling.

- `block` for the risky operation
- `rescue` to restore or contain damage, not to hide failure
- `always` for logging, metrics, cleanup, or notifications

## `module_defaults`

Useful for reducing boilerplate, but dangerous when it becomes invisible global behavior.

Default stance:

- use locally and intentionally
- avoid surprise defaults that bleed across many roles
- document them if shared across a broad surface

## YAML and Template Sharp Edges

- quote file modes: use `mode: '0644'` or `mode: '0750'`; unquoted octal-looking values can become decimal surprises
- quote templated values that start at column 0: `"{{ value }}"`
- avoid YAML boolean traps for values such as `NO`, `on`, `off`, and version-looking numbers
- set Jinja whitespace options deliberately for templates where diff stability matters
- use `validate:` on templates for config files that support syntax checks

## Role Composition

Avoid role-to-role hidden contracts like “role A sets a var that role B silently reads.”

Prefer:

- play-level `vars`
- `pre_tasks` that establish shared state explicitly
- passing parameters into roles intentionally

## Good Patterns

### OS-specific late binding

```yaml
- name: load distro vars at runtime
  ansible.builtin.include_vars: "vars/{{ ansible_distribution }}.yml"
```

### Explicit one-off orchestration

With `serial`, `run_once` runs once per batch, not necessarily once globally. For truly global one-time work, prefer an explicit first-host condition or a separate play.

```yaml
- name: update shared control plane once
  ansible.builtin.uri:
    url: https://lb.internal/api/backends
    method: POST
  when: inventory_hostname == ansible_play_hosts_all[0]
  delegate_to: localhost
```

### Safer probe task

```yaml
- name: probe current package version
  ansible.builtin.command: rpm -q nginx
  register: nginx_pkg
  changed_when: false
  failed_when: nginx_pkg.rc not in [0, 1]
```

## Smells

- 2000-line site playbook with no role boundaries
- `shell` everywhere
- role defaults used as hard policy
- `vars/main.yml` carrying user-facing configuration
- tags used as the primary execution model
- handlers doing unrelated work
- massive copy-pasted task files instead of a plugin or module
- templates or files without explicit quoted modes such as `'0644'`
- `state: latest` used outside a controlled patch workflow
- async `poll: 0` without later `async_status` reconciliation
- `lineinfile` regex that matches the old line but not the line it writes
- `copy: backup=yes` without a cleanup/retention policy

## Review Questions

- Can this state be expressed with a native module?
- Is the role boundary explicit?
- Are includes/imports chosen for the actual execution model?
- Are handlers notified by real change events only?
- What happens if a handler is notified and a later task fails?
- Is the code understandable without knowing hidden defaults?
