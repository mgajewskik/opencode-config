# Core Mechanics

Use this reference when the user needs root-cause reasoning, an explanation of Ansible internals, or a fix that depends on execution semantics rather than surface YAML.

## Senior Mental Model

Ansible is a Python program on a control node that renders work locally, ships module wrappers to managed nodes over a connection plugin, executes them, and consumes JSON results.

Implications:

- “Agentless” means no persistent daemon, not “nothing runs on the target.” Every normal task still executes code on the target.
- Jinja2 templating, variable resolution, filters, and most action-plugin preprocessing happen on the control node.
- Idempotency is a module/user contract, not a framework guarantee.
- SSH access, interpreter selection, temp directories, and privilege escalation are part of the execution model, not transport trivia.

## Execution Lifecycle

Default `linear` strategy, simplified:

1. `ansible-playbook` parses YAML into play and task objects.
2. The strategy plugin picks the next host/task pairs.
3. Fork workers execute up to `forks` parallel units.
4. Variables are merged by precedence; templates render on the control node.
5. The connection plugin opens or reuses transport, usually OpenSSH with ControlPersist.
6. The action plugin prepares local work; `copy`, `template`, and similar modules do meaningful controller-side preprocessing.
7. The module is packaged, transferred or pipelined, executed on the managed node, and returns JSON.
8. Results are parsed; callbacks fire; handlers are queued if `changed: true`.
9. Under `linear`, Ansible waits for the task batch before moving to the next task.

Use this model to debug “works over SSH but module fails,” “variable was different than expected,” “handler did not fire,” and “slow at scale.”

## AnsiballZ

Most Python modules are shipped as an AnsiballZ wrapper: a Python script with an embedded base64 zipfile containing the module, needed `module_utils`, and rendered arguments.

Operational facts:

- The wrapper normally lands under the remote temp path, then runs under the selected interpreter.
- `ansible_python_interpreter` influences remote interpreter selection and module shebang generation.
- `ANSIBLE_KEEP_REMOTE_FILES=1` keeps the wrapper for inspection.
- `python AnsiballZ_<module>.py explode` extracts the wrapped module for debugging.
- Pipelining feeds the wrapper over stdin instead of writing a target temp file; this reduces round trips and avoids some become temp-file problems.

## Strategy and Synchronization

| Strategy | Behavior | Use when | Risk |
|---|---|---|---|
| `linear` | all hosts finish task N before task N+1 starts | default, predictable sequencing | slowest host gates each task |
| `free` | each host advances independently | independent, IO-heavy tasks with uneven hosts | races and hidden ordering bugs |
| `host_pinned` | host stays pinned to a worker for play lifetime | connection-establishment-heavy targets | lower throughput in some runs |
| `debug` | interactive debugger on failures | local investigation | not for unattended runs |

Version-sensitive guardrail: ansible-core 2.19+ deprecates third-party strategies outside `ansible.builtin`; do not build a long-horizon production plan around Mitogen without explicitly accepting sunset risk.

## Idempotency Model

Ansible gives modules and users tools: `check_mode`, `diff_mode`, `changed_when`, `failed_when`, `creates`, and `removes`. It does not make arbitrary commands idempotent.

High-risk defaults:

- `command`, `shell`, `raw`, and `script` are not idempotent by default.
- `changed_when: true` is usually a lint-appeasement smell, not a fix.
- `lineinfile` regex must match both the pre-state and the post-state or it may append forever.
- `changed` drives handlers; a false positive restarts services, and a false negative skips required restarts.

## Variable and Templating Corners

Keep the full precedence table nearby, but these corners catch most incidents:

- `-e` / extra vars win over everything.
- `host_vars` beat broader `group_vars`.
- registered vars and transient `set_fact` are high-precedence during the run.
- `set_fact cacheable=true` writes both a high-precedence runtime var and a lower-precedence cached fact for future runs.
- `hostvars[other_host]` only works if that host's facts or variables are available in the current run or cache.
- `{{ var }}` at column 0 can collide with YAML flow-mapping syntax; quote templated values.

## When to Reach for This Reference

- user asks “why did Ansible do this?”
- failures involve temp files, interpreters, SSH, `become`, callbacks, or module execution
- performance discussion needs `linear` lockstep, forks, facts, or connection cost
- an answer would otherwise rely on vague “best practice” claims
