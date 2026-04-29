# OLM and Operators

Use this for OperatorHub, OLM, CatalogSource, Subscription, InstallPlan, CSV, operator upgrades, and add-on operator incidents.

## CVO vs OLM Boundary

- **CVO:** platform operators shipped in the OpenShift release payload.
- **OLM:** add-on/day-2 operators installed from catalogs.

CVO upgrades do not automatically upgrade OLM-installed operators. OLM operator compatibility can still block or break a platform minor upgrade.

## OLM Lifecycle

```text
CatalogSource -> PackageManifest -> Subscription -> InstallPlan -> CSV -> operator Deployment/RBAC/CRDs -> operands
```

| CR | Meaning |
|---|---|
| `CatalogSource` | registry image serving bundle metadata |
| `Subscription` | package, channel, source, approval policy, starting CSV |
| `OperatorGroup` | watch scope/install mode for operators in a namespace |
| `InstallPlan` | concrete resources OLM proposes/applies |
| `ClusterServiceVersion` | operator descriptor: version, RBAC, owned CRDs, deployment |
| `OperatorCondition` | operator can report upgrade constraints to OLM |

## Install Modes

- `OwnNamespace`: operator watches its namespace.
- `SingleNamespace`: operator watches one target namespace.
- `MultiNamespace`: operator watches multiple namespaces.
- `AllNamespaces`: operator watches cluster-wide.

Avoid multiple conflicting `AllNamespaces` OperatorGroups. Cluster-scoped operators commonly live in `openshift-operators`.

## Production Subscription Pattern

Use manual approval unless there is a deliberate auto-upgrade policy.

```yaml
apiVersion: operators.coreos.com/v1alpha1
kind: Subscription
metadata:
  name: example-operator
  namespace: openshift-operators
spec:
  channel: stable
  installPlanApproval: Manual
  name: example-operator
  source: redhat-operators-mirror
  sourceNamespace: openshift-marketplace
  startingCSV: example-operator.v1.2.3
```

## Debugging OLM Incidents

### Catalog not ready

```bash
oc -n openshift-marketplace get catalogsource
oc -n openshift-marketplace describe catalogsource <name>
oc -n openshift-marketplace get pods
oc -n openshift-marketplace logs <catalog-pod>
```

Likely causes: mirror auth, missing IDMS/ITMS, missing trust bundle, bad catalog image, digest drift.

### Subscription stuck

```bash
oc -n <ns> describe subscription <name>
oc -n <ns> get installplan
oc -n <ns> get installplan <name> -o yaml
oc get csv -A | grep <operator>
```

Likely causes: channel incompatibility, dependency constraints, wrong OperatorGroup, manual approval pending, catalog unavailable.

### CSV failed

```bash
oc -n <ns> describe csv <name>
oc -n <ns> get deploy,pods
oc -n <ns> logs deploy/<operator-deployment>
```

Check RBAC from CSV, pod events, SCC/PSA, image pulls, and webhook readiness.

## Manual InstallPlan Approval

Before approving:

- read InstallPlan resources
- confirm target CSV/version
- confirm dependencies and CRD changes
- confirm channel compatibility with current/target OCP minor
- confirm change window and rollback limits
- accept that CRD/schema and operand migrations may not be trivially reversible

Approve only after inspection:

```bash
oc -n <ns> patch installplan <name> --type merge -p '{"spec":{"approved":true}}'
```

Post-check:

```bash
oc -n <ns> get installplan <name> -o yaml
oc -n <ns> get csv
oc -n <ns> get deploy,pods
oc -n <ns> describe csv <new-csv>
```

Rollback may require restoring the previous Subscription/channel/CSV and any operator-specific operand backup. Do not assume OLM can safely downgrade CRDs or operands.

## Disconnected Operator Discipline

- Pin catalog images by digest.
- Mirror only certified/needed packages where practical.
- Snapshot installed CSV inventory before and after upgrades.
- Apply IDMS/ITMS and trust bundles before expecting CatalogSources to work.
- Include operator must-gather images in mirror sets.

Inventory snapshot:

```bash
oc get csv -A -o custom-columns=NS:.metadata.namespace,NAME:.metadata.name,VERSION:.spec.version,PHASE:.status.phase
```

## Guardrails

- Do not use `installPlanApproval: Automatic` in production without an explicit rollout policy.
- Do not switch channels without checking available CSVs and compatibility.
- Do not delete CRDs casually when uninstalling operators; CRDs can contain user data.
- Do not grant cluster-wide operator permissions casually for third-party operators.
- Do not assume an operator is platform-owned just because it is Red Hat-branded; check whether CVO or OLM owns it.
