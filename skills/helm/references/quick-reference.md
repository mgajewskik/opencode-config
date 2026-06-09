# Helm Quick Reference

Use this for fast command lookup and review checklists. Verify flags with local `helm help` when Helm 4/3 differences matter.

## Create and inspect charts

```sh
helm create mychart
helm lint ./mychart
helm show chart ./mychart
helm show values ./mychart
helm dependency update ./mychart
helm dependency build ./mychart
helm package ./mychart
```

## Render and dry-run

```sh
helm template myrel ./mychart --debug
helm template myrel ./mychart -f values-dev.yaml --debug
helm install myrel ./mychart --dry-run --debug
helm install myrel ./mychart --dry-run=server --debug
```

Redact rendered Secrets and sensitive values before sharing render/dry-run output.

## Release lifecycle

```sh
helm install myrel ./mychart -n myns --create-namespace -f values.yaml --wait
helm upgrade myrel ./mychart -n myns -f values.yaml --wait
helm upgrade --install myrel ./mychart -n myns -f values.yaml --create-namespace
helm history myrel -n myns
helm rollback myrel 1 -n myns --wait
helm uninstall myrel -n myns
helm uninstall myrel -n myns --keep-history
```

## Release evidence

```sh
helm list -n myns
helm list -A
helm status myrel -n myns
helm get values myrel -n myns --all
helm get manifest myrel -n myns
helm get hooks myrel -n myns
helm get notes myrel -n myns
kubectl get secret -n myns -l owner=helm
```

## Repositories and OCI

```sh
helm repo add myrepo https://charts.example.com
helm repo update
helm search repo myrepo
helm pull myrepo/mychart --version 1.2.3

helm registry login registry.example.com
helm push mychart-1.2.3.tgz oci://registry.example.com/charts
helm install myrel oci://registry.example.com/charts/mychart --version 1.2.3
helm install myrel oci://registry.example.com/charts/mychart@sha256:<digest>
```

## Chart review checklist

- `Chart.yaml` uses `apiVersion: v2`, SemVer chart `version`, quoted `appVersion`, and no unknown custom top-level fields.
- Values are documented, stable, and not overloaded with arbitrary raw YAML.
- `values.schema.json` exists for non-trivial charts.
- Templates render deterministic YAML; no random/time functions unless justified.
- Defined template names are chart-namespaced.
- Standard labels exist; selector labels are stable.
- Strings are quoted where appropriate; integers such as ports are not quoted except env var values.
- Dependencies are pinned and `Chart.lock` is present when reproducibility matters.
- CRDs are deliberately separated or documented; no claim Helm upgrades/deletes them.
- Hooks are idempotent, bounded, observable, and cleaned up.
- RBAC is least-privilege and cluster-scoped resources are documented.
- Secrets are not stored in values files without a deliberate secret-management plan.

## Release safety checklist

- Lifecycle owner is known: Helm CLI/CI, Argo CD, Flux, or operator.
- Helm/Kubernetes/chart/GitOps versions are known or caveated.
- Namespace and storage namespace are explicit.
- Values source and precedence are explicit.
- Render and dry-run evidence exists.
- RBAC permissions are checked.
- CRD, hook, PVC, data migration, and external side effects are understood.
- Rollback/restore path is written before mutation.
- Validation and stop condition are explicit.

## Common anti-patterns

- Treating `helm install` success as app health.
- Running with cluster-admin because chart RBAC is unclear.
- One giant umbrella chart for unrelated lifecycles.
- Huge values surface "for flexibility".
- Non-idempotent hook migrations.
- Expecting Helm rollback to revert database or PVC contents.
- Expecting Helm to upgrade/delete CRDs from `crds/`.
- Direct Helm changes against Argo CD/Flux-owned resources.
- Unpinned chart versions or floating OCI tags in production.
- Release Secrets readable by broad audiences while containing sensitive rendered values.

## Source caveats

- Helm 4.2 docs currently mark several pages as not fully updated from Helm 3 wording. Use local `helm help` and versioned docs for exact flag behavior.
- Direct Helm CLI and GitOps-controller Helm workflows differ materially. Always identify ownership first.
