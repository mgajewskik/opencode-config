# Operations, Security, Upgrades, and Automation

Use this for production readiness, RBAC, API tokens, repositories, upgrades, monitoring, automation, air-gapped operation, and regulated/on-prem posture.

## Production Readiness Frame

Production Proxmox is not “more features.” It is tested recovery paths, constrained blast radius, observable failure modes, and predictable change management.

Minimum evidence:

- restore drill completed
- migration tested
- quorum/HA behavior tested if clustered
- storage-full/degraded behavior understood
- network rollback path exists
- monitoring alerts on cluster/storage/backup/capacity
- access model avoids routine all-powerful `root@pam`

## Security Defaults

- Restrict management UI/API to trusted management networks or VPN.
- Use MFA/SSO/OIDC/LDAP/AD where appropriate.
- Keep break-glass access, but document and audit it.
- Use least-privilege API tokens for automation.
- Separate human admin accounts from automation accounts.
- Audit task logs and access logs.
- Protect backups from the same credentials/blast radius as the cluster.

## RBAC and API Tokens

PVE permissions are path/object oriented. For automation:

- scope tokens to the narrowest pool/VM/storage path practical
- avoid root-level tokens for routine provisioning
- rotate tokens and document owners
- avoid embedding secrets in scripts, repos, logs, task comments, or shell history
- test denied paths intentionally to prove least privilege

## Repository and Upgrade Discipline

Version-sensitive operations require current evidence:

- PVE version and kernel
- enabled repositories
- subscription/no-subscription/test repo policy
- release notes and known issues
- helper output for major upgrades, such as the relevant current upgrade checker
- reboot and kernel rollback/pinning plan
- host access and network-interface naming risk

Guardrails:

- Do not mix unsupported repos casually.
- Do not upgrade all nodes at once in a cluster.
- Drain/migrate workloads deliberately.
- Keep quorum during rolling maintenance.
- Validate boot path, especially for ZFS-on-root or unusual bootloader layouts.
- Secure out-of-band access before remote major upgrades.

### PVE 8->9 / Major Upgrade Hazards

Check current release notes for exact behavior, but specifically watch for:

- NIC naming changes and interface pinning/override needs
- `/tmp` becoming `tmpfs` in Debian 13-era systems
- cgroup v1 removal affecting old container/workload assumptions
- removed GlusterFS support
- NVIDIA vGPU and kernel compatibility constraints
- FRR/SDN edge cases in network-heavy estates
- bootloader/kernel/ESP synchronization on ZFS-on-root or unusual boot layouts

Treat upgrades as host, network, and cluster operations, not routine package churn.

## Monitoring Signals

Monitor at least:

- quorum and Corosync membership
- HA state and failed resources
- node CPU/RAM/iowait/load
- storage capacity, thin usage, ZFS pool health, SMART, Ceph health/slow ops
- backup job success, duration, verification, prune/GC capacity
- NIC errors/drops, MTU/bond health
- task queue failures and auth/access events
- notification delivery and escalation paths

Useful exporter patterns include PVE exporter, node exporter, and Ceph exporter where appropriate.

## Automation

Automation should encode safety, not just speed.

Patterns:

- standard VM templates with documented defaults
- tags/pools for owner, criticality, backup policy, automation status
- VMID allocation ranges, naming discipline, and ownership conventions
- API tokens with least privilege
- idempotent Ansible/Terraform flows where possible
- preflight checks for target node capacity, bridge presence, storage availability, and backup policy

Practitioner heuristic: the `bpg/proxmox` Terraform provider is commonly preferred for new Terraform work over older providers, but this is version-sensitive and should be rechecked before standardizing.

## Multi-Cluster and PDM

One PVE cluster is not a global control plane. For multiple clusters, sites, or administrative domains, evaluate Proxmox Datacenter Manager (PDM) or another visibility/control layer separately from cluster HA.

Use PDM-style thinking when:

- clusters are geographically or operationally separate
- teams need multi-cluster visibility
- RBAC, naming, notifications, and standards must span clusters
- cross-cluster recovery or migration planning matters

Do not stretch one cluster across sites just to get a single pane of glass.

## Air-Gapped or Regulated Posture

For high-compliance or local-first environments:

- mirror repositories internally and pin to approved snapshots
- control ISO/template ingress and provenance
- document upgrade windows and rollback paths
- design notification paths that work without internet assumptions
- centralize logs to immutable or protected storage
- enforce MFA and separate admin/automation identities
- use independent PBS or cross-site backup sync
- avoid stretched clusters across sites unless the timing/failure model is proven
- write runbooks for node replacement, restore drill, fence event, storage degradation, and compromised credentials

## Operational Smells

- Web UI exposed directly to the internet.
- Everything done as `root@pam`.
- PBS and all backups share the cluster's primary failure domain.
- No one has run a restore drill.
- No one knows what repo channel each node uses.
- Major upgrades happen without reading release notes or running the checker.
- Monitoring is installed after the first incident.
- Automation can delete or reconfigure everything with one broad token.

## Preflight for Risky Changes

Before network, storage, quorum, HA, or upgrade changes:

1. Current version and node health known.
2. Recent backup and restore path confirmed for impacted workloads.
3. Console/IPMI or rollback path available.
4. Quorum and storage health checked.
5. Maintenance window and owner approval clear.
6. Stop condition defined.
7. Evidence to collect before and after listed.
