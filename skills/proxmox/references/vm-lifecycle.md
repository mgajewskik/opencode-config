# VM Lifecycle and Template Standards

Use this for VM creation, templates, cloud-init, migration readiness, guest tuning, and `qm`/GUI choices.

## VM Creation Decision Frame

Before choosing hardware options, classify the workload:

- disposable vs stateful
- latency-sensitive vs ordinary
- migration-sensitive vs pinned to one host
- Linux vs Windows vs appliance vs LXC candidate
- security-sensitive or requiring TPM/Secure Boot
- backup/restore priority and RPO/RTO

## Senior VM Defaults, With Caveats

| Area | Conservative default | Why | Caveat |
|---|---|---|---|
| Machine | `q35` for new modern VMs | PCIe, modern device model, passthrough/vIOMMU friendliness | Existing legacy VMs may stay on i440fx unless migration/testing justifies change. |
| BIOS | OVMF/UEFI for modern OSes | Secure Boot/TPM/Win11 compatibility | SeaBIOS is still fine for simple legacy guests. |
| Disk controller | VirtIO SCSI / `virtio-scsi-single` where supported | Paravirtual performance, per-disk tuning | Validate guest drivers, especially Windows and appliances. |
| Guest agent | Enable in PVE and install in guest | Clean shutdown, IP reporting, freeze/thaw, better backups | Not a substitute for application-consistent DB backups. |
| CPU | Portable baseline for mixed clusters; `host` only with intent | Live migration compatibility | Workloads may require host flags, nested virt, or homogeneous hosts. |
| Network | VirtIO NIC | Common high-performance paravirtual NIC | Windows needs VirtIO drivers. High PPS may need multiqueue. |
| Cloud-init | Use for repeatable Linux templates | Eliminates snowflake installs | Snippets must exist on all nodes or shared snippets storage. |
| Backup flag | Decide per disk | Secondary disks are often forgotten | Excluding a data disk must be explicit and documented. |

## Template Checklist

- Pick a VMID convention, commonly high IDs for templates.
- Use cloud image or clean install prepared for cloud-init.
- Install and enable QEMU Guest Agent.
- Install VirtIO drivers for Windows before relying on VirtIO disks/NICs.
- Clean host keys, machine IDs, cloud-init state, package caches as appropriate for the OS.
- Attach cloud-init drive and validate NoCloud datasource.
- Document CPU type, BIOS, disk controller, backup inclusion, tags, owner, and intended clone usage.
- Test full clone and linked clone behavior. Linked clones depend on the template.

## Migration Readiness Checklist

- Destination has compatible CPU flags for the running VM.
- Destination has the same bridge names and VLAN reachability.
- VM disks live on shared storage or storage migration is planned.
- No local-only ISO, snippets, cloud-init files, or hook scripts are required at next boot.
- No `virtiofs`, PCI/USB passthrough, host-pinned device, or other local resource blocks live migration.
- Target has enough CPU, RAM, storage IOPS, and backup window capacity.
- Machine version and QEMU behavior are compatible across nodes.

Migration mode matters:

- **Live migration** requires compatible CPU, network, storage, guest/device, and QEMU conditions.
- **Offline migration** can tolerate more constraints but still needs target storage/network compatibility.
- **Restart migration** is the realistic model for LXC containers and some constrained guests.

If the workload might be an LXC instead of a VM, read [lxc-containers.md](lxc-containers.md) before standardizing.

## Linux Guest Notes

- Prefer VirtIO devices and QEMU Guest Agent.
- Use cloud-init for repeatability.
- For database/JVM/latency-sensitive guests, be cautious with memory ballooning and overcommit.
- Use application-level backup/replication for low-RPO databases; PVE HA is infrastructure restart.

## Windows Guest Notes

- Plan VirtIO driver ISO during installation.
- Windows 11 usually implies OVMF/UEFI plus TPM.
- Windows VBS/nested-virtualization scenarios are version-sensitive; PVE 9.1 adds finer nested virtualization controls, but validate against installed docs before standardizing.
- Validate guest agent service status after installation.
- Ballooning and shutdown semantics can differ from Linux; test under actual maintenance workflows.

## Common VM Footguns

- `cpu: host` across heterogeneous hosts blocks future live migration.
- Missing guest agent causes poor shutdown, IP reporting, and backup consistency behavior.
- Cloud-init snippets on node-local storage break after migration or next boot.
- Secondary disks excluded from backup by accident create partial restores.
- PCI passthrough ties VM to host and usually blocks live migration.
- `virtiofs` can block live migration and snapshots with RAM/hibernation; check current PVE docs before using it in migration-sensitive templates.
- “Convert to template” is not a normal reversible lifecycle operation; clone rather than mutate production templates.

## Validation

For a new standard, prove it with disposable VMs:

1. Create from template.
2. Boot and verify cloud-init applied.
3. Confirm guest agent reports status/IP.
4. Run backup and restore to a new VMID.
5. Migrate live/offline according to intended storage model.
6. Reboot after migration and verify networking/cloud-init snippets still work.
