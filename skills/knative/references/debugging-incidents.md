# Debugging and Incidents

Use this for broken Services, Revisions, scale-to-zero failures, 503s, activator overload, image pulls, RabbitMQ/Eventing delivery failures, and retry/DLQ incidents.

## Incident Stance

Diagnose then act. Do not start by deleting pods, editing Knative-owned Deployments, disabling scale-to-zero, or redeploying images.

Always identify the path:

- **Serving path**: ingress/Route -> SKS/activator or Service endpoints -> queue-proxy -> user container -> downstream
- **Event path**: RabbitMQ/Kafka/source -> Broker/Trigger if any -> sink/queue-proxy -> user container -> DLQ
- **Platform path**: operator CRs/controllers -> Kourier/Routes -> SCC/RBAC/NetworkPolicy -> registry/admission

## First Five Minutes

Read-only probes:

```bash
oc -n <ns> get ksvc,configuration,revision,route,sks,podautoscaler
oc -n <ns> get pods -o wide
oc -n <ns> get events --sort-by=.lastTimestamp
oc -n <ns> describe ksvc <name>
```

Then pick the failing layer.

## Serving Triage Tree

```text
Service broken
├─ ksvc Ready=False?
│  ├─ Configuration/Revisions not Ready -> image/probe/pod/SCC/resource issue
│  └─ Route not Ready -> ingress/domain/Kourier/Route issue
├─ Revision Ready=False?
│  ├─ ImagePullBackOff -> Harbor secret/CA/admission/image ref
│  ├─ ContainerMissing/CrashLoop -> user container/logs/resources
│  └─ Probe failed -> readiness path/port/startup timing
├─ Ready but 503?
│  ├─ SKS Proxy mode + activator errors -> scale-from-zero/burst
│  ├─ queue-proxy breaker -> concurrency overload
│  └─ ingress/mesh/network policy -> route/path blocked
└─ Scales wrong?
   ├─ no concurrency observed -> traffic path/test issue
   ├─ target too high/unlimited -> KPA never scales enough
   └─ max-scale/source/downstream cap -> capacity envelope
```

## Revision Not Ready

```bash
oc -n <ns> describe revision <revision>
oc -n <ns> get pods -l serving.knative.dev/revision=<revision>
oc -n <ns> describe pod <pod>
oc -n <ns> logs <pod> -c user-container --tail=200
oc -n <ns> logs <pod> -c queue-proxy --tail=200
```

Common causes:

- wrong image digest/tag, Harbor auth, private CA, admission rejection
- app not listening on `$PORT` or declared `containerPort`
- readiness probe path/port wrong
- slow app startup with too-aggressive probe failure threshold
- SCC/securityContext mismatch on OpenShift
- missing env/secret/configmap

Do not edit the generated Deployment; fix the Knative Service template or the app image.

## Scale-From-Zero 503 / Slow First Request

```bash
oc -n <ns> get sks <revision>-sks -o yaml
oc -n <ns> get podautoscaler <revision> -o yaml
oc -n knative-serving logs deploy/activator --tail=200
oc -n knative-serving logs deploy/autoscaler --tail=200
```

Look for:

- `breaker is overloaded`
- `dropping the request`
- websocket metric disconnects
- desiredScale/actualScale mismatch
- pods Ready but endpoints not updated

Fix hierarchy:

1. If latency-sensitive, set `min-scale: 1` after approval.
2. Reduce image/app startup time.
3. Set realistic readiness/startup probes.
4. Tune `containerConcurrency`, target, `target-burst-capacity`.
5. Scale activator/control plane only if logs/metrics prove it is the chokepoint.

## Stuck in SKS Proxy Mode

Signature: pods Ready, but SKS remains `Proxy` and activator stays on path.

Probes:

```bash
oc -n <ns> get sks <revision>-sks -o jsonpath='{.spec.mode}{"\n"}{.status.conditions}{"\n"}'
oc -n <ns> get podautoscaler <revision> -o yaml
oc -n <ns> get endpoints,svc | grep <revision>
```

Likely causes:

- `target-burst-capacity` too high for warm capacity
- `target-burst-capacity: -1` intentionally pins activator on path
- endpoint propagation lag
- readiness/endpoint mismatch
- Service Mesh/mTLS path mismatch

## Eventing / RabbitMQ Triage

```bash
oc -n <ns> get broker,trigger,source,rabbitmqsource 2>/dev/null
oc -n <ns> describe rabbitmqsource <name>
oc -n <ns> get rabbitmqsource <name> -o yaml
oc -n <ns> get trigger <name> -o yaml
oc -n <ns> logs deploy/<source-or-sink-deployment> --tail=200
```

RabbitMQ-side observations should include queue depth, consumer count, ack rate, unacked messages, connection errors, and DLX/DLQ behavior.

Symptoms:

| Symptom | Likely layer | First probes |
|---|---|---|
| Source Ready=False | credentials, CRD/operator, RabbitMQ DNS/TLS, queue/exchange | Source conditions/logs, RabbitMQ connections |
| Broker Ready=False | broker class/config/operator | Broker status, broker data-plane logs |
| Trigger ready but no events | filter mismatch | event-display actual CloudEvent attributes |
| Queue depth grows | source parallelism, sink errors, downstream slow | RabbitMQ ack rate, source logs, sink 2xx/5xx |
| DLQ fills | sink failing or poison messages | DLQ payload/error attrs, recent deploys, idempotency |
| Retry storm | non-idempotent partial success + 500 | sink logs, duplicate side effects, queue unacked |

## Harbor Pull Failure

Signature: Revision not Ready, pod `ImagePullBackOff`, events mention unauthorized, x509, not found, or admission.

Probes:

```bash
oc -n <ns> describe revision <revision>
oc -n <ns> describe pod <pod>
oc -n <ns> get serviceaccount <sa> -o yaml
oc -n <ns> get secret <pull-secret> -o jsonpath='{.type}{"\n"}'
```

Check without exposing secrets:

- Service uses expected ServiceAccount
- SA has `imagePullSecrets`
- secret type is `kubernetes.io/dockerconfigjson`
- Harbor robot has pull permission
- registry CA is trusted by nodes
- image digest exists
- admission policy allows the signature

## Service Mesh Path Failure

Symptoms: 503s from activator, Envoy mTLS errors, readiness probe mismatch, works outside mesh.

Probes:

```bash
oc -n <ns> get pods -l serving.knative.dev/service=<name> -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[*].name}{"\n"}{end}'
oc -n <ns> describe pod <pod>
oc -n <ns> logs <pod> -c istio-proxy --tail=200
oc -n knative-serving get pods
```

Check whether activator and workload namespaces are consistently in/out of mesh and probe rewriting is set when required.

## Stop Conditions

Stop and ask before suggesting mutation when:

- production traffic split changes are needed
- disabling scale-to-zero or changing min/max scale affects cost/SLA
- source pause/resume or delivery config can lose or duplicate events
- registry CA/admission changes affect cluster-wide image pulls
- Service Mesh membership affects namespace-wide traffic
- RabbitMQ/Kafka topology changes can drop/requeue messages
- rollback target Revision may have been garbage-collected

## Incident Report Shape

Use this output for debugging:

1. `Likely owner`
2. `Why this fits`
3. `Do not do yet`
4. `Read-only probes`
5. `Expected observations`
6. `Decision point after probes`
7. `Risk if wrong`
8. `Rollback / stop condition`
