# Performance and Orchestration

Use this reference when the problem is slow execution, large inventories, batch safety, controller load, or orchestration design.

## Performance Doctrine

Tune in this order:

1. remove unnecessary work
2. cache expensive discovery
3. reduce connection overhead
4. control concurrency safely
5. scale out execution topology if needed

Do **not** start with “just raise `forks`.”

## Remove Work First

- disable full fact gathering when not needed
- use `gather_subset` when full facts are overkill
- prefer `gathering = smart` plus a fact cache over blanket `gather_facts: false` everywhere
- avoid repeated discovery commands when facts or custom facts already exist
- stop scraping text when structured module output exists

## Cache What Is Expensive

Useful caches:

- fact cache
- inventory cache for dynamic plugins

Good default thinking:

- jsonfile is enough for local/simple cases
- Redis or similar is better when multiple execution nodes must share state

## Connection Optimization

High-value levers:

- SSH pipelining
- SSH connection reuse / multiplexing
- local or specialized connection plugins when SSH is not the right tool
- short control paths to avoid Unix socket path-length failures

Be careful when pipelining meets privilege escalation constraints.

Good default to evaluate: pipelining on, ControlPersist enabled, and a short `control_path` such as `~/.ansible/cp/%h-%p-%r`.

## Concurrency Controls

### `forks`

Raise only after measuring controller capacity and external bottlenecks.

Rules of thumb from AAP capacity guidance: each fork consumes control-node CPU/RAM; high fork counts also need enough file descriptors for SSH sockets and result handling. Ramp gradually and watch controller saturation.

### `serial`

Use for rolling changes and blast-radius control.

Remember that some semantics are per batch under `serial`; notably, `run_once` can run once per batch.

Good pattern:

```yaml
serial:
  - 1
  - 5
  - "25%"
```

### `throttle`

Use to rate-limit a specific hot spot even when global concurrency is higher.

### `async` + `poll: 0`

Use for long, independent tasks so they do not occupy fork slots the entire time.

Require explicit `async_status` synchronization or an external reconciliation path. Fire-and-forget is not a convergence proof.

### Failure thresholds

Use `any_errors_fatal` for global invariants and `max_fail_percentage` for batch abort thresholds. Be precise: `max_fail_percentage` aborts when the failed percentage is exceeded, not merely equaled.

## Strategy Plugins

| Strategy | Use when | Risk |
|---|---|---|
| `linear` | predictable sequencing matters | slowest host gates progress |
| `free` | hosts are largely independent | easier to create race conditions |
| host-pinned style strategies | per-host atomicity matters | can reduce throughput |

Use `free` only when shared side effects are well controlled.

## Delegation and Shared Targets

Parallelism is harmful when many hosts delegate to the same file, API, or system.

If many forks hit one shared target:

- use `run_once`
- loop intentionally over hosts
- use `serial` or `throttle`
- make the shared system the explicit bottleneck, not an accidental race

## Mitogen

Mitogen can produce major speedups for task-heavy runs, but treat it as an optional advanced optimization with compatibility and roadmap risk.

Default stance:

- do not recommend it first
- consider it only after simpler wins are exhausted
- verify compatibility with the user’s Ansible version and estate
- avoid it for multi-year production plans unless the user explicitly accepts ansible-core 2.19+ third-party-strategy deprecation risk

## Controller and Platform Scale

At larger scale, controller features can help:

- job slicing
- execution nodes or instance groups
- containerized isolated execution
- automation mesh for network locality

Use these when topology and workload justify them, not as decoration.

Scale threshold heuristic: low thousands of hosts can often be handled with tuned forks, caching, and batching; beyond that, shard with inventory/serial or use AAP mesh/execution nodes rather than endlessly raising forks on one controller.

## Push vs Pull

For very large fleets, `ansible-pull` can make sense when horizontal scaling and controller independence matter more than centralized orchestration semantics.

Tradeoff:

- better scale and resilience
- weaker central orchestration, delegation, and rolling semantics

## Anti-Patterns

- maximizing concurrency before measuring controller or API bottlenecks
- using `free` while assuming task-level synchronization still exists
- gathering full facts on every host for every run out of habit
- delegating to one control-plane endpoint from many forks without serialization
- treating controller scale features as a replacement for better play design
- using `run_once` under `serial` without checking whether per-batch execution is acceptable
- launching async work without collecting final status
- treating `async: poll: 0` as convergence without later `async_status` cleanup/status
- ignoring callback/controller DB event volume when AAP runs large host/task matrices
