# Security, Identity, and SCC

Use this for SCC/PSA, OAuth, identity providers, kubeadmin lifecycle, ServiceAccount tokens, auth incidents, and least-privilege OpenShift security patterns.

## SCC Mental Model

Security Context Constraints are OpenShift's pod admission gate. SCC access is granted to users, groups, or ServiceAccounts. The pod's ServiceAccount and creating user determine which SCCs are candidates.

Selection order:

1. higher `priority` first (`nil` = 0)
2. more restrictive first
3. name order

The first matching SCC wins and is recorded as pod annotation `openshift.io/scc`.

## Common SCCs

| SCC | Allows | Use |
|---|---|---|
| `restricted-v2` | random UID, no host, caps dropped | default modern posture |
| `nonroot-v2` | specified non-zero UID | fixed-UID non-root apps |
| `anyuid` | UID 0 or any UID | legacy images only, dedicated SA only |
| `hostnetwork-v2` | host network/ports | networking/ingress agents |
| `hostmount-anyuid` | hostPath + any UID | storage/node agents |
| `privileged` | near everything | last resort, tightly justified |

## SCC Grant Pattern

SCC grants are security-impacting mutations. Do not start with a grant command.

Preflight:

- prove the pod is rejected by SCC/PSA events, not image pull, scheduling, or app crash
- identify the workload ServiceAccount and current SCC candidates
- prove image or pod `securityContext` repair is insufficient or not possible
- choose a dedicated ServiceAccount, not namespace `default`
- record owner, reason, expected duration, and least-privilege SCC choice
- get explicit approval for `anyuid`, `host*`, or `privileged` access

Only after that, prefer RBAC binding to the SCC ClusterRole:

```bash
oc create rolebinding app-anyuid \
  --clusterrole=system:openshift:scc:anyuid \
  --serviceaccount=<namespace>:<serviceaccount> \
  -n <namespace>
```

Rules:

- Bind to a dedicated ServiceAccount.
- Use namespaced `RoleBinding` unless cluster-wide scope is deliberate.
- Never grant SCC use to `system:authenticated`.
- Avoid legacy `oc adm policy add-scc-to-user` for durable desired state.
- Never bind `anyuid` or `privileged` to the namespace `default` ServiceAccount as a convenience fix.

Post-check:

```bash
oc -n <namespace> auth can-i use scc/anyuid --as=system:serviceaccount:<namespace>:<serviceaccount>
oc get pod <pod> -n <namespace> -o jsonpath='{.metadata.annotations.openshift\.io/scc}{"\n"}'
```

Rollback, only if needed:

```bash
oc delete rolebinding app-anyuid -n <namespace>
```

Rollback deletes only the SCC binding; it does not undo workload changes or already-created side effects.

## SCC Denial Debug Workflow

```bash
oc get events -n <ns> | grep -i scc
oc describe pod <pod> -n <ns>
oc get pod <pod> -n <ns> -o jsonpath='{.spec.serviceAccountName}'
oc get pod <pod> -n <ns> -o jsonpath='{.metadata.annotations.openshift\.io/scc}{"\n"}'
oc -n <ns> auth can-i use scc/restricted-v2 --as=system:serviceaccount:<ns>:<sa>
oc -n <ns> auth can-i use scc/anyuid --as=system:serviceaccount:<ns>:<sa>
oc adm policy who-can use scc anyuid
```

Decision path:

- Image unnecessarily requires root -> fix image (`USER`, writable dirs group-owned by 0, no root-owned runtime paths).
- Image needs fixed non-root UID -> `nonroot-v2` or custom SCC.
- Third-party image truly needs root -> dedicated SA + `anyuid`, documented exception.
- Needs host/network/privileged -> custom least-privilege SCC or vendor operator pattern; review as high-risk.

## PSA Interaction

OpenShift runs Pod Security Admission alongside SCC. PSA label sync tries to align namespace labels with SCC grants. Manual PSA labels can conflict with SCC grants.

If SCC permits but PSA blocks, inspect namespace labels:

```bash
oc get ns <ns> -o yaml | grep pod-security.kubernetes.io
```

Do not fight the controller unless you understand the tenancy policy.

## OAuth and Identity

Integrated OAuth is the normal self-managed OCP path:

- `OAuth/cluster` configures htpasswd, LDAP, OIDC-as-IdP, GitHub/GitLab/Google, RequestHeader.
- `Authentication/cluster` controls integrated OAuth vs direct External OIDC mode in newer versions.
- Users, Identities, and Groups are real cluster-scoped CRs.
- The apiserver validates OpenShift OAuth tokens through webhook integration.

Identity probes:

```bash
oc get oauth cluster -o yaml
oc get authentication cluster -o yaml
oc get user
oc get identity
oc get group
oc whoami
oc whoami --show-server
oc whoami --show-console
```

## kubeadmin Lifecycle

Remove `kubeadmin` only after all are true:

- real IdP configured and reachable
- at least one real user/group has `cluster-admin`
- login as that user is verified
- break-glass account exists and credentials are protected
- recovery procedure is documented

Deletion is high-risk:

```bash
oc delete secret kubeadmin -n kube-system
```

Do not present this as routine cleanup without preflight.

## ServiceAccount Tokens

Modern OpenShift uses bound, projected, time-limited tokens for pods. Long-lived SA token Secrets are no longer auto-created in modern 4.x.

Use short-lived token creation when practical:

```bash
oc create token <serviceaccount> --duration=1h --audience=<audience>
```

This prints a credential to stdout. Run only in a secure local terminal; never paste the output into chat, logs, tickets, or public docs.

If a long-lived token Secret is explicitly created for an external system, treat it as a credential: store securely, rotate, audit, and avoid logging it.

## External OIDC Caveat

External OIDC mode can remove the integrated OAuth server in newer versions, but it affects oauth-proxy-based integrations and operator estates. Default to integrated OAuth delegating to LDAP/OIDC unless you control the full estate and have version-verified compatibility.

## Guardrails

- Do not recommend disabling SCC or PSA as a fix.
- Do not grant `privileged` or broad SCCs without a written reason, scope, owner, and review.
- Do not print tokens (`oc whoami -t`) in shared logs or public docs.
- Do not delete `kubeadmin` without verified alternate admin.
- Do not use RequestHeader auth without strict CA and client CN controls.
