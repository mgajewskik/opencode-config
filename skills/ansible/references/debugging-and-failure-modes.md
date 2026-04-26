# Debugging and Failure Modes

Use this reference when Ansible behaves unexpectedly in CI, in a controller, or on target hosts.

## Failure Layers

Most real failures cluster into one of these layers:

1. **transport/bootstrap** - SSH works differently from module execution; Python may be missing or misdetected
2. **runtime dependencies** - target-side or controller-side libs are missing
3. **temp path / privilege escalation** - `remote_tmp`, shared readability, shell expansion, become user mismatches
4. **logic/data shape** - undefined vars, wrong precedence, bad conditionals, false change detection
5. **concurrency/orchestration** - delegation races, `free` strategy assumptions, handler ordering, rollout synchronization bugs

## Professional Debug Workflow

1. Reduce scope to the smallest failing unit.
2. Run `--syntax-check`, `--list-hosts`, and `--list-tasks` where useful.
3. Inspect actual config with `ansible-config dump --only-changed`.
4. Inspect actual inventory with `ansible-inventory --graph` and `--host`.
5. Increase verbosity deliberately: usually `-vvv`, sometimes `-vvvv`.
6. Use the task debugger when variable state is the mystery.
7. Add temporary timing or artifact callbacks only while investigating.
8. Remove debug instrumentation after the root cause is clear.

## Common Failure Patterns

| Symptom | Likely cause | First probe |
|---|---|---|
| works in dev, fails in prod with undefined var | env-specific inventory or precedence drift | `ansible-inventory --host <host>` |
| SSH works manually, module fails | interpreter path or module dependency issue | `-vvvv` and inspect module prerequisites |
| handler never ran | notifying task was skipped or play aborted before flush | inspect notify path and failure order |
| always reports changed | shell task, bad change detection, file mode or newline noise | rerun with `--diff`, inspect task semantics |
| check mode passes, live fails | skipped side-effect task in check mode | identify tasks that do not simulate |
| delegated task corrupts shared output | concurrent forks race on one delegate target | add `run_once`, `serial`, or `throttle` |
| wrong hosts were targeted | inventory merge/load order or host pattern surprise | `--list-hosts`, `ansible-inventory --graph` |
| secret appears in CI/controller artifact | Vault decrypted at runtime and output was retained | trace stdout, diff, debug, event, and artifact paths |

## Task Debugger

Use the debugger when the value of a variable at failure time is the key unknown.

High-value operations:

- inspect task args
- inspect templated vars
- patch a variable in-session
- rerun the task in context instead of restarting a long play

This is often faster than blind edit-run loops.

## Handler and Ordering Surprises

- handlers run on change notification, not on wishful thinking
- end-of-play handler timing matters
- `meta: flush_handlers` is a sequencing tool, not a band-aid for poor task structure
- if a task notifies a handler and a later task fails, the handler may not run unless forced
- split plays when a restart must happen before later risky checks

## Temp and Become Issues

When module execution looks random, inspect:

- `remote_tmp`
- file readability between connection user and become user
- shell or path expansion behavior
- platform-specific temp directory semantics
- whether `world_readable_temp` was enabled and could expose module parameters

These are often permissions and temp-path bugs, not true flakiness.

## Strategy and Race Conditions

`strategy: free` removes helpful synchronization.

Use it only when you understand the dependency graph.

If host A needs host B to finish something first:

- add explicit waits
- use `serial`
- move the coordination step to an explicit delegated control-plane action

## Useful Debug Tools

- `ansible-config`
- `ansible-inventory`
- `ansible-console`
- `ansible-doc`
- task debugger
- `profile_tasks` callback
- structured stdout callback during investigation

## Secret Safety While Debugging

- `no_log` helps, but debug output can still expose secrets
- do not recommend verbose debug indiscriminately in production
- redact examples and probes when secret-bearing tasks are involved

## Anti-Patterns

- rerunning the whole estate for a one-task mystery
- guessing precedence instead of checking resolved inventory
- calling an issue “flaky” before checking temp, become, and concurrency semantics
- leaving long-term debug callbacks enabled after diagnosis
- increasing verbosity around secret-bearing tasks without a redaction plan
