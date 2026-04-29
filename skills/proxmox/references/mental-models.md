# Proxmox VE Mental Models

Use this when the user asks how Proxmox works, wants senior-level understanding, or needs a conceptual comparison.

## Boundary Statement

Proxmox VE is a Debian-based management distribution around Linux virtualization primitives. It integrates KVM/QEMU VMs, LXC containers, storage plugins, Linux bridges, Corosync, `pmxcfs`, HA manager, firewall/RBAC, REST API, and optional Ceph/PBS integration.

It is not:

- a storage appliance by itself
- a backup strategy by itself
- Kubernetes or OpenStack
- application-level HA
- Ceph by default
- a VMware drop-in with identical HA/DRS/NSX/vSAN semantics

## Three Planes

| Plane | Examples | Senior question |
|---|---|---|
| Control plane | API/UI, `pveproxy`, Corosync, `pmxcfs`, HA manager | Can the cluster make safe decisions under partial failure? |
| Data plane | VM disk I/O, ZFS, Ceph, NFS/iSCSI, guest networks | Can workloads read/write predictably under normal and degraded states? |
| Recovery plane | `vzdump`, PBS, restore docs, encryption keys, offsite copies | Can we rebuild after deletion, corruption, compromise, or total node loss? |

Most weak designs overbuild the data plane and under-test the recovery plane.

## Control-Plane Flow

The GUI is an interface, not the source of truth. A typical management request flows through:

```text
UI/API on :8006 -> pveproxy -> pvedaemon / API handlers / pvesh model
  -> /etc/pve via pmxcfs -> local subsystem daemons react
```

Important pieces:

- `pveproxy` exposes the web/API entry point.
- `pvedaemon` handles privileged backend work.
- `pvesh` reflects the JSON-Schema-defined API model.
- `pmxcfs` stores and replicates cluster configuration under `/etc/pve`.
- `pvestatd` contributes status and metrics propagation.

Senior implication: when GUI state looks wrong, inspect API/task logs, daemon state, `pmxcfs`, and subsystem logs before assuming the UI is the platform.

## Five Debugging Planes

For incidents, a more detailed split is often useful:

| Plane | Examples | First question |
|---|---|---|
| Host | Debian packages, kernel, bootloader, firmware, NIC names | Did the host contract change? |
| Guest | QEMU VM, LXC, guest agent, CPU model, passthrough, app runtime | Is the guest or its runtime broken? |
| Storage | backend semantics, mounts, thin pools, ZFS, Ceph, replication | Is the requested operation supported and healthy? |
| Cluster | Corosync, quorum, locks, `pmxcfs`, ownership | Can the cluster safely coordinate? |
| Recovery | backups, PBS, restore keys, runbooks, HA behavior | Can we recover without improvising? |

Use three planes for design simplicity and five planes for debugging precision.

## The 20% That Unlocks 80%

1. `/etc/pve` is backed by `pmxcfs`, not an ordinary directory. Read-only on quorum loss is a safety feature.
2. Storage definitions are cluster-wide, but `shared` is metadata, not proof of physical shared storage.
3. HA restarts VMs/CTs after failure; it does not preserve in-guest application state.
4. CPU type choice is a migration boundary. `host` exposes host-specific flags that may block migration.
5. Thin provisioning, ZFS pool design, and Ceph recovery have failure shapes that must be monitored before they hurt guests.
6. Corosync/network instability can look like random HA, GUI, or node failure.
7. Snapshots are point-in-time mechanisms; backups are independent recovery artifacts.
8. LXC containers are not lighter VMs. They share the host kernel and have different isolation and migration semantics.

## Senior Operator Heuristics

- Translate GUI symptoms into primitives: QEMU process, VM config, storage volume, bridge, host resources, task log.
- Treat clustered PVE as a distributed system, not “single node plus UI.”
- Design by failure domain: node, disk, controller, switch, rack, admin credential, backup target, encryption key.
- Size for recovery, not just normal operation. Ceph and backups both become busiest during failure or maintenance.
- Keep Corosync boring: low latency, low loss, stable MTU, predictable bond behavior.
- Test restore, migration, quorum loss, and HA failover before depending on them.

## Common Misconceptions

| Claim | Correction |
|---|---|
| “I have a cluster, so I have HA.” | Cluster = shared management/quorum/config. HA = configured restart behavior with fencing, placement, storage, and testing. |
| “I have snapshots, so I have backups.” | Snapshots often share the same failure domain as the source. |
| “Ceph is required for real Proxmox.” | Ceph is optional distributed storage. Use it only when requirements justify operating it. |
| “HA means no downtime.” | PVE HA usually means crash/restart elsewhere. App-level HA is separate. |
| “The GUI accepted it, so the design is safe.” | The GUI can configure fragile storage/network/HA designs. |
| “Backups are full, so PBS gives no incremental benefit.” | PVE backups are logically full, but PBS can still reduce transfer/storage through chunking and dirty bitmaps. |
| “LXC is just a lighter VM.” | LXC is a system-container model with shared-kernel, isolation, and migration differences. |

## Shallow Understanding Checks

Ask these to expose gaps:

- Why can `/etc/pve` become read-only?
- What is the difference between cluster and HA?
- When is Ceph the wrong choice?
- Why might `cpu: host` block migration?
- How would you prove a backup strategy works?
- What happens when a thin pool fills?
- What does the QEMU Guest Agent not solve?
- Which partition stays writable during quorum loss, and why?

## Evidence Discipline

Use these tags when helpful:

- `[P]` primary/official docs or observed local output
- `[C]` broad operational consensus
- `[F]` field heuristic or practitioner inference
- `[V]` version-sensitive claim
- `[D]` disputed or context-dependent claim

When a claim affects production, prefer `[P]` or local evidence over `[F]`.
