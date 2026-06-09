# Helm Release Operations

Use this for install, upgrade, rollback, uninstall, history, namespace, storage, and API-version operations.

## Preflight before mutation

For non-trivial or shared-cluster operations, capture:

- Helm version and local command help if flags matter: `helm version --short`, `helm <cmd> --help`.
- Kubernetes context, namespace, and permissions: `kubectl config current-context`, `kubectl auth can-i ...`.
- Chart source and exact version/digest.
- Release name, target namespace, and storage namespace.
- Existing history and manifest: `helm status`, `helm history`, `helm get values`, `helm get manifest`.
- Whether Argo CD/Flux/CI owns the release.

Do not run production mutations until rollback/restore and validation are explicit.

## Install

Common safe sequence:

```sh
helm show values repo/chart > values.example.yaml
helm lint ./chart
helm template myrel ./chart -f values.yaml --debug
helm install myrel ./chart -n myns --create-namespace -f values.yaml --dry-run --debug
helm install myrel ./chart -n myns --create-namespace -f values.yaml --wait --timeout 5m
```

Notes:

- Helm 3 requires a release name or `--generate-name`.
- `--wait` waits for selected readiness conditions; it is not proof of application correctness.
- `--create-namespace` creates the namespace but uninstall will not necessarily remove it.
- CRDs in `crds/` install before templates unless skipped.

## Upgrade

Basic:

```sh
helm upgrade myrel ./chart -n myns -f values.yaml
```

Install-or-upgrade:

```sh
helm upgrade --install myrel ./chart -n myns -f values.yaml --create-namespace
```

Safe production pattern:

1. Render old and new manifests where possible.
2. Check deprecated/removed APIs before cluster upgrades.
3. Dry-run with final values.
4. Use `--wait` and a realistic `--timeout`.
5. Consider rollback-on-failure behavior only after inspecting local Helm version. Helm 4 renamed some flags; `--atomic` may be deprecated in favor of `--rollback-on-failure`.
6. Preserve `helm history` and events for audit.

Helm 3 uses a three-way strategic merge concept for upgrades/rollbacks: old manifest, new manifest, and live state matter. This helps with injected sidecars and out-of-band live edits, but it is not continuous drift reconciliation.

## Rollback

```sh
helm history myrel -n myns
helm rollback myrel 3 -n myns --wait --timeout 5m
```

Rollback changes manifests/config back to an earlier release revision. It does not undo:

- database migrations;
- PVC contents;
- external cloud resources;
- CRDs from `crds/`;
- hook-created resources unless policies/TTLs handle them.

Always check data-plane consequences before rollback.

## Uninstall

```sh
helm uninstall myrel -n myns
helm uninstall myrel -n myns --keep-history
```

Uninstall removes normal release resources and, by default, release records. It may leave:

- CRDs;
- PVCs depending on chart/resource policies and storage behavior;
- hook-created resources;
- resources annotated `helm.sh/resource-policy: keep`;
- namespaces created by `--create-namespace`;
- external systems.

## Release inspection

```sh
helm list -n myns
helm list -A
helm status myrel -n myns
helm history myrel -n myns
helm get values myrel -n myns
helm get values myrel -n myns --all
helm get manifest myrel -n myns
helm get hooks myrel -n myns
helm get notes myrel -n myns
```

If `helm list` is empty, check namespace, storage namespace, Secret permissions, and GitOps ownership.

## Storage drivers

Default storage is Kubernetes Secrets in the release namespace.

```sh
kubectl get secret -n myns -l owner=helm
```

Alternatives:

- `HELM_DRIVER=configmap`: easier visibility, weaker default confidentiality.
- `HELM_DRIVER=sql`: beta PostgreSQL backend, useful for release records larger than Kubernetes object limits; requires production DB operations and RBAC-like permission model.

Do not switch storage backends casually; migration is manual and failure can strand release history.

## Deprecated/removed Kubernetes APIs

Chart maintainers and operators must audit `apiVersion`/`kind` before Kubernetes upgrades.

Useful probes:

```sh
helm get manifest myrel -n myns
helm template myrel ./chart --kube-version <target-version>
```

If a release manifest contains APIs removed by the current Kubernetes version, Helm may fail to build diffs for upgrade. Prefer upgrading charts to supported APIs **before** upgrading the cluster. For stranded releases, use the official Helm mapkubeapis plugin or carefully update the stored release manifest with backups.

## Operational acceptance checklist

- Lifecycle owner is known.
- Release name, namespace, and storage namespace are explicit.
- Values source and precedence are explicit.
- Render and dry-run evidence exists.
- RBAC permits intended operations and release metadata reads.
- CRD/hook/PVC/data side effects are understood.
- Rollback/restore path and validation checks are written before mutation.
