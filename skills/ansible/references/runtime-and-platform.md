# Runtime and Platform

Use this reference when the request touches execution environments, `ansible-builder`, `ansible-navigator`, AWX/AAP, workflows, controller topology, or platform-runtime reproducibility.

## Runtime Doctrine

At scale, treat the Ansible runtime as a **versioned artifact**, not as “whatever is installed on the controller.”

Default preference:

1. project-local config and dependencies
2. pinned execution environment definitions
3. reproducible controller/runtime packaging
4. platform-specific workflow features only when needed

## Execution Environments

Execution environments are the default answer when controller drift matters.

Use them to pin:

- `ansible-core`
- collections
- controller-side Python dependencies
- system packages required by those dependencies
- `ansible-runner` and related runtime tooling when needed

Default rules:

- commit the EE definition
- build EE images in CI
- keep them small and purpose-built
- patch and rebuild them on a regular cadence
- pin production job templates to immutable digests, not mutable tags
- inject internal CA trust in a shared base EE when internal registries, PAH, Git, or package mirrors use private PKI

Avoid a single giant enterprise EE unless you truly want every dependency change to affect everyone.

## `ansible-builder`

Use `ansible-builder` when you need reproducible EEs.

Senior recommendation:

- treat `execution-environment.yml` like code
- pin dependency versions instead of pulling floating latest
- keep collection requirements and Python requirements under review just like app dependencies

Builder constraint to verify before recommending base images: current Builder workflows expect RPM-based base images with `dnf` or `microdnf`; Debian, Ubuntu, and Alpine bases are not the normal supported path.

For air-gapped environments, mirror base images, collections, Python packages, and system packages internally. Pinning `ansible-core` alone is not enough.

Layered pattern for regulated estates: org-base EE with CA and mirror config -> team-base EE with common collections/system libs -> app/domain EE with narrow dependencies.

## `ansible-navigator`

Useful when the user needs:

- a local CLI that behaves more like the containerized runtime
- execution through an EE locally
- better inspection of runs and docs in an EE-centric workflow

If the user already runs through plain `ansible-playbook` successfully and reproducibility is not the problem, do not force navigator.

## AWX / AAP / Controller Defaults

Use platform features when they buy concrete value:

- RBAC
- credential isolation
- scheduled jobs
- workflow orchestration
- execution node distribution
- job slicing for large inventories
- instance groups / container groups for isolation

Treat AAP as an orchestration and audit plane, not merely a UI around `ansible-playbook`.

AAP 2.5/2.6 version-sensitive defaults:

- platform gateway centralizes UI/API/auth routing
- containerized RHEL install is the strategic VM path
- RPM installs are deprecated in 2.6 and removed after 2.6
- PostgreSQL/Redis/nginx and Pulp-backed hub storage are operational dependencies, not implementation details

## Workflow Guidance

Use controller workflows when the process is genuinely multi-job or approval-driven.

Watch for:

- extra-variable precedence layers
- `set_stats` namespacing collisions
- artifacts that need explicit shape control
- secrets injected differently than local CLI runs
- event and stdout artifact retention becoming a sensitive-data store
- workflow approval nodes when production rollout requires human gatekeeping

Use `ansible-runner` when a stable programmatic interface, event stream, or artifact boundary is part of the actual requirement. Do not introduce it just to shell out locally.

Local AAP reproduction pattern: run `ansible-runner` with the same project, inventory, credential shape, and container image/EE that the controller uses; this catches controller-vs-laptop drift.

## Automation Mesh and Distributed Execution

Use mesh or remote execution nodes when network topology or latency makes central push execution painful.

Good reasons:

- isolated network segments
- edge sites
- strict firewall boundaries
- controller locality problems
- regulated zones where execution must stay local to an enclave

Do not recommend mesh for a small estate just because it is “enterprise.”

Mesh roles:

- control nodes perform controller-side work such as project and inventory updates
- execution nodes run automation jobs in EEs
- hop nodes relay traffic and should not run automation
- hybrid nodes combine control and execution for smaller topologies

Default receptor port is TCP 27199; verify firewall, mTLS trust, and instance-group mapping before blaming playbook code.

## Project-Local Dependency Loading

Whether or not the user uses AWX/AAP, prefer project-local content and explicit requirements.

Typical controls:

- `requirements.yml`
- repo-local `ansible.cfg`
- project-local `collections/`
- project-local `roles/`

## Related Tools

Ansible-related tools worth acknowledging when relevant:

- `ansible-playbook`
- `ansible-inventory`
- `ansible-config`
- `ansible-console`
- `ansible-doc`
- `ansible-builder`
- `ansible-navigator`
- `ansible-runner`
- AWX / Red Hat AAP controller workflows
- Private Automation Hub / Galaxy-NG
- Event-Driven Ansible / `ansible-rulebook`
- Molecule
- ansible-lint
- yamllint
- Testinfra or goss

Only recommend the ones that solve the actual problem.

## Runtime Drift Checklist

- Is the controller runtime pinned?
- Are collection versions pinned?
- Are controller-side Python libs pinned?
- Are system packages and base image pinned or mirrored?
- Is `ansible --version` captured in CI/job artifacts?
- Is `ansible-galaxy collection list` captured or reproducible?
- Does CI use the same runtime shape as production?
- Does the local engineer path match the controller path closely enough?

## Anti-Patterns

- mutable snowflake controllers
- global system installs shared across unrelated automation projects
- unversioned controller credentials or runtime packages
- “works locally” debug paths that bypass the production EE entirely
- turning on controller features before defining data and validation boundaries
- assuming AAP backup covers PAH content and EE image blobs without checking Pulp/container storage
- using job-template `latest` EE tags in production
