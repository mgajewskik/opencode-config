# CRDs, Hooks, Tests, and RBAC

Use this for cluster-scoped blast radius, chart lifecycle side effects, and permission design.

## CRDs

Distinguish:

- **CRD declaration:** `kind: CustomResourceDefinition`, usually in `crds/`.
- **Custom resource:** an object using that CRD's API, usually in `templates/`.

Helm 3+ behavior for `crds/`:

- CRDs are installed before templates on `helm install`.
- CRDs are not templated.
- Existing CRDs are skipped with a warning.
- CRDs are not installed on upgrade/rollback.
- CRDs are not upgraded or deleted by Helm from `crds/`.
- `--skip-crds` skips CRD installation.

Why: deleting/upgrading CRDs can delete or break all custom resources cluster-wide. There is no universal safe lifecycle.

## CRD design choices

| Pattern | Use when | Tradeoff |
|---|---|---|
| CRDs in app chart `crds/` | dev convenience or simple first install | Helm will not upgrade/delete them; dry-run validation can be limited |
| Separate CRD chart | platform/admin owns API lifecycle | More install steps; safer production ownership |
| Operator-managed CRDs | controller/operator has supported lifecycle | Follow operator docs; Helm chart may only install operator |
| GitOps-managed CRDs | fleet consistency and auditability | Need ordering/sync waves/dependencies and API upgrade plan |

Production default: separate CRD/API lifecycle from app instances when blast radius matters.

## Hooks

Hooks are normal templates with annotations such as:

```yaml
metadata:
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "-5"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
```

Important lifecycle facts:

- `pre-install` executes after templates are rendered, before normal resources are created.
- Jobs/Pods used as hooks block until completion or failure.
- Failed hooks can fail the release.
- Hook resources are not managed like normal release resources after Helm observes readiness.
- Use hook delete policies or Kubernetes Job TTLs deliberately.

Hook types include `pre-install`, `post-install`, `pre-upgrade`, `post-upgrade`, `pre-rollback`, `post-rollback`, `pre-delete`, `post-delete`, and `test`.

## Hook safety checklist

Use hooks only when all are true:

- The action is lifecycle-coupled to Helm and cannot be a normal Kubernetes Job/controller.
- It is idempotent or safely retryable.
- It has timeout, cleanup, and failure behavior defined.
- It does not mutate irreversible data without backup/restore strategy.
- It is observable through `helm get hooks`, Job status, logs, and events.
- It behaves correctly under Argo CD/Flux if GitOps owns lifecycle.

Avoid hooks for app startup ordering. Prefer readiness probes, init containers, Jobs, or application-level migration controls when those own the behavior better.

## Chart tests

Helm tests are hook resources annotated with `helm.sh/hook: test`, commonly Pods or Jobs that exit 0 on success.

```sh
helm test myrel -n myns --logs
```

Good tests verify installation-level assumptions such as service reachability or config injection. They are not a substitute for application integration tests.

## Chart RBAC resources

Chart-level RBAC objects:

- `ServiceAccount` (namespaced)
- `Role` / `RoleBinding` (namespaced)
- `ClusterRole` / `ClusterRoleBinding` (cluster-scoped)

Use separate values keys:

```yaml
rbac:
  create: true

serviceAccount:
  create: true
  name: ""
  annotations: {}
```

Guidelines:

- Default `rbac.create: true` for charts that need RBAC, but allow users to provide their own.
- If `serviceAccount.create: false`, still let users set `serviceAccount.name`; default to `default` only when intentionally acceptable.
- Do not create cluster-scoped RBAC unless the workload genuinely needs it.
- Document all cluster-scoped resources in README/NOTES.

## Helm user permissions

Modern Helm uses the caller's Kubernetes credentials. The user/service account running Helm must be allowed to:

- create/update/delete every rendered resource;
- create/read/update release metadata Secrets by default;
- read release Secrets for `helm list`, `helm status`, `helm history`, and `helm get`;
- create cluster-scoped resources if the chart contains CRDs, ClusterRoles, webhooks, namespaces, etc.

Kubernetes default `view` does not read Secrets. A read-only Helm user may need explicit Secret read/list/watch for release metadata.

## Red flags

- Chart requires cluster-admin for convenience.
- CRDs and app instances upgrade in one unreviewed step.
- Hook Job performs one-way database migration with no backup/restore path.
- Hook resources have no delete policy and no TTL.
- Tests depend on external internet or long-running side effects.
- RBAC values and ServiceAccount values are conflated.
