# Proxmox Quick Reference

Fast lookup for mode routing, red flags, probes, and source hierarchy.

## Mode Routing

| User asks about | Load |
|---|---|
| “How does Proxmox work?” | `mental-models.md` |
| create VM, template, cloud-init, Windows VM | `vm-lifecycle.md` |
| LXC, Docker-in-LXC, container vs VM | `lxc-containers.md` |
| ZFS, LVM-thin, Ceph, snapshots, shared storage | `storage.md` |
| bridge, VLAN, bond, MTU, SDN | `networking.md` |
| cluster, quorum, `/etc/pve`, QDevice, HA | `cluster-ha.md` |
| backup, PBS, restore, retention | `backup-recovery.md` |
| broken cluster, failed migration, slow storage | `debugging-incidents.md` |
| security, upgrades, repos, RBAC, automation | `operations-security.md` |

## Red Flags

- “Snapshots are backups.”
- “2-node cluster is HA.”
- “Just use Ceph.”
- “Use `cpu: host` everywhere.”
- “The GUI succeeded, so design is fine.”
- “PBS is only a VM on the cluster it backs up.”
- “Expose UI publicly with password login.”
- “Force quorum to fix it.”
- “Docker-in-LXC is production default.”
- “Shared disks mean failed-node VMs can always be started elsewhere immediately.”
- “Backups are full, so PBS is not incremental.”
- “Disable firewall/Spectre/mitigations because forum said so.”
- “No restore test, but backup jobs are green.”

## Read-Only Probes to Suggest Before Mutation

- PVE version: `pveversion -v`
- Cluster: `pvecm status`, `corosync-cfgtool -s`
- Logs: `journalctl -u pve-cluster -u corosync -u pve-ha-lrm -u pve-ha-crm`
- Storage: `pvesm status`, ZFS/LVM/Ceph health commands appropriate to backend
- VM config: `qm config <vmid>`
- Backup/task: task log/UPID, PBS verification status
- Network: bridge/bond/VLAN/route state, NIC errors, MTU path validation

Present commands as candidate probes unless the user explicitly asks to run them in a safe environment.

## Must-Ask Context

- PVE version and current release line
- single node vs cluster size
- storage backend for VM disks
- network topology for management/Corosync/storage/migration
- backup target and last restore test
- VM vs LXC and whether live migration is required
- production vs lab/disposable
- out-of-band console availability

## Source Hierarchy

1. Local live evidence: command output, config, task logs, observed behavior.
2. Official Proxmox docs/admin guide for the installed version.
3. Proxmox release notes/roadmap and known issues.
4. Upstream docs for QEMU, Ceph, OpenZFS, Corosync where relevant.
5. Proxmox staff/forum/mailing list and practitioner blogs as field heuristics.
6. Reddit/community scripts only as ideas to audit, not authority.

## Source Map

Primary official references:

- Proxmox VE Administration Guide: https://pve.proxmox.com/pve-docs/pve-admin-guide.html
- Proxmox VE Roadmap/Release History: https://pve.proxmox.com/wiki/Roadmap
- QEMU/KVM chapter: https://pve.proxmox.com/pve-docs/chapter-qm.html
- Storage chapter: https://pve.proxmox.com/pve-docs/chapter-pvesm.html
- Cluster manager chapter: https://pve.proxmox.com/pve-docs/chapter-pvecm.html
- Backup/restore chapter: https://pve.proxmox.com/pve-docs/chapter-vzdump.html
- HA manager chapter: https://pve.proxmox.com/pve-docs/chapter-ha-manager.html
- Ceph integration chapter: https://pve.proxmox.com/pve-docs/chapter-pveceph.html
- User/RBAC chapter: https://pve.proxmox.com/pve-docs/chapter-pveum.html
- PBS docs: https://pbs.proxmox.com/docs/introduction.html
- Proxmox Datacenter Manager: verify current official docs before relying on PDM behavior
- Ceph docs: https://docs.ceph.com/
- OpenZFS docs: https://openzfs.github.io/openzfs-docs/

## Compact Output Templates

### Design Answer

1. Verdict
2. Assumptions/version caveats
3. Recommended pattern
4. Why this fits the failure domains
5. Risks/anti-patterns avoided
6. Validation drill
7. Next step

### Incident Answer

1. Likely layer
2. Why this fits
3. Do not do yet
4. Read-only probes
5. Decision point after probes
6. Risk if wrong

### Review Answer

1. Verdict
2. Blockers
3. Risks
4. Evidence
5. Suggested fixes
6. Smallest next step
