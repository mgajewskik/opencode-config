# Backup and Recovery

Use this for `vzdump`, Proxmox Backup Server, snapshots vs backups, retention, encryption keys, restore drills, and RPO/RTO design.

## Recovery Principle

A backup strategy is proven by restore evidence, not by green backup jobs.

## Snapshots vs Backups

Snapshots:

- depend on storage backend
- often share the source failure domain
- are useful for short rollback and operational safety
- can be destroyed by storage failure, ransomware, or operator error

Backups:

- are independent recovery artifacts
- include VM/CT configuration plus data
- should survive source VM, node, storage, and cluster loss
- require retention, offsite/off-host copies, verification, and restore drills

## vzdump

`vzdump` is PVE's integrated backup mechanism. Backup mode affects downtime and consistency. QEMU live backup can work across many storage types, but application consistency still depends on guest/application cooperation.

Important nuance: PVE backup jobs are often logically full backups from the recovery model perspective, but PBS targets can make transfer and storage efficient through chunking, deduplication, and dirty bitmaps. Do not translate “logical full backup” into “PBS gives no incremental benefit.”

Use `vzdump` when:

- simple full backups are enough
- backup size/window is manageable
- target is independent enough for the risk

Do not mistake a local `vzdump` target on the VM storage pool for disaster recovery.

## Proxmox Backup Server

PBS is usually preferred when deduplication, incremental transfer, verification, encryption, remote sync, or ransomware resilience matter.

PBS gives:

- client-server backup model
- deduplicated chunk storage
- incremental transfer/storage efficiency via chunking, deduplication, and dirty bitmaps where supported
- compression
- TLS and optional client-side encryption
- verification jobs
- remote sync and tape/S3-related workflows depending on version

PBS does not give:

- primary VM storage
- application HA
- automatic recovery proof
- key recovery if encryption keys are lost

## RPO/RTO Questions

- How much data loss is acceptable per workload?
- How long can restore take?
- Does the restore target still exist if the original cluster is gone?
- Are encryption keys and credentials recoverable by the right people?
- Is file-level restore needed, or full-VM restore enough?
- Are app-level backups required for databases?

## Restore Drill Checklist

For each backup class:

1. Restore to a new VMID or isolated target.
2. Boot the VM.
3. Verify network identity does not collide with production.
4. Validate application data, not only OS boot.
5. Test file-level restore if promised.
6. Test restore when original VM/storage/node is unavailable.
7. Verify encrypted key recovery.
8. Measure time to restore and document RTO evidence.

## Backup Failure Modes

| Failure | Symptom | Prevention |
|---|---|---|
| Backup target shares fate with cluster | storage/node loss destroys source and backup | off-host/offsite target, PBS sync, separate failure domain |
| Missing encryption key | backup exists but cannot be read | key escrow and recovery drill |
| Application-inconsistent backup | VM boots but DB/app corrupt | guest agent plus app-aware hooks/dumps/replication |
| Full-vs-incremental misunderstanding | PBS value underestimated or backup windows misplanned | separate logical backup semantics from transfer/storage implementation |
| Retention/prune mistake | expected recovery point missing | retention simulation and documented policy |
| Backup window saturates storage | guest latency, slow jobs, missed windows | monitor duration, bandwidth, I/O, schedule, throttling |

## Security and Ransomware Notes

- Backup credentials should not allow broad destructive access from compromised guests.
- API tokens and PBS users should be least-privilege.
- Protect prune/delete operations.
- Keep at least one recovery path outside the main cluster's admin blast radius.
- Periodically verify that restored data predates compromise when ransomware is the scenario.

## Smells

- “Snapshots before upgrade” is the only DR plan.
- PBS runs as a VM only on the cluster it protects.
- No one knows where encryption keys are.
- Backup policy excludes secondary data disks without documentation.
- Restore has never been tested after a major storage or network change.
