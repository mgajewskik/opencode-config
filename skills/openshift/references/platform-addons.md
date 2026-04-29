# Platform Add-ons

Use this for monitoring, logging, audit forwarding, ImageStreams/BuildConfigs, Pipelines/Tekton, GitOps/Argo CD, and Service Mesh.

## Monitoring

OpenShift monitoring has two Prometheus planes:

- **Platform monitoring** in `openshift-monitoring`: Prometheus HA pair, Alertmanager, Thanos Querier, node-exporter, kube-state-metrics, platform rules.
- **User workload monitoring (UWM)** in `openshift-user-workload-monitoring`: opt-in Prometheus/Thanos Ruler for tenant workloads.

Thanos Querier gives a unified query view.

Common config ConfigMaps:

- `openshift-monitoring/cluster-monitoring-config`
- `openshift-user-workload-monitoring/user-workload-monitoring-config`

Guidance:

- Enable UWM deliberately for tenant metrics.
- Persist Alertmanager state if silences/notifications matter.
- Use `AlertmanagerConfig` rather than editing operator-owned secrets where supported.
- Use remote_write or external long-term store for retention/capacity beyond local Prometheus.
- Grafana is not the in-tree default in modern OCP; console dashboards replaced the old platform Grafana.

## Logging

Modern OpenShift Logging is LokiStack + Vector + console plugin. The old EFK/Fluentd/Kibana shape is legacy/deprecated.

Key objects:

- `LokiStack`: Loki deployment and object storage config.
- `ClusterLogForwarder`: input/filter/output/pipeline graph.
- Vector collector DaemonSet.

Built-in log classes:

- application
- infrastructure
- audit

Audit logs require explicit RBAC to view.

## Audit Forwarding Pattern

For regulated or evidence-heavy environments, fork audit:

- full audit -> external SIEM / long-retention system
- filtered audit -> LokiStack for operator visibility

Do not filter the only compliance copy. Use filtering for operator convenience, not audit retention substitution.

## ImageStreams and BuildConfigs

ImageStreams are named pointers to image digests with tag history. BuildConfigs are the legacy in-cluster build system.

Use ImageStreams when:

- legacy BuildConfig/DeploymentConfig triggers are load-bearing
- internal digest history and rollback are useful
- cross-namespace base-image indirection helps
- disconnected registry indirection is valuable

Skip ImageStreams when:

- GitOps manifests already pin image digests
- external CI pushes directly to registry
- Tekton/Argo workflows make triggers explicit

For new workloads, prefer Kubernetes `Deployment` over `DeploymentConfig` unless legacy triggers/hooks are required.

## Pipelines / Tekton

OpenShift Pipelines packages Tekton:

- `Task`, `Pipeline`, `TaskRun`, `PipelineRun`
- workspaces, params, results, resolvers
- Pipelines-as-Code as modern Git-driven flow

SCC caution:

- Pipeline build tasks often need more privilege than regular workloads.
- Do not grant `privileged` to the default `pipeline` SA casually.
- Use dedicated ServiceAccounts per build pattern and namespace-level SCC override only with review.

Use Pipelines when in-cluster CI/CD, OCP auth/RBAC, and auditable cluster-local builds are desired. Keep external CI if it is already stronger and simpler.

## GitOps / Argo CD

OpenShift GitOps operator reconciles Argo CD instances.

Surfaces:

- `ArgoCD` CR for instance configuration
- `Application`, `AppProject`, `ApplicationSet`
- OCP RBAC for CR access and Argo CD RBAC for UI/CLI actions

Patterns:

- hub-and-spoke Argo CD for fleets
- ApplicationSet cluster generator for per-cluster deployments
- group-to-role mapping for OpenShift groups
- avoid default cluster-admin Argo instance as a multi-tenant free-for-all

## Service Mesh

OpenShift Service Mesh 3 uses Sail Operator / upstream Istio packaging. OSSM 2/Maistra-era CRs (`ServiceMeshControlPlane`, `ServiceMeshMemberRoll`) are legacy/EOL path.

Mesh adds operational cost:

- sidecars or ambient mode complexity
- control plane upgrades
- Envoy debugging
- mTLS/policy lifecycle
- version matrix with OCP

Use mesh when you need per-call authZ, service-to-service mTLS with audit, complex L7 traffic shaping, or cross-service observability at scale. Avoid it if edge TLS + NetworkPolicy + normal observability are enough.

## Add-on Upgrade Guardrails

- Manual InstallPlans for production operators.
- Snapshot CSV inventory before/after cluster upgrades.
- Verify operator channels support intermediate and target OCP minors.
- Do not migrate EFK -> Loki in place; dual-forward and retire old stack.
- Do not migrate OSSM 2 -> 3 without CRD/control-plane migration plan.
- Do not let add-on operator upgrades run uncontrolled during platform upgrades.
