# Cluster, Quorum, pmxcfs, and HA

Use this for clustering, quorum loss, `pmxcfs`, QDevice, HA manager, watchdog/fencing, migration, and failover semantics.

## Cluster Is Not HA

Cluster gives:

- multi-node management
- shared cluster configuration
- Corosync membership/quorum
- migration coordination
- shared firewall/storage/permission config

HA adds configured service restart behavior for selected VMs/CTs and requires quorum, fencing/watchdog, placement policy, and storage/migration design.

## pmxcfs Model

`/etc/pve` is a FUSE-mounted, database-backed, Corosync-replicated configuration filesystem. It contains cluster config such as:

- `corosync.conf`
- `storage.cfg`
- `qemu-server/<vmid>.conf`
- `lxc/<vmid>.conf`
- HA resources/status
- firewall and SDN config
- private cluster material under `priv/`

Read-only behavior on quorum loss is intentional. It prevents split-brain writes to cluster state.

## Quorum Rules

- A cluster needs a majority of votes to safely write cluster config.
- A 2-node cluster without QDevice is fragile: losing one node loses quorum.
- A QDevice can provide a third vote for small clusters, but it is still a design decision, not magic.
- Manual quorum overrides accept split-brain risk and are not routine fixes.

## HA Components

| Component | Role |
|---|---|
| `pve-ha-crm` | Cluster resource manager. Decides desired service placement. |
| `pve-ha-lrm` | Local resource manager. Reconciles local services with desired state. |
| Watchdog / `watchdog-mux` | Self-fencing mechanism when a node cannot safely participate. |

Field model: Proxmox HA favors self-fencing. A node that loses safe cluster participation should reboot rather than risk duplicate ownership.

## HA Reality Check

PVE HA usually means:

- node failure detected
- unsafe owner fenced or considered gone
- VM/CT restarted elsewhere
- guest OS and application recover from crash semantics

It does not mean:

- sub-second failover
- no downtime
- database consistency without app-level design
- backup replacement
- automatic capacity/load rebalancing like full DRS

## Storage and HA

HA resources need storage accessible from the target node, or a replication/migration design with accepted RPO.

Patterns:

- Shared storage/Ceph/SAN: lower RPO for infra failover, storage becomes shared failure domain.
- Local ZFS replication: RPO equals replication interval, operationally simpler for small clusters.
- Local-only no replication: HA is not meaningful for node failure; restore from backup is recovery path.

## Guest Ownership and Failed-Node Recovery

Shared disks alone do not make a failed-node VM safely migratable. Guest ownership and locks are tied to cluster configuration and node state, not only to disk visibility.

Senior rules:

- For HA-managed guests, let HA/fencing semantics decide ownership before restart.
- For non-HA guests on shared storage, manual recovery is only safe after proving the failed owner node is truly off or fenced.
- Do not manually start duplicate guests during partitions or uncertain node state.
- Treat owner-file moves and manual config recovery as incident actions requiring explicit evidence and rollback notes.

Failure mode: a VM disk is accessible from another node, but the cluster still cannot safely migrate/start it because config ownership, locks, or node state are unresolved.

## Stretched Clusters

Treat stretched clusters across sites as high-risk. Corosync is timing-sensitive, and network partitions are the failure you most need to survive. Prefer independent clusters with replication or backup/sync unless official guidance and measured latency/failure behavior support the design.

## Cluster/HA Smells

- 2-node cluster called HA without QDevice or explicit risk acceptance.
- HA enabled for every VM by default.
- No measured failover time.
- No capacity check for N+1 failure.
- Corosync shares saturated storage/backup/migration network.
- Operator expects HA to provide application-level continuity.
- Manual VM starts during partition without understanding ownership.
- “Disks are shared, so failed-node guests can always be started elsewhere instantly.”

## Preflight Before HA Changes

- PVE versions and node health known.
- Quorum healthy.
- Storage reachable from all eligible nodes.
- Ownership/lock state understood for any failed-node recovery.
- Watchdog behavior understood and tested.
- Placement groups/rules documented.
- Backups independent and recent.
- Application crash recovery tested.
- Maintenance rollback path exists.

## Validation Drills

- Observe `/etc/pve` behavior under controlled quorum loss.
- Pull a Corosync link in lab and observe membership/fencing.
- Restart or hard-power a node with a non-critical HA VM and measure RTO.
- Test application recovery after HA restart, not just VM power state.
- Test maintenance drain before rebooting nodes.
