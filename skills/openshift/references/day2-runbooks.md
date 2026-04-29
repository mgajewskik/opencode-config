# Day-2 Runbooks and Quick Probes

Use this for incidents, upgrades, etcd, certs, must-gather, inspect, node debugging, common caveats, and public-safety validation.

## Incident Skeleton

```markdown
Verdict:
Likely owner:
Read-only evidence:
Do not do yet:
Smallest safe path:
Risks / stop condition:
Validation:
Rollback / next step:
```

## First Five Minutes

```bash
oc version
oc get clusterversion
oc get co
oc get mcp
oc get nodes -o wide
oc get events -A --sort-by=.lastTimestamp
```

Then jump to the suspected owner.

## Degraded or Stuck ClusterOperator

```bash
oc describe co <name>
oc -n <operator-namespace> get pods
oc -n <operator-namespace> describe pod <pod>
oc -n <operator-namespace> logs deploy/<operator-deployment> --tail=200
oc adm inspect clusteroperator/<name> --dest-dir=inspect-co-<name>
```

Fix the underlying operand/source issue. Do not skip the operator in CVO.

## SCC Denial

Symptoms: `CreateContainerConfigError`, event mentions SCC, root UID, host path, capabilities, or `restricted-v2`.

Actions:

1. Inspect pod events and SA.
2. Check SCC access for that SA.
3. Prefer image/securityContext fix.
4. If exception is needed, dedicated SA + least-privilege SCC binding.

Never use `privileged` or namespace default SA `anyuid` as a generic fix.

## Pull Secret / Mirror Auth Drift

Symptoms: new pods `ImagePullBackOff`, `unauthorized`, works on some nodes but not others.

Probes:

```bash
oc -n openshift-config get secret pull-secret -o jsonpath='{.metadata.resourceVersion}{"\n"}'
oc get mcp
oc -n openshift-machine-config-operator logs ds/machine-config-daemon -c machine-config-daemon --tail=200
```

Changing global pull secret is cluster-wide and may roll nodes through MCO. Treat as a planned mutation.

## Stuck CSR / Node Join

```bash
oc get csr
oc describe csr <name>
```

Bulk approval is risky in bare-metal/UPI. Validate node identity, hostname, IP, and inventory before approval.

## Degraded MCP / Node Drain Block

```bash
oc describe mcp/<pool>
oc get pdb -A
oc get pdb -A -o jsonpath='{range .items[?(@.spec.maxUnavailable=="0")]}{.metadata.namespace}/{.metadata.name}{"\n"}{end}'
oc -n openshift-machine-config-operator logs ds/machine-config-daemon -c machine-config-daemon --tail=200
```

Avoid `--disable-eviction` drain except as deliberate break-glass; it bypasses PDB protection.

## Internal Registry Full

Symptoms: image-registry CO degraded, pushes fail, PVC/disk full.

Safe direction:

- provision/resize persistent storage
- prune with documented `oc adm prune images` only after understanding retention and roles
- never leave production registry on `emptyDir`

## Wildcard Cert Rotation

Preflight:

```bash
openssl verify -CAfile root.pem -untrusted intermediate.pem leaf.pem
openssl x509 -in fullchain.pem -noout -subject -issuer -dates -ext subjectAltName
```

Keep old Secret. Patch IngressController only after chain/SAN/key checks. Post-check router rollout and external TLS with `openssl s_client`.

## Upgrade Blocked by `Upgradeable=False`

```bash
oc get clusterversion -o jsonpath='{.status.conditions[?(@.type=="Upgradeable")]}'
oc adm upgrade --include-not-recommended
oc get apirequestcounts -o jsonpath='{range .items[?(@.status.currentHour.requestCount>0)]}{.metadata.name}{"\n"}{end}'
```

Read the operator message. Do not force past without explicit break-glass approval.

## Node Disk Filling `/var/lib/containers`

Use CRI-O-aware cleanup, not Podman prune. Manual image pruning is a guarded production mutation, not a first probe.

Preflight:

- confirm `DiskPressure`, `/var` pressure, or CRI-O image storage pressure with read-only evidence
- check whether kubelet image garbage collection is configured too conservatively for the node size
- identify whether the node is safe to touch: workload criticality, replacement capacity, and current `Ready` state
- prefer durable tuning (`KubeletConfig` image GC thresholds, disk sizing, workload cleanup) over repeated manual pruning
- get explicit approval; image removal has no meaningful rollback beyond re-pulling images

Guarded cleanup path:

```bash
oc debug node/<node>
chroot /host
crictl images
crictl rmi --prune
```

Post-check:

```bash
df -h /var
crictl images
exit
oc get node <node>
oc get co
oc get mcp
```

Stop if CRI-O/kubelet errors increase, critical pods fail to re-pull, or the node goes `NotReady`. Do **not** recommend `podman system prune -a -f` on OpenShift nodes.

## etcd Backup

Supported pattern is cluster backup from one control-plane node:

```bash
oc debug node/<master>
chroot /host
/usr/local/bin/cluster-backup.sh /var/tmp/etcd-backup
```

Outputs include snapshot DB and static pod resources. Copy off the node and off the cluster failure domain. Do not treat old snapshots as indefinitely restorable; cert material ages.

## etcd Defrag

Manual defrag is high-impact etcd work. Use only with evidence: fragmentation/fsync alerts, database nearing limits, support/runbook alignment.

Preflight:

- confirm the alert or database-size evidence and rule out transient API slowness
- ensure a fresh etcd backup exists and has been copied off the cluster failure domain
- verify all etcd members are healthy before starting
- identify leader and followers; plan followers first, leader last, one member at a time
- get explicit approval and define a stop condition

Guarded procedure:

```bash
oc -n openshift-etcd rsh etcd-<member>
unset ETCDCTL_ENDPOINTS
etcdctl endpoint status -w table
# defrag followers first, leader last, with gaps
etcdctl --endpoints=https://localhost:2379 defrag --command-timeout=30s
etcdctl alarm list
# disarm only after confirming the root cause is resolved
etcdctl alarm disarm
```

Post-check:

```bash
etcdctl endpoint status -w table
etcdctl alarm list
oc get co etcd kube-apiserver
oc get clusterversion
```

Stop if member health is not clean, quorum is questionable, defrag times out repeatedly, API latency worsens, or a ClusterOperator degrades unexpectedly.

## must-gather, inspect, node debug

- `oc adm inspect`: scoped, faster, smaller. Use first when the owner is known.
- `oc adm must-gather`: broad evidence for unknown scope or support cases.
- `oc debug node` + `chroot /host`: node-local forensics.
- `toolbox` + `sos report`: when OS-level support evidence is needed.

## Famous Caveats to Recognize

- SDN->OVN migration is historical and high-risk; rebuild/migrate workloads may be cleaner for old clusters.
- MCO render/drain/reboot surprises often trace to PDBs, paused pools, or manual node drift.
- cgroups v1 removal in newer minors breaks workloads reading old cgroup paths.
- Automatic InstallPlan approval can unexpectedly move operator major versions.
- Logging ES/Fluentd/Kibana to Loki/Vector is not an in-place migration.
- `kubeadmin` deletion without alternate admin is lockout.
- Default-deny NetworkPolicy without DNS/API allows breaks apps.
- SCC priority makes `anyuid` on a broad SA much wider than intended.
- OperatorGroup mismatch can hang cluster-scoped operator installs.

## Public-Safety Anti-Leak Check

Before publishing a skill/runbook/reference, reject content matching private anchors or secrets. Use generic placeholders instead.

Forbidden categories:

- customer/company names
- industry-specific anchors if not needed
- local absolute paths
- private repository/source tree names
- internal DNS domains, registry hosts, IdP hosts, SIEM hosts
- credentials, bearer tokens, pull-secret contents, kubeadmin passwords
- real support case IDs or raw incident artifact paths
- actual customer topology

Suggested sweep categories:

```text
<customer-or-employer-names>|<regulated-vertical-keywords>|<absolute-local-paths>|<private-source-tree-names>|<internal-domains>|<internal-registry-hosts>|<internal-idp-hosts>|<internal-siem-hosts>|<credential-or-token-markers>|<support-case-identifiers>
```

Use placeholders: `registry.internal.example.com`, `idp.example.com`, `siem.example.com`, `cluster.example.com`.
