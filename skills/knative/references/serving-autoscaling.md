# Serving and Autoscaling

Use this for Knative Services, Revisions, Routes, traffic splits, KPA, activator, queue-proxy, cold starts, and scale-to-zero.

## Serving Object Model

```text
Service -> Configuration + Route
Configuration -> latest created/ready Revision
Revision -> immutable pod template snapshot
Revision -> Deployment/ReplicaSet/Pods + queue-proxy sidecar
Route -> traffic split across Revisions
ServerlessService (SKS) -> toggles public/private endpoints between activator and pod endpoints
PodAutoscaler -> desiredScale/actualScale and autoscaler state
```

Read conditions in this order when debugging:

```bash
oc -n <ns> get ksvc,configuration,revision,route,sks,podautoscaler
oc -n <ns> describe ksvc <name>
oc -n <ns> describe revision <revision>
oc -n <ns> get pods -l serving.knative.dev/revision=<revision> -o wide
```

## Production-Shaped Service Template

This is a template, not a command to apply blindly.

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: order-processor
  namespace: orders
  labels:
    app.kubernetes.io/part-of: orders
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/min-scale: "1"
        autoscaling.knative.dev/max-scale: "20"
        autoscaling.knative.dev/target: "10"
        autoscaling.knative.dev/target-utilization-percentage: "70"
    spec:
      serviceAccountName: order-processor-sa
      containerConcurrency: 10
      timeoutSeconds: 60
      containers:
        - image: harbor.example.com/orders/processor@sha256:REPLACE_ME
          ports:
            - containerPort: 8080
          readinessProbe:
            httpGet: { path: /healthz, port: 8080 }
            periodSeconds: 1
            failureThreshold: 3
          resources:
            requests: { cpu: 200m, memory: 256Mi }
            limits: { cpu: "1", memory: 512Mi }
```

Initial sizing:

- `containerConcurrency: 1` for strict Lambda parity or non-thread-safe code.
- `containerConcurrency: 5-20` for typical IO-bound HTTP/Eventing handlers after load testing.
- `containerConcurrency: 0` means unlimited; avoid it for production unless explicitly justified.
- `min-scale: 1` for latency-sensitive paths; `0` for idle/best-effort workloads.
- `max-scale` should always exist on shared clusters to protect downstreams and tenants.

## Autoscaler Mechanics

Default KPA scaling signal is in-flight request concurrency.

Key knobs:

| Knob | Meaning | Common default / posture |
|---|---|---|
| `containerConcurrency` | hard per-pod request limit, `0` = unlimited | choose real app capacity |
| `autoscaling.knative.dev/target` | desired concurrency per pod | workload-specific |
| `target-utilization-percentage` | fraction of target considered healthy | commonly 70 |
| `min-scale` | warm floor | 0 for idle, 1+ for critical paths |
| `max-scale` | safety ceiling | always explicit in prod |
| `target-burst-capacity` | extra burst capacity before activator drops off | default often 200; `-1` pins activator on path |
| `panic-threshold-percentage` | threshold for panic mode | commonly 200% |

Approximation:

```text
needed pods ~= ceil(observed concurrency / (target * utilization))
```

For request rate:

```text
concurrency ~= RPS * average_duration_seconds
```

## Activator and SKS

Activator is a buffer/load-shedder, not a general load balancer. In warm steady state it should usually be off path.

Activator stays on path when:

- pods are scaled to zero
- excess burst capacity is negative
- `target-burst-capacity: -1` pins it on path intentionally

Useful checks:

```bash
oc -n <ns> get sks <revision>-sks -o yaml
oc -n <ns> get podautoscaler <revision> -o yaml
oc -n knative-serving logs deploy/activator --tail=200
oc -n knative-serving logs deploy/autoscaler --tail=200
```

Watch for:

- `mode: Proxy` despite pods Ready -> EBC/target-burst/capacity issue
- activator logs `breaker is overloaded` -> burst capacity or activator sizing problem
- queue-proxy logs `dropping the request` -> concurrency breaker rejecting

## Cold-Start Budget

Cold start is usually dominated by your artifact and platform, not Knative itself:

```text
external request
  + ingress / route / mesh
  + activator buffering
  + autoscaler decision
  + scheduler placement
  + Harbor image pull or cache hit
  + container start
  + app init
  + readiness/startup probes
  + kube-proxy/IPVS/OVN endpoint propagation
```

Mitigation hierarchy:

1. Use `min-scale: 1` for critical paths.
2. Reduce image size and startup work.
3. Use digest-pinned images and reliable local registry/cache.
4. Set realistic startup/readiness probes.
5. Pre-warm before known bursts if operationally needed.
6. Tune activator/KPA only after proving the bottleneck.

## Traffic Split and Rollback

Canary pattern:

```yaml
spec:
  traffic:
    - revisionName: order-processor-v1
      percent: 90
    - latestRevision: true
      percent: 10
```

Rollback pattern:

```yaml
spec:
  traffic:
    - revisionName: order-processor-v1
      percent: 100
```

Do not redeploy the old image just to roll back live traffic. Route rollback avoids image pull, scheduler, and new Revision risk.

## Common Serving Failure Signatures

| Symptom | Likely layer | First probes | Common trap |
|---|---|---|---|
| Service URL 404/503 | Route/ingress/Revision not ready | `ksvc`, `route`, `revision`, Kourier/Route status | checking only user logs |
| Revision Ready=False | image pull, probe, pod template, SCC | `describe revision`, pod events, queue-proxy/user logs | editing Deployment |
| First request slow | cold start | pod events timing, image pull, app init | blaming activator immediately |
| Stuck in Proxy mode | SKS/EBC/burst config | `sks`, `podautoscaler`, activator logs | raising replicas manually |
| Scale not increasing | concurrency not observed or target too high | queue-proxy metrics/logs, load shape | load testing with sequential curl |
| Too many pods/downstream overload | max-scale/source parallelism absent | pod count, downstream metrics, source parallelism | raising max-scale again |

## OpenShift-Specific Leaks

- Default SCC may run images with random UID; images expecting root or fixed writable paths fail.
- Private Harbor pulls need ServiceAccount pull secrets and possibly cluster CA trust.
- Kourier/OpenShift Routes own ingress behavior in OpenShift Serverless.
- Service Mesh adds another sidecar and mTLS/probe-rewrite edge cases.
- Operator-managed Knative components should be changed through supported CRs/config, not raw upstream patches.
