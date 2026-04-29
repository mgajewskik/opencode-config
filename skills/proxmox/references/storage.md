# Storage Design

Use this for LVM-thin, ZFS, directory/qcow2, NFS/CIFS, iSCSI, Ceph RBD/CephFS, snapshots, thin provisioning, and storage performance questions.

## Storage First Principles

- Storage design starts with failure domain and recovery, not benchmarks.
- “Shared” enables mobility but can centralize failure.
- Thin provisioning improves utilization but creates pool-full write failures.
- Snapshots depend on backend semantics; backups must survive source storage failure.
- Latency incidents often appear before hard storage failures.
- Storage replication is not shared storage. It bounds RPO for local-storage designs but does not erase ownership, locking, or migration constraints.

## Decision Table

| Backend | Best fit | Strengths | Risks/traps | Senior checks |
|---|---|---|---|---|
| Local LVM-thin | Simple VM storage, local-performance clusters | Efficient thin volumes, common | Pool-full EIO/pauses, weaker integrity story than ZFS | Alerts on data/metadata %, discard/TRIM, backups. |
| Local ZFS | Single-node or replicated local storage | Checksums, snapshots, compression, mirrors/RAIDZ | Hardware sensitivity, vdev/ashift/recordsize decisions | HBA not RAID, ECC/power stability, scrub, SMART, ashift. |
| Directory/qcow2 | Small labs, simple file-backed storage | Easy to inspect/copy, qcow2 snapshots | Fragmentation, snapshot chains, performance surprises | Cache mode, snapshot support, backup consistency. |
| NFS/CIFS | Existing NAS/shared storage | Simple shared access, live migration without disk copy | NAS/SAN as SPOF, latency, lock semantics | NAS redundancy, network, restore plan if NAS dies. |
| iSCSI/LVM | SAN-style shared block | Enterprise-familiar | Multipath/fencing/locking complexity | Multipath tests, storage vendor behavior, failover drills. |
| Ceph RBD | Hyperconverged shared block | Self-healing, scale-out, PVE integration | Distributed storage complexity, recovery latency, network/disk sensitivity | OSD count, dedicated capacity, MTU, slow ops, backfill behavior. |
| CephFS | Shared file content | ISOs, snippets, backups, shared files | Not the default VM block choice | MDS health, placement, permissions, workload type. |
| PBS | Backup repository | Dedup, chunk-based transfer/storage efficiency, encryption, verification, sync | Not primary VM storage; key/retention mistakes | Restore drills, offsite sync, key escrow, prune/GC/verify. |

## ZFS Notes

Use ZFS when you want local data integrity features and can operate the hardware assumptions.

Watch:

- hardware RAID under ZFS hides disks and weakens self-healing visibility
- `ashift` and vdev layout are hard to change later
- mirrors often fit VM random I/O better than large RAIDZ vdevs
- `volblocksize` matters for zvol workloads and is immutable per zvol
- ARC memory behavior should be observed and tuned only with version/context awareness
- scrubs, SMART, UPS, controller behavior, and ECC/power-loss properties matter

## Ceph Notes

Use Ceph when distributed shared storage is a requirement and the team can operate it.

Good fit:

- enough nodes/disks for failure and maintenance
- reliable, well-tested storage network
- monitoring for OSD health, slow ops, recovery/backfill, near-full ratios
- acceptance that recovery consumes capacity and bandwidth

Poor fit:

- tiny cluster with weak network
- consumer disks without power-loss protection for serious write workloads
- no operator comfort with distributed storage
- “we need Ceph because tutorials use it”

Senior Ceph questions:

- What happens during one node maintenance plus one disk failure?
- What traffic shares the Ceph network with Corosync or migration?
- What is the near-full and backfill behavior under load?
- What is the measured VM latency during recovery?

## Thin Provisioning Failure Shape

When a thin pool fills, guest writes can fail or guests can pause/crash. Backup, snapshot, and migration jobs may fail too. Monitor before critical thresholds and test discard/TRIM behavior from guest to physical backend.

## PVE 9 Volume-Chain Snapshot Caveat

PVE 9 added thick-LVM VM snapshots via volume chains, aimed partly at traditional SAN/LVM environments. Treat this as version-sensitive and not-yet-boring:

- it can make thick-LVM/SAN patterns more capable than older assumptions suggest
- the feature has technology-preview and migration caveats in 9.x-era docs
- VMs with snapshots on local storage using volume chains can have migration restrictions
- standardize it only after checking installed-version docs and testing snapshot, rollback, migration, backup, and restore behavior

Use this as a reminder to validate current backend capabilities rather than relying on old “LVM has no snapshots” folk knowledge.

## Replication Traffic Planning

At scale, replication and migration traffic need explicit network planning. PVE 9 adds support for dedicated storage-replication traffic paths; use this when replication traffic would otherwise contend with Corosync, migration, or guest I/O.

## Snapshot vs Backup

Snapshots:

- fast local point-in-time mechanisms
- often share the same storage and admin plane
- useful for rollback, not disaster recovery

Backups:

- separate recovery artifacts
- must survive VM deletion, storage failure, operator error, ransomware, and cluster loss
- require restore tests and key recovery validation

## Storage Smells

- Backups land on the same pool as VM disks and nowhere else.
- `shared 1` set on storage that is actually node-local.
- Ceph pool with unsafe `min_size` or no capacity headroom.
- Thin pool has no alerting or discard strategy.
- ZFS pool uses opaque hardware RAID or unknown sector alignment.
- Production VMs use `dir` raw images expecting snapshots.
- PBS runs only inside the cluster it protects.

## Validation

- Inspect actual storage type/content and node restrictions.
- Test snapshot, backup, restore, live migration, and storage-loss behavior for each storage class.
- For replicated local storage, test the actual RPO and recovery path; do not assume shared-storage semantics.
- Measure latency during backup and recovery, not only idle performance.
- Confirm restore works when original node/storage/VMID is gone.
