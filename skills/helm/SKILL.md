---
name: helm
description: "Senior-level Helm and Helm chart guidance for Kubernetes. Use when creating, reviewing, debugging, or operating Helm charts/releases: Chart.yaml, values.yaml, templates, dependencies, CRDs, hooks, RBAC, helm install/upgrade/rollback, OCI/provenance, Argo CD/Flux Helm workflows."
license: Apache-2.0
metadata:
  author: local
  version: "0.1"
---

# Helm

Production-first Helm guidance for Kubernetes. Optimize for mechanism-level correctness, minimal chart surface area, safe release operations, reproducible validation, and clear ownership boundaries. Skip generic Kubernetes tutorials unless the user asks.

## Start Here

Classify the request first, then read the smallest useful reference.

- Core chart/repository/release model, Helm CLI vs cluster behavior, release storage, Tiller removal, values precedence -> read [references/core-mechanics.md](references/core-mechanics.md)
- Creating, restructuring, or reviewing chart files, `Chart.yaml`, `values.yaml`, helpers, labels, schemas, dependencies, tests, packaging -> read [references/chart-authoring.md](references/chart-authoring.md)
- Installing, upgrading, rolling back, uninstalling, release history/storage, namespaces, `--wait`, release API deprecations -> read [references/release-operations.md](references/release-operations.md)
- Template/render/install failures, failed upgrades, missing releases, RBAC, stuck hooks, GitOps drift, incident triage -> read [references/debugging-and-validation.md](references/debugging-and-validation.md)
- CRDs, hooks, chart tests, Helm/Kubernetes RBAC resources, service accounts, cluster-scoped blast radius -> read [references/crds-hooks-and-rbac.md](references/crds-hooks-and-rbac.md)
- Argo CD/Flux Helm semantics, OCI registries, provenance, signatures, chart repos, digest pinning, random render traps -> read [references/gitops-and-supply-chain.md](references/gitops-and-supply-chain.md)
- Fast commands, chart review checklist, release safety checklist, anti-patterns -> read [references/quick-reference.md](references/quick-reference.md)

## Use This Skill For

- explaining how Helm charts, releases, values, and the Helm CLI work
- creating or refactoring Helm charts for Kubernetes applications
- reviewing chart structure, values API, templates, labels, dependencies, and tests
- debugging `helm template`, `helm install`, `helm upgrade`, `helm rollback`, or `helm uninstall`
- designing safe CRD, hook, RBAC, and release-history handling
- deciding direct Helm CLI vs Argo CD vs Flux helm-controller ownership
- packaging and distributing charts via classic chart repositories or OCI registries
- hardening Helm supply chain, provenance, digest pinning, and secret handling

## Do Not Use This Skill For

- generic Kubernetes manifests when Helm packaging/release behavior does not matter
- raw application debugging after Kubernetes accepted the manifests, except to separate Helm from workload failure
- OpenShift/Knative/Terraform/Ansible-specific advice better handled by those skills
- live cluster mutation, registry changes, or release rollback without preflight, user approval, and rollback/restore plan
- treating Helm as a continuous reconciler in plain CLI mode
- claiming Helm 3/4 requires Tiller or an in-cluster Helm controller

## Default Operating Stance

- Start by identifying the mode: explain, author, review, operate, debug, CRD/hook/RBAC, GitOps, or supply chain.
- Treat versions as material. Inspect or ask for `helm version --short`, chart `apiVersion`, Kubernetes version, chart version, GitOps controller version, and relevant command help/schema when behavior matters.
- Prefer current local evidence over memory: `Chart.yaml`, `values.yaml`, rendered manifests, `helm get`, release Secrets/ConfigMaps, Kubernetes events, and controller status.
- Render before applying: `helm lint`, `helm template --debug`, and `helm install --dry-run --debug` or `--dry-run=server` when server-side lookup/validation matters.
- Keep values small, documented, schema-validated, and stable. Treat `values.yaml` as a public API.
- Separate Helm release state from Kubernetes object state and application data state.
- For risky operations, provide preflight, blast radius, rollback/restore path, validation, and stop condition.

## Core Mental Models

1. **Helm is compile/apply plus release history.** Charts are source, values are inputs, rendered manifests are output, release Secrets are the ledger.
2. **Kubernetes runs the app, not Helm.** Helm sends ordinary Kubernetes objects to the API; controllers reconcile after the CLI exits.
3. **No Tiller in modern Helm.** Helm 3/4 use kubeconfig/RBAC and store release metadata by default as Secrets in the release namespace.
4. **A release is identity plus revision history.** Release name, namespace, values, manifest, status, and storage driver define what Helm can operate on.
5. **Values are API surface.** Every exposed key becomes a compatibility contract and operational burden.
6. **Templates are text that must become valid Kubernetes objects.** Whitespace, type coercion, and API versions fail at different layers.
7. **CRDs are API lifecycle, not normal app YAML.** Helm installs CRDs from `crds/` before templates, but does not template, upgrade, or delete them.
8. **Plain Helm is not drift correction.** GitOps controllers may reconcile continuously, but their Helm ownership semantics differ.

## Interview Triggers

Ask focused questions before final guidance when any are true:

- production release, rollback, uninstall, namespace, CRD, hook, RBAC, admission webhook, or storage-driver changes are involved
- versions are material but missing: Helm 3 vs 4, Kubernetes minor, chart API version, GitOps controller version
- the chart has CRDs, cluster-scoped resources, data migrations, PVCs, external services, or secret material
- the user asks for "best practices" without workload shape, distribution model, environment count, and owner/lifecycle boundaries
- Argo CD, Flux, CI/CD, OCI registry, provenance, or private repositories are involved

High-value questions:

1. Direct Helm CLI, CI, Argo CD, Flux helm-controller, or another operator owns the lifecycle?
2. What Helm version, Kubernetes version, chart version, target namespace, and storage namespace are involved?
3. Is this chart application-only, CRD/controller, platform add-on, or umbrella chart?
4. Are values files, `--set`, GitOps parameters, or external Secret/ConfigMap values the source of truth?
5. What is the rollback expectation for manifests, PVCs, database migrations, and external systems?
6. What validation can run safely: local render, server dry-run, disposable namespace, staging, or canary?

## Mode Router

Choose one primary mode and at most one secondary mode.

| Mode | Use when | Load |
|---|---|---|
| `model` | explaining charts, releases, CLI, storage, cluster behavior, values precedence | `references/core-mechanics.md` |
| `author` | creating or restructuring a chart, chart layout, helpers, `Chart.yaml`, package/repo shape | `references/chart-authoring.md` |
| `values` | designing `values.yaml`, schema, environment overrides, `--set`, subchart/global values | `references/chart-authoring.md` |
| `template` | Go template functions, labels, helpers, checksum rollouts, whitespace/type issues | `references/chart-authoring.md` |
| `operate` | install/upgrade/rollback/uninstall, history, namespaces, storage, wait/timeout | `references/release-operations.md` |
| `debug` | failed render/install/upgrade, missing release, drift, hook failure, RBAC errors | `references/debugging-and-validation.md` |
| `crd` | CRDs in `crds/`, custom resources, API lifecycle, cluster-scoped resources | `references/crds-hooks-and-rbac.md` |
| `hooks` | pre/post lifecycle hooks, migrations, tests, cleanup policies, Job behavior | `references/crds-hooks-and-rbac.md` |
| `rbac` | chart RBAC templates, service accounts, user permissions for Helm operations | `references/crds-hooks-and-rbac.md` |
| `gitops` | Argo CD or Flux Helm behavior, releaseName, drift, random data, controller ownership | `references/gitops-and-supply-chain.md` |
| `supply-chain` | OCI, chart repositories, provenance, signatures, digest pinning, private repos | `references/gitops-and-supply-chain.md` |
| `review` | chart or release review, risk ranking, acceptance gates | `references/quick-reference.md` plus nearest domain reference |

Common combinations:

- `author` + `values` for chart scaffolding and API design
- `operate` + `debug` for failed releases
- `crd` + `operate` for platform add-ons
- `gitops` + `supply-chain` for multi-cluster chart delivery
- `review` + (`author`, `crd`, `gitops`, or `supply-chain`) for targeted review

## Core Workflow

1. Identify mode, owner, versions, target namespace/storage namespace, chart source, and blast radius.
2. Load the nearest reference only.
3. Gather file or command evidence before generating broad advice.
4. Separate render-time, apply-time, reconcile-time, and application-runtime failures.
5. Recommend the smallest chart/release change that preserves ownership and rollback semantics.
6. Include exact validation and non-occurrence checks.
7. Label version-sensitive or docs-derived claims when local validation is unavailable.

## Output Contract

Default response shape:

1. `Verdict` - recommended path or likely failure layer
2. `Why` - Helm/Kubernetes mechanism, not slogan
3. `Smallest safe path` - probes first, then minimal edit/command if warranted
4. `Risks / edge cases` - values, CRDs, hooks, RBAC, storage, GitOps, data, version caveats
5. `Validation` - exact render/server/cluster checks that prove success
6. `Rollback / next step` - release rollback, values revert, chart change, or next probe

Mode-specific additions:

- `author`: add `Chart shape`, `Values API`, `Templates`, `Validation gates`
- `debug`: add `Likely layer`, `Evidence to collect`, `Do not do yet`, `Stop condition`
- `review`: use `Verdict`, `Blockers`, `Risks`, `Evidence`, `Suggested fixes`, `Smallest next step`
- `gitops`: add `Lifecycle owner`, `Rendered source of truth`, `Drift behavior`

## Guardrails

- Do not say Helm 3/4 requires Tiller or a persistent in-cluster controller.
- Do not claim plain Helm continuously reconciles drift.
- Do not treat `helm install` success as proof the application is healthy.
- Do not hide that release metadata Secrets may contain sensitive rendered values.
- Do not put secrets in values files without a secret-management plan.
- Do not recommend cluster-admin as a workaround for chart/RBAC design problems.
- Do not assume Helm upgrades or deletes CRDs from `crds/`.
- Do not use non-idempotent hooks for migrations without cleanup, timeout, backup, and rollback/data strategy.
- Do not recommend `randAlphaNum` or time-dependent templates in GitOps-managed charts unless drift is intentional.
- Do not mutate releases, CRDs, hooks, storage backends, registries, or production namespaces without explicit approval.

## Success Criteria

Pass when all are true:

- guidance distinguishes chart, values, rendered manifest, release, release storage, and Kubernetes workload state
- version-sensitive behavior is checked locally or caveated
- chart authoring advice minimizes values surface and includes schema/docs where non-trivial
- debug advice identifies the failure layer before fixing
- CRDs, hooks, RBAC, and GitOps ownership are handled as separate lifecycle concerns
- risky operations include preflight, rollback/restore, validation, and stop condition

Fail when any are true:

- response is generic Kubernetes advice while ignoring Helm release/storage/template behavior
- advice conflates Argo CD Helm inflation with Helm CLI release management
- chart examples expose credentials or normalize plaintext secret values
- commands mutate production before rendering, dry-run, RBAC, and rollback checks
- CRDs, PVCs, hooks, or external data are assumed to uninstall or rollback automatically

## Failure Modes

| Scenario | Detection | Fallback |
|---|---|---|
| Version unclear | No Helm/Kubernetes/chart/GitOps version evidence | Ask for or inspect versions and command help before version-specific guidance |
| Ownership unclear | Helm CLI, Argo CD, Flux, CI, or operator may all touch the same resources | Identify lifecycle owner before recommending commands |
| Vague chart request | User asks "make a Helm chart" without app shape | Ask for workload kind, image, ports, config, persistence, ingress, dependencies, environments |
| Risky release operation | Upgrade/rollback/uninstall/CRD/hook/storage change in shared/prod cluster | Require preflight, approval, rollback/restore, validation, and stop condition |
| Render succeeds but app fails | Kubernetes accepted manifests but Pods/services fail | Switch to Kubernetes workload debugging and separate Helm evidence from app evidence |
| External docs needed | Local files/CLI cannot answer API/version behavior | Prefer official versioned Helm/Kubernetes/Argo/Flux docs; label uncertainty |

### When in doubt

- Render first.
- Inspect release history and manifests before changing anything.
- Prefer a smaller values API over a configurable kitchen sink.
- Prefer separate CRD lifecycle when blast radius matters.
- Prefer deterministic templates over clever dynamic rendering.
