# Debugging and Incidents

Use this for failures, weird cluster behavior, slow storage, failed migration, HA surprises, backup hangs, network symptoms, and “Proxmox is down.”

## Incident Stance

Diagnose then act. Avoid rebooting, deleting locks, overriding quorum, forcing HA state, or changing networking until the failure layer is identified.

Always separate:

- control plane: UI/API/Corosync/`pmxcfs`/HA manager
- data plane: guest I/O, ZFS/Ceph/NFS/iSCSI, bridges/VLANs
- recovery plane: backups/PBS/restore/keys

## Senior Triage Tree

```text
Something is wrong.
├─ Cluster-wide?
│  ├─ /etc/pve read-only -> quorum / pmxcfs / Corosync
│  ├─ random fences -> Corosync loss, watchdog, network jitter
│  └─ GUI shows nodes offline -> verify from each node before trusting UI
├─ Single-node?
│  ├─ high iowait -> storage latency, ZFS ARC, thin pool, failing disk
│  ├─ random reboot -> watchdog, kernel, power, MCE, thermal
│  └─ boot issue after upgrade -> bootloader/ESP/kernel/ZFS-on-root
├─ Single VM?
│  ├─ running but unreachable -> guest OS/network first, not PVE first
│  ├─ backup hangs -> guest agent/fsfreeze/app I/O/storage latency
│  ├─ migration fails -> CPU/storage/bridge/passthrough/virtiofs/machine compatibility
│  └─ snapshot fails -> backend capability or volume state
└─ Storage?
   ├─ Ceph slow ops -> MTU/path/OSD/media/recovery/backfill
   ├─ ZFS errors -> zpool status, SMART, scrub, controller, ARC pressure
   └─ LVM-thin near full -> writes at risk, extend or evacuate carefully
```

## Read-Only Probe Bias

Prefer probes that observe state before mutating it. Examples to consider on a real host only when authorized:

- cluster: `pvecm status`, `corosync-cfgtool -s`
- services/logs: `journalctl -u pve-cluster -u corosync -u pve-ha-lrm -u pve-ha-crm`
- tasks/UI: task log, UPID, `/var/log/pveproxy/access.log`
- storage: `pvesm status`, `zpool status`, LVM data/metadata percent, Ceph health
- network: bridge/bond/VLAN/route state, NIC errors, MTU path tests
- VM: `qm config <id>`, guest agent status, console/noVNC, boot order, disk presence

Do not execute these blindly in final answers as if connected to the host; present them as probes unless the user asked you to run commands on a provided environment.

## Symptom Table

| Symptom | Likely layer | First probes | Common trap |
|---|---|---|---|
| `/etc/pve` write fails/read-only | quorum / `pmxcfs` | quorum, Corosync membership, votes | chmod/rebooting randomly |
| VM migration “feature not supported” | CPU/machine/passthrough | CPU type, flags, target capabilities | restarting cluster services |
| Migration slow or wrong NIC | network/routing | migration network, route to peer, link counters | assuming GUI option changed route |
| Backup hangs at freeze | guest/app/storage | guest agent, fsfreeze, DB I/O, task log | blaming PBS immediately |
| Ceph slow ops, ping OK | storage network | MTU end-to-end, OSD perf, NIC errors | trusting simple ping |
| Host disappears after network change | management bridge | console/IPMI, bridge/NIC/IP config | applying more remote changes |
| HA VM in error/fence | HA/watchdog/state | HA logs, CRM/LRM status, quorum | manual duplicate start |
| Failed-node VM on shared storage | ownership/locks/fencing | prove node is off/fenced, check HA state, config owner, storage health | starting duplicate guest because disk is visible |
| VM running but unreachable | guest/network | console, guest OS, VM NIC, bridge/VLAN | rebooting host |

## The HA Log Bundle

For HA/cluster weirdness, correlate timestamps across:

- `pve-cluster`
- `corosync`
- `pveproxy`
- `pvedaemon`
- `pvestatd`
- `pve-ha-lrm`
- `pve-ha-crm`
- `pve-firewall` / `proxmox-firewall` when firewall behavior is involved
- watchdog/kernel logs
- storage/Ceph logs if VM disks are shared

One-node view can lie during partitions. Compare from multiple nodes.

## Stop Conditions

Stop and ask before suggesting mutation when:

- quorum is lost and user wants to force expected votes
- storage is degraded/full and user wants deletion or repair
- network changes may cut off remote access
- HA state suggests possible duplicate ownership
- a failed-node guest must be recovered manually from shared storage
- backups/keys have not been confirmed
- the command can destroy, overwrite, or irreversibly change cluster state

## Incident Report Shape

Use this output for debugging:

1. `Likely layer`
2. `Why this fits`
3. `Do not do yet`
4. `Read-only probes`
5. `Decision point after probes`
6. `Risk if wrong`

## Field Failure Patterns

- Quorum loss makes `/etc/pve` read-only; this is safety, not a permission bug.
- `cpu: host` works until hardware changes and live migration fails.
- Thin pools fill silently until guests hit write failures.
- Ceph recovery can saturate networks and create second-order Corosync issues.
- Missing guest agent degrades shutdown, backup, and IP reporting.
- Snippets and local ISOs can break after migration or at next boot.
- Boot failures after upgrades may involve ESP/kernel synchronization on ZFS-on-root systems.
- PVE 8->9-style upgrades can expose NIC naming, `/tmp` tmpfs, cgroup v1 removal, GlusterFS removal, NVIDIA vGPU, and FRR/SDN edge cases.
- `pveperf` is a smell test, not a capacity plan.
- Firewall truth is the compiled/generated ruleset, not only the declarative rule you intended.
