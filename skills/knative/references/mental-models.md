# Mental Models and Boundaries

Use this for learning, architecture translation, Lambda comparisons, and spotting shallow Knative understanding.

## Executive Thesis

Knative is Kubernetes-native serverless containers. It adds request-driven autoscaling, scale-to-zero, immutable Revisions, traffic splitting, and CloudEvents routing on top of a normal Kubernetes/OpenShift cluster.

It is not AWS Lambda on Kubernetes. Lambda is a managed function execution service. Knative is a set of controllers, CRDs, sidecars, and data-plane components you operate. The business value is Lambda-like ergonomics while keeping containers, Kubernetes policy, OpenShift integration, Harbor/OCI registries, and platform ownership.

## What Knative Owns

- **Serving**: HTTP/gRPC request-driven containers, Revisions, Route traffic splits, KPA scale-to-zero, queue-proxy, activator.
- **Eventing**: CloudEvents routing through Source/Sink, Broker/Trigger, delivery retry, dead-letter sinks.
- **Functions (`kn func`)**: developer workflow to scaffold, build, push, and deploy a container as a Knative Service.
- **OpenShift Serverless**: Red Hat operator-packaged Knative with OCP integrations, Kourier/Routes, operator channels, and support boundaries.

## What Knative Is Not

- Not a Lambda-compatible runtime or function sandbox.
- Not a replacement for Kubernetes, ingress, CNI, RBAC, storage, registry, or observability.
- Not a service mesh; queue-proxy and activator do not provide full mTLS/policy/circuit-breaking.
- Not a workflow engine; use SonataFlow/OpenShift Serverless Logic, Tekton, or Argo for workflows.
- Not durable event storage; durability comes from Kafka, RabbitMQ, or another substrate.
- Not the right home for databases, brokers, long-running stateful services, strict ordinal identity, or sub-millisecond latency paths.

## The Shape to Memorize

```text
Knative Service
├─ Configuration
├─ Route
└─ Revision(s) [immutable]
   └─ Deployment / ReplicaSet / Pod
      ├─ queue-proxy sidecar
      └─ user container
```

Cold path:

```text
Ingress/Kourier/Route
  -> SKS Proxy mode
  -> Activator buffers
  -> Autoscaler computes desired replicas
  -> Deployment scales
  -> Pod pulls image and becomes Ready
  -> queue-proxy forwards to user container
  -> SKS flips to Serve mode when capacity is enough
```

Event path:

```text
External source (RabbitMQ/Kafka/webhook)
  -> Source adapter
  -> CloudEvent HTTP POST
  -> optional Broker
  -> Trigger filter
  -> Sink / Knative Service
  -> optional retry and deadLetterSink
```

## Lambda Unlearning Checklist

| AWS Lambda concept | Knative/OpenShift equivalent | Shift |
|---|---|---|
| Function package | OCI image in registry | You ship and own a full container. |
| Handler callback | HTTP/CloudEvents server | Your process listens on `$PORT`. |
| One execution per sandbox | `containerConcurrency: 1` if needed | Single-flight is opt-in. |
| Reserved/provisioned concurrency | `min-scale` + `max-scale` | Warm capacity is pods, not a hidden pool. |
| Versions/aliases | Revisions/Route traffic | Rollback by traffic split, not redeploy. |
| SQS event source mapping | Source adapter, often RabbitMQSource/KafkaSource | Polling bridge is your in-cluster component. |
| DLQ | `delivery.deadLetterSink` | DLQ is an HTTP CloudEvent sink; it needs ownership and replay. |
| CloudWatch/X-Ray | OpenShift Logging/Prometheus/OTel/Tempo | Observability is platform-owned. |
| IAM execution role | ServiceAccount/RBAC/Vault/ESO | Identity model changes. |

## Core Invariants

1. **Revisions are immutable.** Pod template changes create new Revisions. Do not mutate old Revisions or Knative-owned Deployments for normal operations.
2. **Routes decide live traffic.** Rollouts, canaries, tags, and rollback are Route concerns.
3. **Concurrency drives KPA.** Autoscaler observes in-flight concurrency from queue-proxy and activator, not simply request count or CPU.
4. **Scale-to-zero is a whole data-path state.** `min-scale: 0`, zero observed concurrency, stable window/grace periods, SKS Proxy mode, and healthy activator must align.
5. **CloudEvents is the Eventing protocol.** Sources convert external systems to CloudEvents; sinks receive HTTP POSTs.
6. **Images resolve to digests at Revision creation.** Mutable tags affect future Revisions, not already-created Revisions.
7. **At-least-once is normal.** Queue retries, source retries, broker retries, and sink 5xx can duplicate side effects. Application idempotency is mandatory.

## Senior Heuristics

- Set `containerConcurrency` to real app capacity, not the default because it exists.
- Use `containerConcurrency: 1` for strict Lambda parity or non-thread-safe migrated code.
- Set `max-scale` explicitly in shared clusters.
- Use `min-scale: 1` for customer-facing or latency-sensitive paths; use `min-scale: 0` for idle admin tools, dev, long-tail webhooks, and best-effort jobs.
- Prefer direct Source-to-Sink for one queue -> one service.
- Add Broker/Trigger when you need fanout, filtering, governance, auditability, or an event mesh.
- Treat DLQ as an incident queue, not a trash can.
- Keep adapter logic separate from domain logic during Lambda migration.
- Draw request and event paths before tuning.

## Decision: Knative vs Alternatives

Use Knative when:

- workload is request-driven HTTP/gRPC or CloudEvents-driven
- scale-to-zero, traffic splitting, immutable revisions, or function-style ergonomics matter
- the team accepts Kubernetes/OpenShift platform ownership
- standard containers, Harbor/OCI, and cluster policy are desired

Prefer plain Deployment + HPA when:

- traffic is steady and scale-to-zero is irrelevant
- simple rollout and standard Kubernetes semantics are enough

Prefer KEDA + Deployment when:

- the workload is pull/backlog-driven and HTTP/Eventing abstractions add little
- queue depth, not in-flight HTTP concurrency, is the primary scaling signal

Prefer Kafka/AMQ Streams path on OpenShift when:

- Red Hat-supported messaging is required end-to-end
- replay, partitioning, and event-stream durability matter more than RabbitMQ queue semantics

Prefer not migrating from Lambda when:

- AWS-managed operational simplicity and native integrations are more valuable than on-prem placement

## Shallow Understanding Checks

| Question | Strong answer should include |
|---|---|
| Is Knative Lambda on Kubernetes? | No: containers, pod concurrency, operator-owned platform, cluster capacity, different failure model. |
| What scales a Service? | KPA/PodAutoscaler using queue-proxy and activator concurrency metrics, stable/panic windows, writing Deployment replicas; SKS toggles Proxy/Serve. |
| Where does activator sit? | Conditionally on path: scale-from-zero or insufficient burst capacity; off path in normal warm steady state. |
| How do I roll back? | Edit Route traffic to previous Ready Revision; avoid rebuild unless artifact itself is missing. |
| Why no events from RabbitMQ? | Check RabbitMQ queue/acks, Source conditions/logs, Broker/Trigger filters, sink status, network policy, DLQ, response codes. |
| Why duplicates? | At-least-once across queue, source, broker, sink, and retry paths; idempotency is domain-level. |
| What does Harbor store? | OCI images/artifacts/signatures, not the container runtime. Nodes pull with CRI-O/kubelet using pull secrets and CA trust. |

## Common Traps

- Saying “function” and forgetting it is a long-running server process.
- Raising `containerConcurrency` to hide slow requests.
- Setting all Services to `min-scale: 0` because “serverless”.
- Redeploying old images for rollback instead of changing Route traffic.
- Assuming RabbitMQ Eventing is Red Hat-supported on OpenShift.
- Treating DLQ arrival as success.
- Using mutable `latest` tags in production manifests.
- Ignoring OpenShift SCC, Routes, Service Mesh, and image-signing admission differences between dev and prod.
