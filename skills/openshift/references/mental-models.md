# Mental Models

Use this when the user asks how OpenShift works, why it differs from vanilla Kubernetes, how to reason about it as a senior operator, or whether an answer is cargo-culting Kubernetes habits.

## The Seven Bets

1. **Kubernetes is a kernel, not a platform.** OpenShift ships the platform userland: identity, routing, registry, builds, monitoring, logging, pod security, OS lifecycle, operator catalog, and upgrade engine.
2. **The cluster manages itself through operators.** Every major subsystem has a controller and a source CR. Change the source CR; do not fight generated resources.
3. **The OS is part of the cluster.** RHCOS/SCOS is immutable and reconciled by MCO. Node config changes are cluster changes.
4. **Containers are not root by default.** SCCs admit pods under strict defaults and assign random namespace UID ranges.
5. **Identity lives in the cluster unless configured otherwise.** Integrated OAuth is the normal OCP path; External OIDC is version-sensitive and estate-sensitive.
6. **Routes are first-class; Ingress is a compatibility surface.** Native HTTP exposure is Route + HAProxy router + IngressController.
7. **One version, one upgrade engine.** CVO drives the platform release to one desired `ClusterVersion`.

## Kubernetes-to-OpenShift Translations

| Vanilla Kubernetes thought | OpenShift thought |
|---|---|
| “Install ingress, monitoring, logging, registry, auth.” | Those are platform surfaces. Tune or replace only with intent. |
| “SSH and edit node config.” | Use MachineConfig, KubeletConfig, ContainerRuntimeConfig, or `oc debug node` for investigation. |
| “Upgrade each component.” | CVO upgrades platform operators; OLM upgrades add-on operators; apps are separate. |
| “Pod security is namespace labels.” | SCC access is granted to users/SAs/groups and selected by priority; PSA also runs. |
| “Ingress is the routing object.” | Routes are native and richer; Ingress is translated. |
| “Operator install is a Helm chart.” | OperatorHub/OLM: CatalogSource -> Subscription -> InstallPlan -> CSV -> operator CRs. |
| “Storage exists by default.” | On bare metal, PV storage is a day-zero architecture choice. |
| “Velero backs up the cluster.” | OADP backs up workloads/resources; etcd snapshot backs up control-plane state. |

## Senior Heuristics

- Start triage with `oc get co`, not pod logs, when the platform may be involved.
- If a generated object keeps reverting, you are editing the wrong layer.
- For any platform issue, name the owning operator before proposing a fix.
- If MCO is involved, assume drains/reboots unless proven otherwise.
- If a Route returns 503, check Service endpoints before blaming HAProxy.
- If a disconnected upgrade fails signature verification, check the signature ConfigMap before debugging the mirror.
- If a pod fails only on OpenShift, inspect SCC admission and image UID assumptions first.
- If OLM cannot resolve an install, inspect CatalogSource health, Subscription status, InstallPlan, CSV, and operator channel compatibility.
- If an upgrade is blocked, read the `Upgradeable=False` message literally; it usually names the operator, API, or ack.
- Treat `.0` minor releases as bug surfacing. Production normally lands on a patched z-stream.
- Use EUS-to-EUS patterns for conservative on-prem fleets.
- Keep a break-glass auth path after removing `kubeadmin`.
- Prefer `oc adm inspect` for scoped evidence and `must-gather` for broad/support evidence.
- Prefer OpenShift-native operators and supported procedures over vanilla shortcuts.

## Questions That Expose Shallow Understanding

| Question | Strong answer should include |
|---|---|
| What is the relationship between CVO and OLM? | CVO owns platform operators from the release payload; OLM owns add-on OperatorHub operators. |
| Why did editing `rendered-worker-*` not stick? | MCO regenerates rendered configs from source MachineConfigs; edit the source. |
| Why does a pod run as root in one namespace but fail in another? | SCC access and ServiceAccount binding differ; priority may select `anyuid`. |
| What does `Upgradeable=False` mean? | A ClusterOperator is blocking a minor upgrade; read condition message, clear cause or ack. |
| Is OADP enough to recover a destroyed control plane? | No; use etcd snapshot for control-plane DR and OADP for workload portability. |
| Why is disconnected install hard? | Images, IDMS/ITMS, signatures, catalogs, update graph, pull secret, trust bundle, and telemetry all couple. |

## Anti-Patterns

- “OpenShift is just Kubernetes with `oc`.”
- “Grant `anyuid` to default SA and move on.”
- “Patch the Deployment in an `openshift-*` namespace.”
- “Use `--force` to get past upgrade blockers.”
- “Run node package installs by hand.”
- “Use `emptyDir` for the internal registry in production.”
- “Bulk approve every CSR during bare-metal onboarding without inventory validation.”
- “Treat OKD docs parity as support parity.”

## Public-Safe Writing Rules

- Use generic terms: “regulated enterprise,” “disconnected on-prem,” “internal registry,” “corporate IdP.”
- Use placeholders: `apps.example.com`, `registry.internal.example.com`, `idp.example.com`, `cluster.example.com`.
- Never include local source paths, customer names, private project names, internal domains, or credentials.
