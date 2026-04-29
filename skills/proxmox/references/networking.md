# Networking

Use this for Linux bridges, VLAN-aware bridges, bonds, MTU, Corosync networks, Ceph/storage networks, SDN, EVPN, firewall scope, and remote network changes.

## First Rule

Draw the packet path before changing network config:

- management UI/API/SSH
- guest traffic
- Corosync cluster traffic
- storage/Ceph traffic
- migration traffic
- backup/PBS traffic
- storage-replication traffic when configured separately

Then identify which physical NICs, bonds, bridges, VLAN trunks, MTUs, switch ports, firewall scopes, and routes each path uses.

## Bridge Model

Proxmox commonly places host management IP on a Linux bridge such as `vmbr0`, with a physical NIC as bridge port. Guests attach virtual NICs to bridges as if connected to a switch.

Senior checks:

- Is the host IP on the bridge or the physical NIC?
- Are bridge names consistent across migration targets?
- Are VLAN trunks allowed on the physical switch port?
- Is VLAN-aware mode intentionally used?
- Is rollback/console access available before applying remote changes?

## VLAN-Aware Bridge

Modern default pattern for many deployments:

- one VLAN-aware bridge
- trunk configured on switch
- per-VM VLAN tags
- firewall/routing handled explicitly

Avoid multiplying bridges per VLAN unless there is a concrete operational reason.

## Bonds and LACP

Bonds reduce link failure risk but add timing and switch-coupling behavior.

Risks:

- LACP slow timers can create long failover windows.
- MTU and VLAN config must match across all bond members and switch ports.
- Hash policy affects whether a single flow can use more than one link.
- Corosync can be sensitive to bond failover and microbursts.

For Corosync on LACP, validate failover timing and consider fast LACP settings where appropriate for the environment.

## MTU Discipline

Jumbo frames only work when the whole path supports them: guest, bridge, bond, NIC, switch, router, Ceph/storage endpoints. Simple ping can hide PMTU issues.

Field heuristic: many Ceph “slow ops” and migration stalls trace to MTU mismatch or a single bad storage path. Validate end-to-end, not node-local only.

## Corosync Network

Keep Corosync boring:

- low latency
- low loss
- stable MTU
- predictable link failover
- no saturation by backup/Ceph/migration traffic

Dedicated physical NIC is ideal in serious clusters. A dedicated VLAN can work if the operator can guarantee priority, MTU, and failure behavior.

## Storage and Ceph Networks

Ceph/storage traffic can saturate links during recovery, backfill, migration, or backup. Design for degraded-state load, not only steady state.

Ask:

- Does storage traffic share links with Corosync?
- What happens during one node loss plus backfill?
- Are public and cluster Ceph networks separate, or intentionally converged?
- Are MTU and switch buffers validated under load?

## Firewall Scope

PVE firewall rules can exist at datacenter, node, guest, and interface scopes. Misunderstanding scope leads to rules that appear ignored or overly broad.

Guardrail: never enable a restrictive firewall remotely without an explicit management allow rule and console/rollback path.

Treat the newer nftables-based `proxmox-firewall` backend as version-sensitive. In conservative production, do not assume it is the default safe choice until the installed PVE docs/release notes confirm maturity for the required scopes, especially guest forwarding, VNets, and SDN interactions.

## SDN and EVPN

Use plain Linux bridge/VLAN-aware bridge until there is a clear need for SDN. SDN/EVPN features are version-sensitive and operationally more complex.

Use SDN when:

- multi-tenant segmentation is needed
- L2-over-L3/EVPN is justified
- operators understand FRR/BGP/underlay/overlay behavior
- version-specific caveats have been checked

Avoid using SDN as a replacement for understanding Linux networking.

## Network Smells

- One NIC carries management, guests, Corosync, migration, Ceph, and backups without QoS or failure testing.
- No out-of-band console before bridge/bond/VLAN changes.
- Jumbo frames configured “somewhere” but not validated end-to-end.
- Corosync flaps during backup or Ceph recovery windows.
- Host disappears after network reload because the management IP was moved incorrectly.

## Validation

- Confirm bridge/NIC/VLAN/route path from source to destination.
- Test link failover for each bond path.
- Test MTU end-to-end for jumbo paths.
- Verify Corosync status before and after maintenance.
- Validate VM connectivity on each tagged VLAN from the guest perspective.
