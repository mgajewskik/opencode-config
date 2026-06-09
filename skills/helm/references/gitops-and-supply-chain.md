# GitOps and Supply Chain

Use this when Helm interacts with Argo CD, Flux, CI/CD, chart repositories, OCI registries, provenance, signatures, or private distribution.

## Ownership first

Before debugging or changing a Helm-managed workload, identify the lifecycle owner:

| Owner | What Helm means there | Operational consequence |
|---|---|---|
| Helm CLI/CI | Helm creates release Secrets and owns install/upgrade/rollback/uninstall | `helm list/get/history` are primary evidence |
| Argo CD | Helm is often used only to run `helm template`; Argo CD applies and tracks resources | Release may not appear in `helm list`; Argo sync/diff semantics matter |
| Flux helm-controller | Flux reconciles HelmRelease objects using Helm actions | Helm release history exists, but controller remediation/drift rules own lifecycle |
| Operator/controller | Helm may install the operator only | Operator CRs and controller docs own runtime lifecycle |

Do not run `helm upgrade` by hand against a GitOps-owned release unless explicitly doing a break-glass action and documenting how source of truth will be reconciled.

## Argo CD Helm semantics

Argo CD commonly uses Helm to inflate templates with `helm template`; the application lifecycle is handled by Argo CD.

Important consequences:

- `helm list` may not show Argo-managed Helm apps.
- Argo value precedence differs from plain Helm: `parameters > valuesObject > values > valueFiles > chart values.yaml`.
- Overriding `releaseName` can conflict with charts using `app.kubernetes.io/instance` because Argo uses that label for tracking unless configured otherwise.
- Helm hooks are mapped to Argo hooks only for supported cases; unsupported hooks are ignored.
- If any Argo CD hooks are defined, Helm hooks may be ignored.
- Random template functions cause perpetual OutOfSync unless values are pinned.

## Flux helm-controller semantics

Flux `HelmRelease` performs controller-driven Helm actions such as install, upgrade, test, rollback, and uninstall. It can also detect/correct drift depending on configuration.

Important consequences:

- Inspect `HelmRelease` status, conditions, events, history, storage namespace, and failure counters.
- `.spec.releaseName`, `.spec.targetNamespace`, and `.spec.storageNamespace` changes may cause uninstall/reinstall semantics, not rename/move.
- `.spec.valuesFrom` can pull values from Secrets/ConfigMaps; inline values override referenced values unless `targetPath` behavior changes precedence.
- Drift detection/remediation can undo manual live edits.
- Controller defaults may differ by version and feature gates; inspect installed Flux version and docs.

## Classic chart repositories

Classic chart repositories are HTTP servers containing packaged `.tgz` charts and an `index.yaml`.

```sh
helm package ./chart
helm repo index . --url https://charts.example.com
helm repo add myrepo https://charts.example.com
helm repo update
helm install myrel myrepo/mychart --version 1.2.3
```

They are simple and broadly compatible but index management, authentication, and multi-tenant controls are weaker than mature OCI registry workflows.

## OCI registries

Helm can store and fetch charts as OCI artifacts.

```sh
helm registry login registry.example.com
helm package ./chart
helm push mychart-0.1.0.tgz oci://registry.example.com/charts
helm install myrel oci://registry.example.com/charts/mychart --version 0.1.0
helm install myrel oci://registry.example.com/charts/mychart@sha256:<digest>
```

For `helm push`, the reference must be prefixed with `oci://` and omit the chart basename/tag; Helm infers them from `Chart.yaml`.

Helm 4 supports chart install by digest for stronger supply-chain integrity. Verify exact behavior with local `helm help` for the installed version.

## Provenance and signatures

Classic Helm provenance uses `.prov` files generated at packaging time:

```sh
helm package --sign --key '<uid substring>' --keyring path/to/secring.gpg ./chart
helm verify mychart-0.1.0.tgz
helm install myrel --verify mychart-0.1.0.tgz
```

Verification can fail because:

- `.prov` file is missing/corrupt;
- public key is not in the keyring;
- signature verification fails;
- chart archive hash does not match provenance.

For OCI workflows, Sigstore-based plugins can be used depending on organizational policy.

## CI/CD gates for chart delivery

Minimum gates:

- lint chart;
- render all supported environment values;
- validate Kubernetes API versions against supported cluster minors;
- run policy/security validation if project has a policy engine;
- package with pinned chart version;
- publish to controlled repo/registry;
- sign or record digest where required;
- deploy by exact chart version/digest, not floating latest.

## GitOps red flags

- Humans run direct Helm against resources reconciled by Argo CD/Flux.
- Chart uses random/time functions and is expected to stay in sync.
- Values exist in both GitOps parameters and values files without clear precedence.
- Helm hooks assume install vs upgrade semantics that the GitOps controller cannot distinguish.
- Private registry credentials are passed to unintended domains; inspect `--pass-credentials` behavior and controller settings.
- Release name differs from app tracking labels without chart selector review.
