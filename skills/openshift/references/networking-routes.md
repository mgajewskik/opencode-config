# Networking and Routes

Use this for OVN-Kubernetes, CNO, Routes vs Ingress, router/HAProxy, DNS, MetalLB, NetworkPolicy, AdminNetworkPolicy, EgressIP, EgressFirewall, and network incidents.

## OVN-Kubernetes Model

Modern OCP 4.x new installs use OVN-Kubernetes. Historical OpenShift SDN clusters require explicit migration planning.

Important surfaces:

- `Network.config.openshift.io/cluster`: install-time and high-level cluster network config.
- `Network.operator.openshift.io/cluster`: runtime OVN/CNO operator config.
- `openshift-ovn-kubernetes`: OVN control-plane and node components.
- OVS on each node moves packets.

## Gateway Modes

- **Shared Gateway:** default fast path through OVN.
- **Local Gateway / `routingViaHost`:** pod egress traverses host netfilter; useful for host firewall/compliance integration; disruptive to switch.

Do not switch gateway mode without a maintenance plan and validation.

## Policy Tiers

| Tier | API | Scope | Use |
|---|---|---|---|
| 1 | `AdminNetworkPolicy` | cluster | platform-imposed allow/deny/pass rules |
| 2 | `NetworkPolicy` | namespace | tenant/workload policy |
| 3 | `BaselineAdminNetworkPolicy` | cluster singleton | default baseline |

Default-deny egress must allow DNS and often apiserver and registry access. Many “app is broken” incidents are missing DNS/API egress.

## OpenShift Egress Extensions

- **EgressIP:** stable source IP for selected namespace/pods; failover to eligible nodes.
- **EgressFirewall:** namespace-scoped DNS/CIDR allow/deny list; one per namespace.
- **EgressService:** source IP symmetry for LoadBalancer service patterns.
- **UDN:** namespace-scoped isolated L2/L3 primary networks in newer minors; version-check before relying on details.

## Routes vs Ingress

Use **Route** when OpenShift-native behavior matters:

- edge, reencrypt, or passthrough TLS
- HAProxy route annotations
- route sharding
- wildcard routes
- router-level mTLS

Use **Ingress** when portability across vanilla Kubernetes matters and the required feature set is simple. OCP translates Ingress to Routes.

## Route TLS Modes

| Mode | TLS terminates at | Use when |
|---|---|---|
| edge | router | backend is HTTP or certs centralized at router |
| reencrypt | router then backend | backend also speaks TLS; router verifies destination CA |
| passthrough | backend | app owns TLS/SNI; router cannot inject HSTS |

In 4.19+, `spec.tls.externalCertificate` can point Routes at a TLS Secret managed by cert-manager/external CA. Verify version before using.

## IngressController Sharding

Multiple `IngressController` CRs can split traffic by domain and route/namespace selector:

- public/default apps
- internal apps
- mTLS-required apps
- dedicated routers for noisy/high-throughput workloads

Each controller is its own router Deployment. Validate DNS/LB/VIP per shard.

## Wildcard Cert Replacement Preflight

Before patching an IngressController default certificate:

- validate chain order: leaf -> intermediates -> root
- validate key is unencrypted
- validate SAN contains wildcard/apps domain
- keep previous Secret for rollback
- know that console/oauth routes may also be affected
- watch router rollout and route health after patch

## Route 503 Triage

1. `oc describe route -n <ns> <route>`: admitted, host conflict, selected router.
2. `oc get svc -n <ns> <svc> -o yaml`: targetPort and selector.
3. `oc get endpoints/endpointslice -n <ns>`: zero endpoints means backend readiness problem.
4. `oc describe pod`: readiness probes, SCC, image pull, crashes.
5. Router logs only after backend objects look correct.

## DNS Essentials

Required records:

- `api.<cluster>.<base>`
- `api-int.<cluster>.<base>`
- `*.apps.<cluster>.<base>`

Air-gapped/split-horizon hazards:

- bastion and cluster resolve mirror host differently
- `api-int` missing internally
- apps wildcard only exists externally
- pods hairpin through external Routes instead of Services
- NTP names missing
- reverse DNS expectations for strict workloads

## MetalLB

Use MetalLB when bare metal needs `LoadBalancer` Services for non-HTTP or special ingress/egress patterns.

- L2 mode: simple, one speaker owns VIP, failover blip.
- BGP mode: better for production fabrics, ECMP/BFD possible, needs network team.

Skip MetalLB if HAProxy Routes satisfy HTTP/HTTPS requirements.

## Guardrails

- Do not run SDN->OVN migration and OCP minor upgrade simultaneously.
- Do not apply cluster-wide default deny without DNS/API/registry allows.
- Do not change gateway mode, IPsec, MTU, ANP/BANP, or EgressIP placement casually.
- Do not blame the router for 503 before checking Service endpoints.
- Do not rotate wildcard certs without rollback and cert validation.
