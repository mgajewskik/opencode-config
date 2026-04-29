# Installation and Disconnected Operations

Use this for install topology choices, `install-config.yaml`, Agent-based installs, disconnected mirrors, IDMS/ITMS, signatures, catalogs, OSUS, and air-gapped upgrade prep.

## Topology Choice

| Method | Best for | Watch out for |
|---|---|---|
| IPI | Supported platform where installer may provision infrastructure | Needs platform/BMC/API credentials and supported topology |
| UPI | Unsupported/custom infra, external PXE/DNS/LB ownership | You own bootstrap, ignition, DNS, LB, scaling, CSR handling |
| Agent-based Installer | On-prem, disconnected, SNO/compact/HA single-shot installs | Rebuild ISO to retry material changes; no day-2 assisted service |
| Assisted SaaS | Connected on-prem wizard flow | Not air-gapped |
| Assisted on-prem via MCE/ACM | Fleet provisioning from a hub | Requires hub and more moving parts |
| SNO | Lab/edge/single-node workloads | No HA; reboot is outage |
| Compact 3-node | Small real cluster with control plane scheduling workloads | Capacity and etcd quorum need care |
| HCP/HyperShift | Many clusters, dense control-plane consolidation | Newer operational model; unnecessary for one small cluster |

## Install Fields That Bite

- `networking.networkType`: OVNKubernetes for modern new installs; SDN is historical.
- `clusterNetwork` / `serviceNetwork`: effectively day-zero choices; avoid collisions with enterprise RFC1918 space.
- `machineNetwork`: must include node IPs; wrong values break bootstrap/kubelet joins.
- `fips: true`: install-time only. Cannot be toggled later without reinstall.
- `proxy.noProxy`: include `.svc`, `.cluster.local`, cluster/service/machine CIDRs, API/LB addresses, mirror registry, and internal domains.
- `additionalTrustBundle`: required for TLS-intercepting proxies or private registry CAs. Use `additionalTrustBundlePolicy: Always` when a mirror CA is needed without a proxy.
- `imageDigestSources`: modern install-time mirror source mapping. Do not author new ICSP for current clusters.
- `capabilities`: can often enable later but cannot disable once enabled; decide consciously.
- `publish: Internal`: common for private or disconnected installs.

## Bare-Metal Specifics

- Prefer Redfish virtual media over legacy IPMI where possible.
- Use stable root-device hints: WWN, serial, model + size. Avoid `/dev/sdX` as a durable identity.
- Firmware consistency matters: UEFI/legacy boot, Secure Boot, NIC firmware, RAID/HBA presentation, MTU.
- If using a provisioning network, ensure L2 reachability, DHCP expectations, MTU, and isolation from the machine network.
- Bootstrap failure suspects: DNS (`api`, `api-int`, `*.apps`), LB health checks, NTP, pull secret, trust bundle, mirror reachability, BMC boot path.

## Disconnected Mental Model

Disconnected OpenShift is not “just a local registry.” It is six coupled systems:

1. **Image source:** every image must exist in a reachable registry.
2. **Image substitution:** IDMS/ITMS or install-time image sources rewrite pulls to the mirror.
3. **Signature verification:** CVO needs release signature ConfigMaps.
4. **Operator catalogs:** catalogs are images and must be mirrored or curated.
5. **Update graph:** CVO needs Cincinnati/OSUS graph data or explicit image-based updates.
6. **Telemetry:** disconnected clusters lose proactive telemetry/Insights signals.

## oc-mirror v2 Workflow

Use the `oc-mirror` plugin matching the target minor where possible.

```bash
# Connected side: mirror to disk
oc mirror -c imageset-config.yaml --v2 file:///mnt/mirror

# Disconnected side: disk to mirror registry
oc mirror -c imageset-config.yaml --v2 \
  --from file:///mnt/mirror \
  docker://registry.internal.example.com:5000
```

Expected cluster resources include:

- `ImageDigestMirrorSet` (IDMS)
- `ImageTagMirrorSet` (ITMS) when tags are mirrored
- `CatalogSource` manifests
- release `signature-configmap.yaml`

The signature ConfigMap is load-bearing. If omitted, CVO can block with release-image signature verification errors.

## ImageSetConfiguration Discipline

- Mirror platform releases by channel/min/max version.
- Curate operator packages instead of mirroring entire indexes by default.
- Pin catalog images by digest for reproducibility.
- Include must-gather images and support tooling needed during incidents.
- Treat `delete`/prune operations as separate reviewed changes; oc-mirror v2 does not auto-prune by design.

## Operator Catalog Mirroring

Symptoms and first checks:

| Symptom | Likely cause | Probe |
|---|---|---|
| `CatalogSource Ready=False` | catalog image cannot pull or nested images cannot resolve | `oc -n openshift-marketplace describe catalogsource <name>` and catalog pod logs |
| packages disappear | catalog image changed or registry auth failed | pin digest; inspect catalog pod logs |
| Subscription resolution fails | channel/package/dependency mismatch | `oc describe sub`, `oc get installplan -o yaml` |

## OSUS / Update Graph

Connected CVO reads the update graph from Red Hat. Disconnected clusters should normally run a local OpenShift Update Service (OSUS) with mirrored graph data.

Driving upgrades by release image SHA bypasses graph risk metadata. Use only when consciously accepted or under support guidance.

## Air-Gap Preflight Checklist

- [ ] Target OCP minor/z-stream chosen and tools match.
- [ ] DNS records planned: `api`, `api-int`, wildcard apps.
- [ ] NTP source reachable.
- [ ] Mirror registry reachable from bootstrap and nodes.
- [ ] Mirror registry TLS trusted by install config and nodes.
- [ ] Pull secret includes Red Hat and mirror credentials.
- [ ] `proxy` and `noProxy` are complete.
- [ ] `ImageSetConfiguration` includes platform, operator catalogs, additional images, must-gather images.
- [ ] IDMS/ITMS, CatalogSources, and signatures are applied or encoded for install.
- [ ] OSUS/update graph plan exists for upgrades.
- [ ] Install topology and root-device hints are documented.
- [ ] Etcd backup and restore plan is documented before first production upgrade.

## Guardrails

- Do not use internal registry hostnames or real credentials in public examples.
- Do not apply global pull-secret changes casually; MCO may roll nodes.
- Do not use `--to-image` or force-upgrade as the normal disconnected upgrade path.
- Do not mirror “everything” when a curated catalog satisfies support and reproducibility requirements.
- Do not assume connected-cluster telemetry warnings exist in disconnected environments; replace with errata/release-note discipline.
