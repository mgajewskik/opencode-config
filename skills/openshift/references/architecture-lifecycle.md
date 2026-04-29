# Architecture and Lifecycle

Use this for cluster anatomy, request flow, state boundaries, operator ownership, and “what is running where?” questions.

## Runtime Shape

- **Control plane nodes:** static pods for kube-apiserver, etcd, kube-controller-manager, scheduler; dynamic platform operator pods in `openshift-*` namespaces.
- **Worker nodes:** kubelet, CRI-O, MCD, OVN/OVS, Multus, CSI, monitoring/logging agents, workload pods, router pods as scheduled.
- **Bootstrap:** ephemeral install-time host/process. If bootstrap fails, first suspects are DNS, load balancer, pull secret, trust bundle, and mirror reachability.
- **Compact/SNO:** control plane and workloads collapse onto fewer nodes; capacity and reboot blast radius matter more.
- **HCP/HyperShift:** control plane runs as pods on a management cluster; hosted workers belong to the hosted cluster.

## Important Namespaces

| Namespace | What lives there |
|---|---|
| `openshift-cluster-version` | CVO |
| `openshift-machine-config-operator` | MCO controller, MCD daemonset, MCO server |
| `openshift-network-operator` | CNO |
| `openshift-ovn-kubernetes` | OVN-K control and node components |
| `openshift-ingress-operator` / `openshift-ingress` | Ingress Operator and HAProxy router pods |
| `openshift-authentication` / `openshift-authentication-operator` | OAuth server and Authentication Operator |
| `openshift-monitoring` | Platform Prometheus, Alertmanager, Thanos, node exporters |
| `openshift-user-workload-monitoring` | User workload Prometheus and Thanos Ruler |
| `openshift-marketplace` | CatalogSources and catalog pods |
| `openshift-operator-lifecycle-manager` | OLM and package server |
| `openshift-image-registry` | Internal registry |
| `openshift-config` / `openshift-config-managed` | User inputs and operator-managed outputs |

## API Groups Worth Knowing

| API group | Meaning |
|---|---|
| `config.openshift.io/v1` | cluster-wide config: `ClusterVersion`, `Network`, `OAuth`, `Authentication`, `Image`, `Proxy`, `APIServer`, `Ingress`, `Infrastructure` |
| `operator.openshift.io/v1` | operator-specific config: `IngressController`, `Network`, `KubeAPIServer`, `Etcd`, `DNS`, etc. |
| `machineconfiguration.openshift.io/v1` | `MachineConfig`, `MachineConfigPool`, `KubeletConfig`, `ContainerRuntimeConfig` |
| `route.openshift.io/v1` | `Route` |
| `security.openshift.io/v1` | `SecurityContextConstraints` |
| `image.openshift.io/v1` | `ImageStream`, `ImageStreamTag`, `ImageStreamImage` |
| `build.openshift.io/v1` | `BuildConfig`, `Build` |
| `user.openshift.io/v1` | `User`, `Identity`, `Group` |
| `oauth.openshift.io/v1` | OAuth clients and tokens |
| `project.openshift.io/v1` | `Project`, `ProjectRequest` |

Reflex: `oc api-resources --api-group=<group>` and `oc explain <kind>.<group>`.

## ClusterOperator Conditions

Healthy steady state is usually:

```text
Available=True Progressing=False Degraded=False Upgradeable=True
```

Interpretation:

- **Available=True:** component is serving.
- **Progressing=True:** rollout/reconcile in flight.
- **Degraded=True:** operator found an error requiring attention.
- **Upgradeable=False:** operator is blocking minor upgrade.

If `Available=True, Progressing=True, Degraded=False` persists for hours, the operator is likely stuck on an operand rollout.

## Request Flow for an External App

```text
Client -> DNS/LB/VIP -> worker with router pod -> HAProxy Route match
  -> Service -> Endpoints -> OVN-K rewrites to Pod IP -> backend pod
```

Senior triage for HTTP 503:

1. `oc get route -n <ns> <route>` and `oc describe route` for admitted/conflict state.
2. `oc get svc,endpoints -n <ns> <svc>`; zero endpoints usually explains 503.
3. `oc describe pod` and readiness probes.
4. Router logs only after service/endpoints look healthy.

## Upgrade Flow at a Glance

Illustrative flow only; do not treat this as an executable upgrade runbook without the upgrade preflight in `cvo-mco-rhcos.md`.

```text
oc adm upgrade --to <version>
  -> ClusterVersion desiredUpdate changes
  -> CVO fetches release image and verifies signature
  -> CVO applies release manifests in dependency order
  -> each ClusterOperator reconciles operands
  -> MCO rolls RHCOS/kubelet through MCPs
  -> ClusterVersion reports desired=current
```

CVO does not upgrade app workloads or OLM-installed operators.

## What Dies and What Survives

| Component | Stateful? | Recovery model |
|---|---|---|
| etcd | Yes, critical | restore from supported snapshot; quorum procedures |
| kube-apiserver | No, state in etcd | operator/static-pod recovery once cause clears |
| CVO/MCO/CNO/Ingress operators | Mostly no | restart/fix source CR/operand |
| OVN central DB | Regenerable-ish, operationally sensitive | operator/runbook; worst-case DB regeneration with support guidance |
| internal registry | Yes if PV-backed | recover PV or rebuild; ImageStream tags may matter |
| Prometheus/Loki | Yes for history | data gap if PV/object store lost; platform can redeploy |
| workload PVs | Yes | CSI/storage-specific DR |

## First-Day-on-This-Cluster Probe

Read-only baseline:

```bash
oc version
oc get clusterversion
oc get co
oc get mcp
oc get nodes -o wide
oc get csv -A
oc get storageclass
oc get ingresscontroller -n openshift-ingress-operator
oc get network.config.openshift.io cluster -o yaml
oc get oauth cluster -o yaml
```

Report what is inspected versus inferred.
