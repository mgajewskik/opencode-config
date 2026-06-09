# Helm Chart Authoring

Use this for creating, refactoring, or reviewing charts. The legacy `helm-chart-scaffolding` material contributed useful structure, helper, validation, and template ideas; this reference tightens them with current Helm caveats and safer defaults.

## First decisions

Before writing files, answer:

1. Is this an **application chart** or **library chart**?
2. Is this a single app, a platform add-on, or an umbrella chart?
3. Who owns lifecycle: chart maintainer, app team, platform team, Argo CD, Flux, or CI?
4. Does the chart create CRDs, cluster roles, PVCs, webhooks, hooks, or external dependencies?
5. Which values are stable public API versus environment-specific deployment data?

Prefer the smallest chart that matches the lifecycle. Do not make an umbrella chart just because several services deploy together once.

## Standard structure

```text
mychart/
  Chart.yaml          # required chart metadata
  values.yaml         # default values
  values.schema.json  # optional JSON Schema for final .Values
  Chart.lock          # generated dependency lock
  charts/             # vendored dependency charts
  crds/               # CRDs, plain YAML, not templated
  templates/          # Go-templated Kubernetes manifests
  templates/_helpers.tpl
  templates/NOTES.txt
  templates/tests/
  README.md
  LICENSE
  .helmignore
```

Use `helm create NAME` for a baseline, then delete anything not needed. Generated scaffolds are starting points, not production proof.

## `Chart.yaml` rules

Minimum:

```yaml
apiVersion: v2
name: my-app
description: A Helm chart for my app
type: application
version: 0.1.0
appVersion: "1.0.0"
```

Guidelines:

- `version` is the chart/package version. Keep it SemVer-compatible.
- `appVersion` is informational application version; quote it.
- Use `kubeVersion` when the chart relies on Kubernetes API features.
- Put dependencies in `Chart.yaml`; commit `Chart.lock` intentionally when vendoring/reproducibility matters.
- Use `annotations` for custom chart metadata; unknown top-level fields are not safe.

## Values API design

Treat `values.yaml` as a public API.

- Prefer documented, stable keys over arbitrary raw YAML passthroughs.
- Document every key with comments beginning with the key name.
- Quote strings in values; be explicit about YAML type traps.
- Keep environment overrides in separate values files rather than long `--set` invocations.
- Prefer maps over lists when users need to override individual entries by key.
- Use `values.schema.json` for non-trivial charts. Schema validation runs on the final `.Values` object for `install`, `upgrade`, `lint`, and `template` unless skipped.

Reasonable top-level defaults for an app chart:

```yaml
replicaCount: 1

image:
  repository: nginx
  tag: ""
  pullPolicy: IfNotPresent

serviceAccount:
  create: true
  annotations: {}
  name: ""

rbac:
  create: true

service:
  type: ClusterIP
  port: 80

resources: {}

nodeSelector: {}
tolerations: []
affinity: {}
```

Avoid putting Helm template expressions inside `values.yaml` unless templates intentionally evaluate them with `tpl`. Values are normally data, not templates.

## Template structure

Official Helm best practices:

- Template files that emit YAML should end in `.yaml`.
- Helper/partial files can use `.tpl` and usually live in `_helpers.tpl`.
- Use dashed filenames and include the resource kind, e.g. `deployment.yaml`, `service-account.yaml`.
- Prefer one resource definition per template file.
- Namespace all defined templates because they are globally accessible across subcharts.
- Use two-space indentation and whitespace chomping deliberately.

## Helpers and labels

Use helpers for names and shared labels. Recommended labels include:

- `app.kubernetes.io/name`
- `app.kubernetes.io/instance`
- `app.kubernetes.io/managed-by`
- `app.kubernetes.io/version`
- `app.kubernetes.io/component`
- `app.kubernetes.io/part-of`
- `helm.sh/chart`

Keep selector labels stable. Changing selector labels can force replacements or break Services.

Example helper pattern:

```gotemplate
{{- define "my-app.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "my-app.labels" -}}
helm.sh/chart: {{ include "my-app.chart" . }}
app.kubernetes.io/name: {{ include "my-app.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
{{- end -}}
```

## Template functions that matter

- `include`: include a named template and pipe its output, commonly to `nindent`.
- `required`: fail rendering with a useful message when a value is mandatory.
- `tpl`: evaluate a string as a template; powerful but can surprise users and complicate security/reproducibility.
- `toYaml | nindent`: render nested values with correct indentation.
- `quote`: quote strings. Do not quote integer fields such as container ports, except env var values are strings.
- `sha256sum`: annotate Pod templates with config checksums to trigger safe rollouts when ConfigMaps/Secrets change.

Avoid random functions in GitOps-managed charts unless perpetual drift is intentional.

## Dependencies

Declare dependencies in `Chart.yaml`:

```yaml
dependencies:
  - name: postgresql
    version: "12.0.0"
    repository: "https://charts.example.com"
    condition: postgresql.enabled
```

Commands:

```sh
helm dependency update ./chart   # resolve and write Chart.lock
helm dependency build ./chart    # rebuild charts/ from Chart.lock
helm dependency list ./chart
```

Dependency resources are aggregated into one release. Use dependencies when lifecycle is genuinely coupled; avoid hiding unrelated systems inside one release.

## Validation ladder for authored charts

Run the strongest safe checks available:

```sh
helm lint ./chart
helm template test-release ./chart --debug
helm template test-release ./chart -f values-prod.yaml --debug
helm install test-release ./chart --dry-run --debug
helm install test-release ./chart --dry-run=server --debug   # when cluster/API lookup matters
```

Rendering and dry-run output can include Secret manifests and decoded-looking sensitive values. Redact before pasting output into chat, tickets, logs, or public CI artifacts.

Then, in a disposable namespace if approved:

```sh
helm install test-release ./chart -n helm-test --create-namespace --wait
helm test test-release -n helm-test --logs
helm uninstall test-release -n helm-test
```

## Packaging and distribution

```sh
helm package ./chart
helm repo index . --url https://charts.example.com
helm push mychart-0.1.0.tgz oci://registry.example.com/charts
```

For OCI pushes, Helm infers chart name and version from `Chart.yaml`; the push reference omits basename and tag.

## Chart authoring acceptance checklist

- `Chart.yaml` is valid, versioned, and has a clear chart/app version distinction.
- Values are documented, minimal, and schema-validated if non-trivial.
- Templates render deterministic, valid Kubernetes YAML.
- Selector labels are stable and standard labels exist.
- Dependencies are pinned and locked when reproducibility matters.
- CRDs, hooks, RBAC, PVCs, and external side effects are explicitly documented.
- `helm lint`, `helm template --debug`, and dry-run checks pass.
