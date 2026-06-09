# Helm Debugging and Validation

Use this when Helm output or operations fail. Start by locating the failure layer.

## Failure-layer ladder

1. **Chart load:** invalid `Chart.yaml`, missing files, dependency lock mismatch.
2. **Values merge/schema:** wrong value path, YAML type, missing required value, schema failure.
3. **Template render:** Go template error, whitespace/indentation invalid YAML, `required`, `tpl`, missing helper.
4. **Client validation:** deprecated/unknown APIs, OpenAPI/schema validation, dry-run limitations.
5. **Kubernetes API apply:** RBAC, quotas, admission webhooks, missing CRDs, immutable fields, existing ownership conflicts.
6. **Controller reconcile:** Deployment/StatefulSet/Job/Ingress/controller-specific failure after objects are accepted.
7. **Application runtime:** image pull, config, probes, app crash, database, networking.
8. **GitOps/controller ownership:** Argo CD/Flux drift, release history absent, controller remediation loop.

Do not fix layer 7 by changing Helm templates unless evidence points there.

## First-line commands

```sh
helm lint ./chart
helm template myrel ./chart -f values.yaml --debug
helm install myrel ./chart -f values.yaml --dry-run --debug
helm install myrel ./chart -f values.yaml --dry-run=server --debug
helm status myrel -n myns
helm history myrel -n myns
helm get values myrel -n myns --all
helm get manifest myrel -n myns
helm get hooks myrel -n myns
kubectl get events -n myns --sort-by='.lastTimestamp'
kubectl describe <kind>/<name> -n myns
```

Use `--dry-run=server` when templates use `lookup` or when server discovery/admission matters. It still cannot fully simulate all runtime behavior.

Render and dry-run output may include Kubernetes Secret manifests or sensitive values. Redact before sharing outside the trusted deployment boundary.

## Symptom table

| Symptom | Likely layer | Probe | Common fix |
|---|---|---|---|
| `parse error` or `nil pointer evaluating` | Template render | `helm template --debug` | Guard optional maps, fix helper scope, add defaults/schema |
| YAML parse error | Template render/output | Comment suspect block, render with `--debug` | Fix indentation, `nindent`, whitespace chomping, quoting |
| Values ignored | Values merge | `helm get values --all`, render computed output | Correct path, file order, `--set` escaping, subchart scope |
| `no matches for kind` | Missing CRD or removed API | `kubectl api-resources`, `helm get manifest` | Install CRD first or update API version |
| Forbidden/RBAC | Kubernetes API apply or release metadata read | `kubectl auth can-i`, inspect resource kinds | Add least-privilege Role/Binding; do not default to cluster-admin |
| `helm list` empty | Namespace/storage/ownership | `helm list -A`, `kubectl get secret -l owner=helm` | Use correct namespace/storage owner; check Argo CD/Flux behavior |
| Upgrade timeout | Controller reconcile/hook | `helm status`, Jobs/Pods/events | Inspect failing resources; decide forward fix vs rollback |
| Hook stuck or orphaned | Hook lifecycle | `helm get hooks`, `kubectl get job,pod` | Add hook delete policy/TTL; clean safely |
| Argo CD always OutOfSync | Nondeterministic render | `argocd app diff`, render repeatedly | Pin generated values; remove random/time functions |
| Release Secret too large | Release storage | Error mentions object size/etcd | Split chart/release, reduce embedded files/history, consider SQL only if justified |

## Debug workflow

1. Freeze repeated deploy attempts if the state is changing.
2. Capture release and controller evidence before mutation.
3. Identify the layer using the ladder above.
4. Reproduce with local render or dry-run when practical.
5. Make the smallest change that addresses the identified layer.
6. Validate the same failing path.
7. Record what remains outside Helm's control.

## Chart validation gates

For chart authoring/review:

- `helm lint` passes.
- `helm template --debug` renders all supported values profiles.
- Required values fail with useful errors.
- `values.schema.json` rejects invalid values.
- Generated manifests use supported Kubernetes API versions for target clusters.
- Standard labels exist and selector labels are stable.
- CRDs, hooks, and tests are documented and behave deterministically.

Optional external validators, if available and approved:

- `kubectl apply --dry-run=server -f -` on rendered manifests.
- `kubeconform`, `kubeval`, `pluto`, `datree`, `conftest`, or policy engines used by the project.

Do not invent tool availability. Inspect local repo/CI or ask before adding new dependencies.

## Failed upgrade incident shape

Report:

1. Last known good revision.
2. Failed revision and command/actor.
3. Whether hooks ran and their status.
4. Resources partially applied.
5. Data/PVC/external side effects.
6. Choice: rollback, forward fix, or pause.
7. Validation and stop condition.

## Anti-debugging traps

- Re-running `helm upgrade` repeatedly without preserving evidence.
- Rolling back before checking data migrations or hook side effects.
- Editing Helm-managed live resources without updating chart/source of truth.
- Assuming `--wait` proves application-level readiness.
- Diagnosing Argo CD or Flux behavior with only Helm CLI assumptions.
