# OpenShift Serverless, Harbor, Air Gap, Functions, and Service Mesh

Use this for OpenShift Serverless operator-managed Knative, version skew, private registries, Harbor, image signing, air-gapped install, `kn func`, and Service Mesh integration.

## OpenShift Serverless Stance

On OpenShift, use the OpenShift Serverless Operator path. Do not mix raw upstream Knative YAML into operator-managed clusters unless explicitly accepting unsupported behavior.

Owner boundaries:

- Platform team: Serverless Operator, `KnativeServing`, `KnativeEventing`, `KnativeKafka`, Kourier/ingress, catalog/mirror, admission, cluster trust, quotas.
- App team: Knative `Service`, `Broker`, `Trigger`, `Source`, workload image, ServiceAccount, delivery policy within namespace constraints.

## Version-Sensitive Notes

Verify against target release notes before production. As of the 2026-05-03 research pass:

- OpenShift Serverless 1.37 was the current visible Red Hat docs line and maps to Knative 1.17 core components.
- OpenShift Serverless 1.36 maps to Knative 1.16 core components.
- Local older dossiers that called 1.35 latest are stale.
- Upstream Knative 1.21 is current active upstream; v1.22 was not confirmed released in the research pass.
- `kn` CLI from OpenShift Serverless 1.37 requires RHEL 9 libraries; RHEL 8 hosts can fail with `GLIBC_2.33 not found`.
- Recent OpenShift Serverless removed old core `Serving/Eventing v1alpha1` APIs. Use `serving.knative.dev/v1` and `eventing.knative.dev/v1` for Service/Broker/Trigger.
- RabbitMQ extension APIs may remain `v1alpha1`; that is separate from core Eventing API removal.

Local checks:

```bash
oc get csv -A | grep -i serverless
oc -n knative-serving get knativeserving.operator.knative.dev -o yaml
oc -n knative-eventing get knativeeventing.operator.knative.dev -o yaml
oc get crd | grep -E 'knative|rabbitmq|kafka'
kn version
```

## Air-Gapped Install Shape

High-level sequence only; operator install and mirror changes are cluster mutations.

Mandatory gated runbook header for production:

- **Goal**: install or update OpenShift Serverless from an internal mirror.
- **Preflight**: OCP/Serverless compatibility matrix checked; target channel chosen; mirror content generated in a staging registry/project; registry CA and pull secret path verified; existing Operator/CatalogSource/Knative CR state exported; etcd/cluster backup posture known for platform change windows.
- **Approval**: explicit approval required from cluster owner because catalog, mirror, and operator changes affect cluster-wide install and upgrade behavior.
- **Blast radius**: OperatorHub/catalog resolution, Serverless Operator install/upgrade, `knative-serving`, `knative-eventing`, Kourier/Eventing data planes, and any namespaces using Serverless.
- **Rollback / restore**: retain previous catalog image, previous CatalogSource definition, previous Subscription channel/install plan state, and exported `KnativeServing`/`KnativeEventing` CRs; know whether rollback is channel re-pin, operator downgrade via supported path, or restore from backup/support procedure.
- **Validation**: CatalogSource healthy; Subscription/CSV `Succeeded`; `KnativeServing` and `KnativeEventing` Ready; Kourier/activator/autoscaler/webhook pods healthy; first internal-registry Service creates Ready Revision and returns 2xx; Eventing smoke test passes if Eventing is installed.
- **Stop conditions**: CatalogSource image pull failures, CSV install failures, webhook admission failures, degraded Knative CRs, Kourier route failures, unexpected API removals, or any cluster operator degradation outside the planned blast radius.

1. Mirror Red Hat operator catalog images into internal registry using the approved OpenShift mirroring tool for the OCP version.
2. Apply generated mirror config objects, typically IDMS/ITMS for modern OCP.
3. Create a disconnected `CatalogSource` pointing at the mirrored catalog.
4. Install Serverless Operator from disconnected OperatorHub/catalog.
5. Create `KnativeServing` and `KnativeEventing` CRs.
6. If using Kafka, install/configure AMQ Streams and `KnativeKafka` through supported docs.
7. Mirror function builder images separately if using `kn func`; not every builder image is covered by operator related images.
8. Validate first Service from internal registry before onboarding workloads.

Minimum production checks:

- OCP and Serverless compatibility matrix checked
- operator channel and upgrade policy chosen
- mirror content digest-pinned or reproducible
- registry CA trusted by nodes and operators
- pull secrets and robot accounts scoped by namespace/project
- rollback: previous CatalogSource/operator channel and CR backups captured

## Harbor and Private Pulls

Harbor stores OCI images/artifacts and signatures. It does not store the container runtime.

Mechanisms:

- Kubernetes `kubernetes.io/dockerconfigjson` pull secret
- attach via ServiceAccount `imagePullSecrets`, or per-Service template `imagePullSecrets`
- cluster CA trust for private/self-signed Harbor
- immutable tags/digests for production
- robot accounts scoped to pull-only where possible

ServiceAccount pattern:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: order-processor-sa
  namespace: orders
imagePullSecrets:
  - name: harbor-pull
```

Service references the SA:

```yaml
spec:
  template:
    spec:
      serviceAccountName: order-processor-sa
      containers:
        - image: harbor.example.com/orders/processor@sha256:REPLACE_ME
```

Debug pull failures:

```bash
oc -n <ns> describe revision <revision>
oc -n <ns> get pods -l serving.knative.dev/revision=<revision>
oc -n <ns> describe pod <pod>
oc -n <ns> get serviceaccount <sa> -o yaml
oc -n <ns> get secret <pull-secret> -o jsonpath='{.type}{"\n"}'
```

Do not print pull-secret contents or registry tokens.

## Image Signing and Admission

Knative does not automatically enforce user workload signatures. Use the platform's admission policy.

Posture:

- Sign in CI over the image digest.
- Store signatures in Harbor/OCI registry.
- Enforce at admission with RHACS or Sigstore Policy Controller depending on support posture.
- Verify unsigned image rejection in a non-prod namespace before rollout.

Keep roles separate:

- CI signs.
- Harbor stores image/signature metadata.
- Admission controller verifies.
- Knative creates Revisions referencing images.

## `kn func` / OpenShift Serverless Functions

Use `kn func` for developer ergonomics, not to hide production mechanics.

Good fit:

- quick scaffold for Go/Python/Node/Quarkus-style handlers
- teams that want function-first workflow
- demos/labs
- remote cluster builds in air-gapped CI when supported

Production caveats:

- decide whether GitOps manifests or `kn func deploy` is the source of truth
- mirror builder images in disconnected environments
- attach Harbor credentials to build and runtime ServiceAccounts
- prefer digest-pinned output in production GitOps
- validate the generated Service like any other Knative Service

Lab/dev-only shape:

These commands create/build/deploy and mutate registry plus cluster state. Use them for labs or explicitly approved developer workflows, not as an unguarded production runbook. For production, prefer CI/GitOps that builds, signs, pushes, writes a digest-pinned manifest, and rolls out through reviewed changes.

Preflight before an approved `kn func deploy` workflow:

- target namespace and cluster confirmed
- registry/project and builder images available
- Harbor credentials scoped to the function project
- source of truth chosen (`kn func` workflow vs GitOps)
- rollback path defined: previous image digest and previous Ready Revision/Route traffic
- rollback action defined: route 100% traffic to the previous Ready Revision, or revert the GitOps manifest to the previous image digest

Validation after deploy:

- image exists in Harbor and digest is known
- Knative Service creates a Ready Revision
- route/tagged URL smoke test passes
- logs show expected function startup
- previous Revision remains available for Route rollback

```bash
kn func create -l python my-handler
kn func deploy --registry harbor.example.com/team-a --builder s2i --namespace orders --build
```

For CI/air-gap, prefer cluster-local builds where supported so the image is built and pushed inside the trusted network.

## Service Mesh Integration

Knative + Service Mesh adds sidecar and mTLS complexity. Use it only when policy/mTLS needs justify the tax.

Known gotchas:

- queue-proxy and Envoy both sit in the pod path
- activator must be in the mesh or explicitly compatible with mTLS policy for scale-from-zero
- probe rewriting may be required: `sidecar.istio.io/rewriteAppHTTPProbers: "true"`
- strict mTLS can break activator -> service traffic during cold start
- EventTransform and newer features may have Service Mesh compatibility caveats in specific releases

Preflight:

```bash
oc -n <ns> get servicemeshmemberroll,servicemeshmember 2>/dev/null
oc -n <ns> get pods -l serving.knative.dev/service=<name> -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[*].name}{"\n"}{end}'
oc -n knative-serving get pods
```

Do not enable mesh injection broadly for Knative namespaces without a dev rehearsal.

## OpenShift-Specific Failure Surfaces

- SCC denies root/fixed UID assumptions.
- OpenShift Route/Kourier status differs from upstream ingress examples.
- OLM channel upgrades can remove old APIs or change defaults.
- disconnected catalog and builder-image mirrors drift independently.
- RHACS/admission can reject unsigned images even when Harbor pull succeeds.
- NetworkPolicy default-deny can break source -> broker -> sink or activator -> service.
- RHEL 8 operator/admin hosts may not run current `kn` CLI builds.
