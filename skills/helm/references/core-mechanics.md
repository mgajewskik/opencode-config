# Helm Core Mechanics

Use this reference for explanations and architectural decisions. Do not use it as a chart-authoring checklist; load `chart-authoring.md` for that.

## Core vocabulary

- **Chart:** a versioned package containing `Chart.yaml`, `values.yaml`, templates, optional CRDs, tests, dependencies, docs, and ignored packaging rules.
- **Values:** configuration inputs merged into a chart before rendering.
- **Rendered manifest:** ordinary Kubernetes YAML produced by chart templates plus values.
- **Release:** a named installed instance of a chart plus values, manifest, revision, namespace, status, and history.
- **Repository/registry:** distribution location for packaged charts; classic repos use `index.yaml`, OCI registries store chart artifacts.

## What Helm does

The Helm CLI/library:

1. loads a chart from a directory, archive, repo, URL, or OCI registry;
2. loads dependencies from `charts/` or `Chart.yaml`/`Chart.lock`;
3. merges default values, values files, and command-line overrides;
4. validates chart metadata, `kubeVersion`, and optional `values.schema.json`;
5. installs CRDs from `crds/` before templates on install;
6. renders templates using Go templates, Helm built-ins, and Sprig functions;
7. optionally post-renders manifests;
8. creates/patches/deletes Kubernetes objects through the API server;
9. stores release metadata through the configured storage backend.

## What happens inside the cluster

Helm-created resources are ordinary Kubernetes objects. Kubernetes controllers run the app after Helm exits:

- Deployments create ReplicaSets/Pods.
- StatefulSets create Pods/PVCs.
- Services and Ingress/Gateway resources depend on cluster networking/controllers.
- Custom resources need their CRD and a separate controller to reconcile them.

Modern Helm does **not** run a scheduler, sidecar, or Tiller-like server in the cluster.

## Persistent cluster resources Helm needs

Modern Helm does not need an in-cluster controller or database. It normally persists release records:

- Default: Kubernetes Secrets in the release namespace.
- Optional: ConfigMaps via `HELM_DRIVER=configmap`.
- Optional/beta: PostgreSQL SQL backend for very large release metadata or externalized storage.

Release metadata can include chart content, values, hooks, and rendered manifests. Treat release Secrets as sensitive.

## Values precedence mental model

For plain Helm CLI, values are layered roughly as:

1. chart `values.yaml` defaults;
2. parent chart values for subcharts and `global` values;
3. one or more `-f/--values` files, rightmost wins;
4. command-line setters such as `--set`, `--set-string`, `--set-file`, generally highest for that invocation.

GitOps tools add their own layers. Argo CD documents precedence as `parameters > valuesObject > values > valueFiles > chart values.yaml`.

## Release storage and namespaces

- Helm 3+ release names are namespace-scoped.
- `helm list` defaults to the current namespace; use `-n` or `-A` deliberately.
- Reading Helm release information usually requires Secret read/list/watch permissions in the release namespace.
- A release's storage namespace matters for tools such as Flux and for `helm get` inspection.

## Key distinction table

| Thing | Owned by | Persists after Helm exits? | Rollback effect |
|---|---|---:|---|
| Rendered manifest | Helm release record | Yes, in release metadata | Previous manifest can be re-applied |
| Kubernetes objects | Kubernetes API/controllers | Yes, until deleted | Spec changes can be reverted |
| Pods | Workload controllers | Usually recreated | New Pods may be created |
| PVC data | Storage subsystem/app | Yes unless deleted separately | Not restored by Helm rollback |
| CRDs from `crds/` | Cluster API lifecycle | Yes | Not upgraded/deleted by Helm from `crds/` |
| Hook-created resources | Kubernetes API | Often yes | Not managed like normal release resources |
| External DB/cloud state | External system/app | Yes | Not restored by Helm rollback |

## Version caveats

- Helm 2 used Tiller; Helm 3 removed it.
- Helm 4 docs introduce changes such as server-side apply behavior, plugin redesign, OCI digest installs, and flag renames. Inspect local `helm help` before relying on exact flags in automation.
- Several current Helm 4 docs pages may still contain Helm 3-era wording. Prefer local command help and versioned docs when precision matters.
