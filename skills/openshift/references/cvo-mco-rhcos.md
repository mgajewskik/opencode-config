# CVO, MCO, and RHCOS/SCOS

Use this for node OS state, MachineConfig, MCP, MCO failures, CVO upgrades, channels, EUS patterns, `Upgradeable=False`, and version convergence.

## RHCOS / SCOS Operating Model

- RHCOS/SCOS uses an immutable `/usr`, OSTree/rpm-ostree deployments, and cluster-managed configuration.
- `/etc` and `/var` are mutable, but many files are owned by MCO-rendered config.
- Normal node access: `oc debug node/<node>` then `chroot /host`. SSH is break-glass.
- Manual node edits create drift unless the change is represented in MachineConfig-family state.

## MachineConfig Family

| CR | Use |
|---|---|
| `MachineConfig` | files, systemd units, kernel args, extensions, ignition-rendered node config |
| `MachineConfigPool` | groups nodes and controls rollout pause/concurrency |
| `KubeletConfig` | typed kubelet config; generates MachineConfig |
| `ContainerRuntimeConfig` | typed CRI-O config; generates MachineConfig |
| `MachineOSConfig` / image mode | newer pool image customization path; verify version support |

Prefer typed CRs over raw MachineConfig when they exist.

## MCO Render -> Drain -> Reboot

1. Source MachineConfigs and generated configs merge into `rendered-<pool>-<hash>`.
2. MCD on each node compares disk state with rendered config.
3. Node is cordoned.
4. Drain uses eviction API and honors PDBs.
5. Files/kernel args/OS image change is applied.
6. Node reboots.
7. MCD verifies and uncordons.

Implications:

- PDBs with `maxUnavailable: 0` or `minAvailable: 100%` commonly block drains.
- `spec.paused: true` keeps rendering but stops rollout; useful briefly, dangerous if forgotten.
- Increasing `maxUnavailable` reduces time but increases blast radius.
- Global pull-secret, mirror, kubelet, CRI-O, and trust changes can roll nodes.

## Common MCO Failure Patterns

| Symptom | Likely cause | First probes |
|---|---|---|
| MCP Degraded | PDB block, file drift, reboot failure, bad MC | `oc describe mcp/<pool>`, MCD logs |
| Node `SchedulingDisabled` for long time | drain stuck | `oc adm drain` events, PDB inventory |
| `unexpected on-disk state` | manual or external file drift | MCD logs; compare source MachineConfig |
| Render loop | edited `rendered-*` or conflicting source MCs | list source MCs by pool and order |
| Cert/upgrade debt | MCP paused too long | `oc get mcp`, cert alerts, CO status |

Read-only probes:

```bash
oc get mcp
oc describe mcp/<pool>
oc get machineconfig | sort
oc -n openshift-machine-config-operator logs ds/machine-config-daemon -c machine-config-daemon --tail=200
oc debug node/<node> -- chroot /host rpm-ostree status
```

## CVO Model

CVO watches `ClusterVersion/version`, fetches the release image, verifies signatures, applies manifests, and waits for ClusterOperators to converge.

Key truths:

- `ClusterVersion` is the platform version source of truth.
- Release images contain manifests and image references for platform operators.
- CVO upgrades platform components, not application workloads or OLM-installed operators.
- Signature verification and update graph metadata are safety controls, not annoyances.

## Channels

| Channel | Use |
|---|---|
| `stable-4.X` | production default for normal connected clusters |
| `fast-4.X` | dev/staging early adoption |
| `candidate-4.X` | lab only |
| `eus-4.X` | EUS-to-EUS patterns on even minors |

## Upgrade Preflight

- [ ] `oc get clusterversion` healthy; no active upgrade.
- [ ] `oc get co` all expected healthy; no unexplained `Degraded=True`.
- [ ] `oc get mcp` all pools updated and unpaused unless intentionally planned.
- [ ] Etcd backup taken with supported method and copied off failure domain.
- [ ] Deprecated API usage checked (`apirequestcounts`) and required admin-acks understood.
- [ ] OLM-installed operators checked for target/intermediate minor compatibility.
- [ ] PDBs audited for drain blockers.
- [ ] Storage, ingress, logging, monitoring, virtualization, and critical apps have owners on call.
- [ ] Disconnected clusters have mirrored target releases, operator bundles, signatures, IDMS/ITMS, CatalogSources, and OSUS graph data.

## EUS-to-EUS Pattern

The control plane still traverses the intermediate minor. Workers can be paused so they reboot once at the destination.

High-level flow:

1. Mirror both intermediate and destination releases and required operator bundles.
2. Confirm upgradeable state and clear documented acks.
3. Pause non-master MCPs only for the planned window.
4. Switch to target EUS channel.
5. Upgrade control plane to intermediate z-stream.
6. Upgrade control plane to destination z-stream.
7. Unpause pools and watch one consolidated worker rollout.
8. Verify COs, MCPs, nodes, workloads, alerts, and operator CSVs.

Do not leave MCPs paused after the window.

## `Upgradeable=False` vs Conditional Updates

- **Conditional update:** target is available but not recommended for your cluster risk profile. Requires reading risks and possibly `--allow-not-recommended`.
- **`Upgradeable=False`:** a ClusterOperator blocks minor upgrade. Read the condition message; it often names deprecated APIs, admin-acks, paused pools, operator incompatibility, or autoscaler state.

Do not bypass with force unless support-directed or true break-glass.

## Force Upgrade Guardrail

`oc adm upgrade --to-image ... --force` bypasses graph metadata, signature controls, and upgradeability gates. It is a nuclear option:

- require fresh etcd backup
- require support/case or explicit risk acceptance
- document why not upgrading is worse
- document no rollback guarantee
- define stop conditions and evidence collection
