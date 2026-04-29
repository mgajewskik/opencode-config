# Distributions and Versions

Use this for OCP vs OKD vs managed OpenShift vs MicroShift, support boundaries, and version planning.

## Family Map

| Distribution | What it is | OS base | Who runs control plane | Support posture |
|---|---|---|---|---|
| OCP | Self-managed commercial OpenShift | RHCOS | Customer | Red Hat subscription/support |
| OKD | Community OpenShift distribution | SCOS in modern 4.x | Customer | Community best effort |
| ROSA | Managed OpenShift on AWS | RHCOS | Red Hat + AWS | Joint managed service |
| ARO | Managed OpenShift on Azure | RHCOS | Microsoft + Red Hat | Joint managed service |
| OSD | OpenShift Dedicated on cloud | RHCOS | Red Hat SRE | Managed service |
| MicroShift | Edge/single-node OpenShift subset | RHEL for Edge or community base | Customer | Red Hat for commercial build; community otherwise |

## Decision Heuristics

- Use **OCP** when production, vendor support, regulated operations, disconnected installs, signed releases, FIPS posture, or supported layered products matter.
- Use **OKD** for lab, training, development, research, or non-SLA environments where the team accepts community cadence and self-support.
- Use **managed OpenShift** when public-cloud managed control plane and provider-specific support model are acceptable.
- Use **MicroShift** for constrained single-node edge workloads, not as a replacement for a multi-node production OCP cluster.

## OKD Caveats

- OKD docs can look almost identical to OCP docs; feature documentation is not support equivalence.
- OKD has no Red Hat SLA, no formal customer escalation path, and different lifecycle/CVE/backport guarantees.
- OKD uses SCOS in current releases; older FCOS-era OKD clusters may require invasive migration or rebuild.
- Red Hat layered products may have upstream/community substitutes, but support and image-access terms differ.

## MicroShift Caveats

MicroShift keeps a smaller surface:

- no CVO-driven cluster upgrade engine
- no MCO in the same sense as full OCP
- no full cluster monitoring stack by default
- no internal registry or console by default
- no multi-node HA
- routes and SCCs remain key OpenShift concepts

Use MicroShift when the operational shape is systemd-managed edge Kubernetes with OpenShift APIs, not when you need full OCP day-2 behavior.

## Version Planning Heuristics

- OpenShift minor behavior is version-sensitive; always ask for minor/z-stream.
- Prefer patched z-stream releases over `.0` for production.
- Even-numbered EUS minors are the conservative landing points for on-prem fleets.
- Odd minors are often bridge releases between EUS releases, not long-term landing points.
- Before minor upgrades, inspect release notes, deprecated APIs, operator compatibility, PDBs, paused MCPs, and disconnected mirror readiness.

## 4.18 to 4.21 Operator-Relevant Highlights

Treat these as time-sensitive; verify against current versioned docs before acting.

- **4.18:** EUS; UDN GA; BGP for OVN-K; storage live migration; oc-mirror v2 GA; Service Mesh 3.0 GA; strong virtualization positioning.
- **4.19:** cgroups v1 removal; Route `externalCertificate` GA; on-cluster image mode for RHCOS; Gateway API with Service Mesh 3; admin acknowledgment for certain removals.
- **4.20:** EUS; External OIDC/BYO OIDC matures; External Secrets integration; AI/workload features; continued Gateway/API and virtualization maturation.
- **4.21:** non-EUS bridge; newer Kubernetes base, DRA/accelerator and virtualization improvements; avoid as a long-lived conservative foundation unless explicitly justified.

## Source Quality Order

Prefer, in order:

1. Local cluster evidence: `oc version`, `oc get clusterversion`, `oc explain`, installed CSVs, operator status.
2. Versioned Red Hat OpenShift docs for the exact minor.
3. Red Hat Customer Portal solutions and errata for operational incidents.
4. Upstream source: `github.com/openshift/*`, `openshift/enhancements`, `openshift/runbooks`.
5. Practitioner blogs for heuristics, clearly labelled as heuristics.

Do not treat community anecdotes as official support guidance.
