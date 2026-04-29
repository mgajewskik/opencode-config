---
name: openshift
description: Senior-level OpenShift and OKD guidance for installing, operating, debugging, upgrading, and securing clusters. Use when working with OpenShift Container Platform, OKD, MicroShift, oc, openshift-install, CVO, MCO, OLM, SCCs, Routes, OVN-Kubernetes, RHCOS/SCOS, disconnected or air-gapped installs, OperatorHub, ODF, OpenShift Virtualization, monitoring, logging, GitOps, Pipelines, Service Mesh, etcd, certificates, or day-2 cluster incidents.
license: Apache-2.0
metadata:
  version: "0.1"
---

# OpenShift / OKD

Production-first guidance for OpenShift Container Platform, OKD, and related OpenShift-family distributions. Optimize for mechanism-level diagnosis, operator ownership, version-aware procedures, safe day-2 operations, and public-safe examples. Skip generic Kubernetes tutorials unless the user asks.

This skill distills a senior OpenShift operator corpus into progressive references. Load only the nearest reference for the task.

## Start Here

Classify the request first, then read the smallest useful reference.

- Core thesis, Kubernetes-to-OpenShift translation, senior heuristics, shallow-understanding checks -> read [references/mental-models.md](references/mental-models.md)
- Cluster anatomy, request flow, control/data plane, ClusterOperators, CR ownership, stateful vs regenerable components -> read [references/architecture-lifecycle.md](references/architecture-lifecycle.md)
- OCP vs OKD vs managed OpenShift vs MicroShift, support boundaries, lifecycle caveats -> read [references/distributions-versions.md](references/distributions-versions.md)
- IPI/UPI/Agent-based/Assisted/SNO/compact/HCP installs, disconnected and air-gapped mirroring -> read [references/install-airgap.md](references/install-airgap.md)
- RHCOS/SCOS, MachineConfig, MCP, MCO render-drain-reboot, CVO, updates, EUS upgrades -> read [references/cvo-mco-rhcos.md](references/cvo-mco-rhcos.md)
- OLM, OperatorHub, CatalogSource, Subscription, InstallPlan, CSV, operator upgrades -> read [references/olm-operators.md](references/olm-operators.md)
- OVN-Kubernetes, Routes vs Ingress, DNS, MetalLB, EgressIP/EgressFirewall, NetworkPolicy/ANP -> read [references/networking-routes.md](references/networking-routes.md)
- SCC/PSA, OAuth, identity providers, kubeadmin, ServiceAccount tokens, auth incidents -> read [references/security-identity-scc.md](references/security-identity-scc.md)
- LSO, LVMS, ODF, StorageClasses, image registry storage, OpenShift Virtualization/KubeVirt -> read [references/storage-virtualization.md](references/storage-virtualization.md)
- Monitoring, user workload monitoring, logging/Loki/Vector, audit forwarding, Pipelines, GitOps, Service Mesh -> read [references/platform-addons.md](references/platform-addons.md)
- Incidents, upgrades, etcd, certs, must-gather, inspect, node debug, famous caveats, quick probes -> read [references/day2-runbooks.md](references/day2-runbooks.md)

## Use This Skill For

- designing, installing, reviewing, or troubleshooting OpenShift/OKD clusters
- operating CVO, MCO, OLM, ingress, network, storage, security, monitoring, and logging planes
- disconnected or air-gapped install and upgrade planning
- day-2 incidents: degraded ClusterOperators, stuck MCPs, SCC denials, image pulls, registry, certs, etcd, route failures, OLM failures
- translating vanilla Kubernetes patterns into OpenShift-native patterns
- building public-safe runbooks and procedures without local/customer-specific details

## Do Not Use This Skill For

- generic Kubernetes advice when no OpenShift-specific behavior matters
- blindly executing live-cluster mutation commands
- managed-service-specific console workflows unless the user names ROSA, ARO, or OSD
- subscription/legal/compliance conclusions beyond operational support-boundary caveats
- exposing customer names, local paths, internal hostnames, credentials, tokens, pull secrets, or raw incident artifacts

## Default Operating Stance

- Start with `oc get co`, `oc get clusterversion`, `oc get mcp`, events, and relevant operator status before workload-level guessing.
- Find the owning operator and source CR. Do not patch generated Deployments, DaemonSets, static-pod resources, or rendered MachineConfigs when a source CR owns the behavior.
- Treat OpenShift behavior as version-sensitive. Ask for or inspect OCP/OKD minor, z-stream, platform, topology, and installed operator versions when relevant.
- Prefer read-only probes first. Mutation requires preflight, blast-radius statement, rollback or restore path, and post-checks.
- For production upgrades, storage mutation, network policy, SCC grants, kubeadmin removal, global pull-secret changes, etcd work, or force-upgrades, require explicit user approval.
- Distinguish OCP, OKD, managed OpenShift, and MicroShift support and lifecycle boundaries.
- Keep examples generic and public-safe: use `example.com`, `registry.internal.example.com`, `idp.example.com`, and placeholder names.

## Core Mental Models

1. **OpenShift is Kubernetes plus opinionated platform userland.** Identity, ingress, monitoring, builds, registry, pod security, OS lifecycle, and upgrades are load-bearing defaults.
2. **The cluster manages itself through operators.** Find the `ClusterOperator`, find the CR it watches, change the source of truth.
3. **The OS is part of the cluster.** RHCOS/SCOS node state is rendered by MCO, applied by MCD, and normally changed through MachineConfig-family CRs.
4. **SCCs are the Kubernetes-to-OpenShift footgun.** Pod admission is service-account/SCC driven, priority-sensitive, and stricter than many upstream Helm charts expect.
5. **CVO owns platform version; OLM owns add-on operators.** Do not conflate platform upgrades with OperatorHub-installed operator upgrades.
6. **Etcd is the cluster.** Most platform components can regenerate from CRs; etcd state and workload PV data are the real durability boundaries.
7. **Disconnected OpenShift is a coupled supply-chain system.** Images, mirror substitution, signatures, catalogs, update graph, pull secrets, trust bundles, and telemetry assumptions must align.
8. **Routes are native; Ingress is a compatibility surface.** For OCP-native HTTP routing, reason through Route -> HAProxy router -> Service endpoints -> OVN.
9. **Node changes are reboot-shaped.** MachineConfig, KubeletConfig, ContainerRuntimeConfig, pull-secret and mirror changes can roll MachineConfigPools.
10. **Supportability is an architecture constraint.** OKD, community operators, force upgrades, and manual node drift may be technically possible but operationally different.

## Interview Triggers

Ask focused questions before final guidance when any are true:

- the request mutates production cluster state, node OS, networking, storage, SCC, identity, ingress certs, pull secrets, upgrade state, or etcd
- OpenShift minor/z-stream, OKD/OCP distinction, platform topology, or disconnected status affects correctness
- the user asks for “best practices” without topology, workload, support, or failure-domain context
- the request involves force-upgrade, `Upgradeable=False`, EUS, paused MCPs, quorum, restore, or node replacement
- public documentation or reusable skill content could leak local/customer specifics

High-value questions:

1. Which distribution and version: OCP, OKD, MicroShift, ROSA/ARO/OSD? Which minor/z-stream?
2. What topology: SNO, compact 3-node, HA control plane + workers, HCP, bare metal, vSphere, cloud?
3. Connected, proxy-only, or disconnected/air-gapped? Is a local mirror/OSUS in use?
4. What is the first platform evidence: `oc get co`, `oc get clusterversion`, `oc get mcp`, relevant events/logs?
5. Is the operation read-only, reversible, disruptive, or destructive?
6. What is the backup/rollback/restore path, especially etcd snapshot and workload PV backup?

## Mode Router

Choose one primary mode and at most one secondary mode.

| Mode | Use when | Load |
|---|---|---|
| `model` | learning, architecture, Kubernetes-to-OpenShift translation, mental-model checks | `references/mental-models.md` |
| `architecture` | control/data plane, request flow, operator ownership, API groups, state boundaries | `references/architecture-lifecycle.md` |
| `distribution` | OCP vs OKD vs managed OpenShift vs MicroShift, support/lifecycle decisions | `references/distributions-versions.md` |
| `install` | IPI, UPI, ABI, Assisted, SNO, compact, HCP, install-config risk | `references/install-airgap.md` |
| `airgap` | oc-mirror, IDMS/ITMS, signatures, CatalogSource, OSUS, mirror registry | `references/install-airgap.md` |
| `upgrade` | CVO, channels, EUS, `Upgradeable=False`, conditional updates, MCO rollout | `references/cvo-mco-rhcos.md` + `references/day2-runbooks.md` for runbook detail |
| `nodes` | RHCOS/SCOS, MachineConfig, MCP, KubeletConfig, ContainerRuntimeConfig, node drift | `references/cvo-mco-rhcos.md` |
| `operators` | OLM, OperatorHub, Subscription, InstallPlan, CSV, catalog issues | `references/olm-operators.md` |
| `network` | OVN-K, DNS, NetworkPolicy, ANP/BANP, EgressIP, MetalLB | `references/networking-routes.md` |
| `ingress` | Routes, Ingress, router, wildcard certs, route 503s, Gateway API | `references/networking-routes.md` |
| `security` | SCC, PSA, OAuth, IdP, kubeadmin, service-account tokens, RBAC | `references/security-identity-scc.md` |
| `storage` | StorageClasses, LSO, LVMS, ODF, registry storage, snapshots | `references/storage-virtualization.md` |
| `virtualization` | OpenShift Virtualization, KubeVirt, VM storage/networking/live migration | `references/storage-virtualization.md` |
| `addons` | monitoring, logging, audit forwarding, Pipelines, GitOps, Service Mesh | `references/platform-addons.md` |
| `incident` | degraded CO, stuck MCP, image pull, etcd, certs, must-gather, node debug | `references/day2-runbooks.md` |

Common combinations:

- `incident` + suspected subsystem (`security`, `network`, `operators`, `nodes`, `storage`)
- `install` + `airgap`
- `upgrade` + `airgap`
- `security` + `operators` for operator pod admission failures
- `network` + `ingress` for route/LB/VIP/DNS failures
- `storage` + `virtualization` for VM live migration and PV design

## Core Workflow

1. Identify distribution, version, topology, connection mode, support boundary, and blast radius.
2. Load the nearest reference only.
3. Establish owner: CVO, MCO, CNO, Ingress Operator, Authentication Operator, OLM, storage/logging/operator-specific controller, or workload owner.
4. Gather read-only evidence before mutation.
5. Recommend the smallest supported change at the source CR or documented procedure.
6. Include preflight, action, post-check, rollback/restore, and stop condition for risky work.
7. Separate official/version-sensitive facts, practitioner heuristics, and local assumptions.
8. For public artifacts, run anti-leak checks before presenting final prose.

## Output Contract

Default response shape:

1. `Verdict` - likely layer or recommended path
2. `Why` - mechanism-level OpenShift reason
3. `Smallest safe path` - probes first, then minimal change if warranted
4. `Risks / edge cases` - version, support, security, data, network, reboot, and operator ownership caveats
5. `Validation` - exact observations that prove convergence
6. `Rollback / next step` - how to revert or the next probe

Mode-specific additions:

- `incident`: add `Likely owner`, `Read-only probes`, `Do not do yet`, `Stop condition`
- `upgrade`: add `Preflight`, `Go/no-go gates`, `Operator compatibility`, `Etcd backup`, `Worker/MCP plan`
- `airgap`: add `Mirror artifacts`, `Signatures`, `Catalogs`, `IDMS/ITMS`, `OSUS/update graph`
- `security`: add `Subject`, `SA/SCC/RBAC path`, `Least-privilege alternative`, `Audit concern`
- `review`: use `Verdict`, `Blockers`, `Risks`, `Evidence`, `Suggested fixes`, `Smallest next step`

## Guardrails

- Do not recommend disabling SCC, granting `privileged`, granting SCCs to broad groups, or binding `anyuid` to a namespace default ServiceAccount as casual fixes.
- Do not recommend editing `rendered-*` MachineConfigs, operator-owned Deployments, static-pod manifests, or node files when a source CR exists.
- Do not recommend `oc adm upgrade --force`, `--to-image`, `--allow-not-recommended`, etcd restore, quorum restore, or manual static-pod surgery without explicit break-glass framing and approval.
- Do not treat OADP/Velero as a substitute for etcd snapshots.
- Do not treat snapshots, image registry data, Prometheus data, Loki data, and etcd as the same recovery class.
- Do not assume an image registry on `emptyDir`, automatic InstallPlan approval, or an unbounded catalog mirror is production-safe.
- Do not use `podman system prune` guidance on OpenShift nodes; prefer documented CRI-O cleanup workflows and support docs.
- Do not bulk-approve CSRs without node identity validation in bare-metal/UPI environments.
- Do not delete `kubeadmin` without a verified alternate cluster-admin and break-glass path.
- Do not expose local paths, customer names, internal domains, credentials, tokens, pull-secret contents, or private topology in public examples.

## Success Criteria

Pass when all are true:

- guidance is OpenShift-specific and version-aware
- owner/operator/source CR is identified where relevant
- read-only evidence precedes mutation
- risky operations include preflight, approval, rollback/restore, post-checks, and stop conditions
- OCP/OKD/managed/MicroShift support boundaries are explicit when relevant
- SCC, MCO, CVO, OLM, Routes, OVN, storage, and etcd are not conflated
- public outputs use generic placeholders and pass anti-leak checks

Fail when any are true:

- answer is generic Kubernetes advice that ignores OpenShift operators and CRs
- command-first response mutates a cluster before diagnosis
- unsupported or break-glass commands are normalized
- security guidance broadens SCC/RBAC without least-privilege reasoning
- upgrade advice lacks etcd backup and operator/MCP preflight
- examples leak private customer, industry, local path, internal domain, or credential details

## Failure Modes

| Scenario | Detection | Fallback |
|---|---|---|
| Version unclear | No OCP/OKD minor/z-stream provided | Ask for `oc version`, `oc get clusterversion`, and relevant operator CSV versions |
| Vague incident | Only symptom provided | Start with `oc get co`, events sorted by timestamp, `oc get mcp`, and scoped `oc adm inspect` |
| Owner unclear | Multiple operators could own the surface | Find API group, namespace, `ownerReferences`, ClusterOperator status, and source CR before changing anything |
| Risky mutation requested | Upgrade, network, SCC, storage, node OS, pull-secret, cert, etcd, or identity change | Require preflight, approval, rollback/restore, and post-checks |
| Public artifact requested | Skill/doc/runbook content could expose context | Use generic examples and run anti-leak checks from `day2-runbooks` |
| External docs needed | Local source/version evidence is insufficient for high-impact behavior | Prefer versioned Red Hat docs, local `oc explain`, installed CLI help, or upstream source; label uncertainty |

### When in doubt

- Ask for the smallest missing fact that changes the decision.
- Diagnose at the platform layer before the workload layer.
- Prefer supported CR-driven changes over node shell edits.
- Prefer a lab rehearsal over a clever production shortcut.
- Prefer public-safe placeholders over realistic internal names.
