---
name: proxmox
description: Senior-level Proxmox VE guidance for VM creation, templates, storage, ZFS, Ceph, networking, clusters, HA, PBS backups, debugging, upgrades, security, and production/homelab operations. Use when working with Proxmox, PVE, Proxmox VE, qm, pct, pvesm, pvecm, pmxcfs, HA manager, Proxmox Backup Server, VM migration, Proxmox incidents, or Ceph/ZFS/Corosync/VLAN bridges in a Proxmox VE context.
---

# Proxmox VE

Production-minded Proxmox VE guidance for experienced Linux/DevOps operators. Optimize for correct mental models, failure-mode reasoning, safe operations, and minimal changes. Skip beginner virtualization explanations unless the user asks.

This skill combines senior Proxmox field intuition with official-doc discipline and PVE 9 caveats. Treat practitioner claims as heuristics until validated against local version, docs, or live evidence.

## Start Here

Classify the request, then load only the smallest useful reference.

- Architecture, boundaries, senior mental models, shallow-understanding checks -> read [references/mental-models.md](references/mental-models.md)
- Creating VMs, templates, cloud-init, CPU types, q35/OVMF, VirtIO, guest agent, Windows/Linux guest choices -> read [references/vm-lifecycle.md](references/vm-lifecycle.md)
- LXC containers, VM-vs-container decisions, Docker-in-LXC, privileged/unprivileged containers, restart migration -> read [references/lxc-containers.md](references/lxc-containers.md)
- Storage design, LVM-thin, ZFS, NFS/iSCSI, Ceph RBD/CephFS, thin provisioning, snapshots -> read [references/storage.md](references/storage.md)
- Linux bridges, VLAN-aware bridges, bonds, MTU, Corosync/storage networks, SDN/EVPN caveats -> read [references/networking.md](references/networking.md)
- Clustering, quorum, `pmxcfs`, QDevice, HA manager, watchdog/fencing, migration/failover semantics -> read [references/cluster-ha.md](references/cluster-ha.md)
- Backups, PBS, `vzdump`, restore drills, RPO/RTO, encryption keys, ransomware/failure-domain concerns -> read [references/backup-recovery.md](references/backup-recovery.md)
- Incidents, debugging triage, logs, metrics, read-only probes, senior-vs-novice diagnosis -> read [references/debugging-incidents.md](references/debugging-incidents.md)
- Security, RBAC, API tokens, repositories, upgrades, monitoring, automation, air-gapped/regulated posture -> read [references/operations-security.md](references/operations-security.md)
- Fast lookup, red flags, source hierarchy, and links -> read [references/quick-reference.md](references/quick-reference.md)

## Use This Skill For

- designing or reviewing Proxmox VE homelab, small production, or on-prem clusters
- creating VM standards, templates, cloud-init workflows, and migration-ready defaults
- choosing storage: local LVM-thin/ZFS, shared NFS/iSCSI, Ceph, or PBS as backup target
- debugging PVE incidents across cluster, storage, network, VM, backup, or HA layers
- planning upgrades, repository policy, monitoring, security, RBAC, and automation
- comparing Proxmox with VMware, OpenStack, KubeVirt, XCP-ng, libvirt, or Hyper-V

## Do Not Use This Skill For

- blind command execution on a live Proxmox host
- generic Linux, QEMU, Ceph, or ZFS reference when the task is not Proxmox-shaped
- treating forum/community workarounds as official facts
- production Ceph sizing without hardware, workload, network, and recovery requirements
- legal/compliance conclusions about subscriptions or regulated environments

## Default Operating Stance

- Diagnose before changing anything. Prefer read-only probes first.
- Separate control plane, data plane, and recovery plane.
- Treat PVE version, kernel, QEMU, Ceph, ZFS, and firewall/SDN maturity as version-sensitive.
- Prefer official Proxmox docs, local `pveversion -v`, local config, and task logs over memory.
- Use practitioner guidance for failure-mode intuition, but label it as heuristic when not source-verified.
- Preserve user control for risky operations: network changes, quorum override, HA state changes, storage mutation, upgrades, repo changes, destructive VM operations.
- For broad design work, state success criteria, anti-criteria, failure domains, and validation drills.

## Core Mental Models

1. **Proxmox wraps Linux primitives.** GUI symptoms map to QEMU, LXC, storage plugins, Linux bridges, Corosync, `pmxcfs`, and task logs.
2. **Clustered PVE is a distributed system.** Quorum and `pmxcfs` protect correctness, not convenience.
3. **Availability is not durability.** HA, shared storage, ZFS, Ceph, snapshots, and backups solve different problems.
4. **Storage decides feature semantics.** Snapshot, migration, HA, backup mode, latency, and recovery behavior depend on backend design.
5. **Networking couples failures.** A VLAN/MTU/bond mistake can break guests, storage, Corosync, or management.
6. **HA restarts services.** It does not provide application-level zero downtime or replace backups.
7. **A green backup job is not recovery evidence.** Restore drills are the proof.

## Interview Triggers

Ask focused questions before giving final guidance when any are true:

- the task touches production, HA, quorum, Ceph, ZFS pool layout, network bridges, or upgrades
- the user asks for commands that mutate cluster, storage, network, repo, or HA state
- the answer depends on PVE major/minor version or SDN/firewall feature maturity
- hardware, network topology, storage backend, or failure-domain assumptions are missing
- the user asks for “best practices” without context and the decision is workload-dependent

High-value questions:

1. What PVE version and kernel are in use? (`pveversion -v` if available)
2. Single node, 2-node + QDevice, 3-node, or larger cluster?
3. What storage backs VM disks: LVM-thin, ZFS, NFS, iSCSI, Ceph RBD, other?
4. What is the failure target: homelab learning, small business uptime, regulated production, or migration from VMware?
5. What are RPO/RTO targets and has restore been tested?
6. Is there out-of-band console/IPMI before network changes?
7. Is the operation read-only, reversible, or destructive?

## Mode Router

Choose one primary mode and at most one secondary mode.

| Mode | Use when | Load |
|---|---|---|
| `model` | learning, architecture, “how Proxmox works”, conceptual comparison | `references/mental-models.md` |
| `vm` | VM creation, template standards, cloud-init, guest options, migration readiness | `references/vm-lifecycle.md` |
| `container` | LXC, privileged/unprivileged containers, Docker-in-LXC, OCI templates, VM-vs-container choice | `references/lxc-containers.md` |
| `storage` | LVM-thin, ZFS, Ceph, NFS/iSCSI, snapshots, capacity, performance | `references/storage.md` |
| `network` | bridges, VLANs, bonds, MTU, SDN, Corosync/storage network design | `references/networking.md` |
| `cluster-ha` | quorum, `pmxcfs`, QDevice, HA manager, watchdog, failover | `references/cluster-ha.md` |
| `backup` | `vzdump`, PBS, restore, retention, encryption, RPO/RTO | `references/backup-recovery.md` |
| `debug` | incidents, errors, stuck tasks, slow storage, failed migration, weird HA | `references/debugging-incidents.md` |
| `ops` | security, RBAC, repos, upgrades, monitoring, automation, air-gap | `references/operations-security.md` |

Common combinations:

- `vm` + `storage`
- `vm` + `container` for VM-vs-LXC placement decisions
- `storage` + `backup`
- `network` + `cluster-ha`
- `debug` + the suspected layer
- `ops` + `cluster-ha` for production readiness

## Core Workflow

1. Identify mode, PVE version assumptions, topology, storage backend, and blast radius.
2. Load only the matching reference file.
3. Name the likely failure domain or design decision.
4. Prefer the smallest safe probe or change.
5. Separate official facts, practitioner heuristics, and local assumptions.
6. Include validation: command output to inspect, restore/failover drill, config evidence, or source link.
7. For risky operations, give a preflight checklist and require explicit approval before mutation.

## Output Contract

Default response shape:

1. `Verdict` - concise direction or likely failure layer.
2. `Why` - mechanism-level explanation.
3. `Recommended pattern` - smallest practical design or next action.
4. `Risks / edge cases` - version caveats, failure domains, and false positives.
5. `Validation` - smallest convincing probe, test, or drill.
6. `Next step` - one concrete action.

For reviews, use: `Verdict`, `Blockers`, `Risks`, `Evidence`, `Suggested fixes`, `Smallest next step`.

For incidents, add: `Do not do yet`, `Likely layer`, `Read-only probes`, `Stop condition`.

## Guardrails

- Do not conflate snapshots with backups, cluster membership with HA, or Ceph with required storage.
- Do not recommend `pvecm expected 1`, HA state edits, storage deletion, repo changes, network reloads, or major upgrades as casual fixes.
- Do not suggest exposing the PVE UI/API directly to untrusted networks.
- Do not assume `cpu: host` is best; migration portability is a first-class requirement.
- Do not assume 2 nodes are HA without a QDevice or explicit risk acceptance.
- Do not recommend PBS only on the same cluster/storage/failure domain it protects as a complete DR strategy.
- Do not treat `shared 1` in `storage.cfg` as proof that storage is physically shared.
- Do not run or suggest destructive commands without backup/rollback context and explicit user approval.

## Success Criteria

Pass when all are true:

- advice maps to the actual Proxmox layer involved
- version-sensitive claims are labelled or locally validated
- failure domains and recovery assumptions are explicit
- storage, network, HA, and backup are not conflated
- recommendations include a validation path
- risky operations are gated behind preflight and approval

Fail when any are true:

- answer is a generic virtualization tutorial
- forum advice is presented as official fact
- command-first response mutates production before diagnosis
- backups are treated as green jobs instead of restore-tested recovery artifacts
- cluster/HA/Ceph are recommended as badges rather than requirements-driven choices
