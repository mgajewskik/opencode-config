---
name: knative
description: Senior-level Knative and OpenShift Serverless guidance for Serving, Eventing, Functions, autoscaling, scale-to-zero, CloudEvents, RabbitMQ/Kafka sources, Lambda migration, Harbor/OCI images, debugging, operations, and production rollout. Use when working with Knative Service, Revision, Route, KPA, activator, queue-proxy, Broker, Trigger, Source, Sink, kn func, OpenShift Serverless, Kourier, eventing-rabbitmq, Knative Kafka, or serverless workloads on Kubernetes/OpenShift.
license: Apache-2.0
metadata:
  version: "0.1"
---

# Knative / OpenShift Serverless

Production-first Knative guidance for experienced Kubernetes/OpenShift operators. Optimize for mechanism-level diagnosis, safe rollout, workload fit, support boundaries, and minimal moving parts. Skip generic Kubernetes tutorials unless the user asks.

This skill distills the bundled Knative source corpus into progressive references. Load only the nearest reference for the task.

## Start Here

Classify the request first, then read the smallest useful reference.

- Core thesis, Lambda-to-Knative unlearning, boundaries, mental models, shallow-understanding checks -> read [references/mental-models.md](references/mental-models.md)
- Serving object model, Service/Configuration/Revision/Route, queue-proxy, activator, KPA, traffic split, scale-to-zero -> read [references/serving-autoscaling.md](references/serving-autoscaling.md)
- Eventing, CloudEvents, Source/Sink, Broker/Trigger, RabbitMQSource, RabbitMQ Broker, Kafka alternative, DLQ/retry/idempotency -> read [references/eventing-rabbitmq.md](references/eventing-rabbitmq.md)
- Lambda migration patterns, handler adapters, concurrency mapping, rollout and rollback gates -> read [references/lambda-migration.md](references/lambda-migration.md)
- OpenShift Serverless operator, version skew, air-gapped install, Harbor pull secrets, Cosign/admission, `kn func`, Service Mesh -> read [references/openshift-serverless-harbor.md](references/openshift-serverless-harbor.md)
- Incidents, Revision failures, scale-from-zero 503s, stuck SKS Proxy mode, activator overload, image pulls, Eventing/RabbitMQ delivery failures -> read [references/debugging-incidents.md](references/debugging-incidents.md)
- Production platform contract, tuning, multi-team operations, observability, GC, quotas, anti-patterns, review checklist -> read [references/production-ops.md](references/production-ops.md)
- Evidence base, version caveats, public source map, contradiction notes -> read [references/source-map.md](references/source-map.md)

## Use This Skill For

- designing, deploying, reviewing, or debugging Knative Serving workloads
- migrating AWS Lambda-style handlers to HTTP or CloudEvents containers
- wiring RabbitMQ/Kafka events into Knative Services
- choosing direct Source-to-Sink vs Broker/Trigger vs KEDA/plain Deployment
- tuning `containerConcurrency`, `min-scale`, `max-scale`, KPA, activator, and cold-start behavior
- operating OpenShift Serverless with Harbor, private registries, image signing, Routes, and optional Service Mesh
- building runbooks for Revision readiness, activator overload, stuck SKS mode, queue backlog, retry storms, and DLQ handling

## Do Not Use This Skill For

- generic Kubernetes workload advice when Knative-specific behavior does not matter
- pretending Knative is a drop-in Lambda clone
- stateful databases, brokers, or strict ordinal workloads behind Knative Serving
- blind live-cluster mutation, operator install, or air-gap mirroring without preflight and approval
- Red Hat support/legal conclusions beyond clearly labelled support-boundary caveats
- exposing local paths, real customer names, internal domains, credentials, tokens, pull secrets, or private topology

## Default Operating Stance

- Start by identifying the shape: Serving, Eventing, Functions, OpenShift Serverless platform, registry/supply chain, or migration design.
- Treat versions as material. Ask for or inspect Knative/OpenShift Serverless channel, OCP minor, installed CRDs, `kn` version, and extension/operator versions when relevant.
- Prefer OpenShift Serverless Operator-managed installs on OpenShift. Do not mix upstream raw YAML with productized operator ownership.
- Prefer read-only probes before changing Service traffic, autoscaling config, Eventing delivery, operator CRs, registry trust, or Service Mesh membership.
- For risky changes, include preflight, blast radius, rollback/restore path, validation, and stop condition.
- Keep RabbitMQ support caveat visible: upstream `eventing-rabbitmq` can be useful, but it is community-supported on OpenShift; Red Hat-supported Eventing messaging is Knative for Apache Kafka with AMQ Streams.
- Prefer direct Source-to-Sink for one queue -> one consumer; add Broker/Trigger only for fanout, filtering, governance, or event mesh needs.

## Core Mental Models

1. **Knative is Kubernetes-native serverless containers, not Lambda.** You own the image, runtime, cluster capacity, ingress, Eventing data plane, registry trust, observability, and retries.
2. **Serving = Deployment + autoscaler + Route + queue-proxy.** Debug by finding which layer is lying: Revision, Deployment/Pod, queue-proxy, activator, KPA, SKS, ingress.
3. **Revisions are immutable; Routes carry traffic.** Rollback should normally be a Route traffic change, not a rebuild or redeploy.
4. **Concurrency is the scaling signal.** `containerConcurrency`, target, utilization, min/max scale, and source parallelism form one capacity envelope.
5. **Scale-to-zero spends latency.** Cold start is image pull + scheduler + app init + probes + queue-proxy/activator + ingress path. Use `min-scale` as a business decision.
6. **Eventing is HTTP CloudEvents routing, not durable storage.** Durability comes from RabbitMQ/Kafka or the source substrate; idempotency stays in the application.
7. **OpenShift Serverless is productized Knative with support boundaries.** Version skew, Routes/Kourier, SCC, Service Mesh, RHACS, and Operator channels matter.

## Interview Triggers

Ask focused questions before final guidance when any are true:

- the request mutates production traffic, autoscaling, Eventing delivery, operator CRs, Service Mesh, registry trust, or air-gap catalogs
- the answer depends on OpenShift Serverless/Knative version, RabbitMQ extension availability, OCP minor, or support contract
- the user asks for best practices without workload shape, traffic profile, latency target, event source, or downstream capacity
- queue processing, retries, DLQ, duplicate side effects, or source parallelism are involved
- the task may expose private registry, internal DNS, credentials, or customer-specific topology

High-value questions:

1. Upstream Knative or OpenShift Serverless? Which version/channel and OCP minor?
2. Serving, Eventing, Functions, or migration design? HTTP/gRPC request-driven, queue-driven, or workflow/batch?
3. What event substrate: RabbitMQ, Kafka/AMQ Streams, HTTP webhooks, or custom source?
4. Is RabbitMQ support contractually acceptable, or must this stay Red Hat-supported end-to-end?
5. What are p95/p99 latency targets, cold-start tolerance, peak concurrency, and downstream limits?
6. What is the rollback path: Route traffic split, source pause, DLQ replay, or image rollback?

## Mode Router

Choose one primary mode and at most one secondary mode.

| Mode | Use when | Load |
|---|---|---|
| `model` | learning, architecture, Lambda comparison, shallow-understanding checks | `references/mental-models.md` |
| `serving` | Knative Service, Revision, Route, traffic splits, rollbacks, private/internal Services | `references/serving-autoscaling.md` |
| `autoscale` | KPA, scale-to-zero, activator, queue-proxy, cold start, concurrency tuning | `references/serving-autoscaling.md` |
| `eventing` | CloudEvents, Source/Sink, Broker/Trigger, delivery, filters, DLQ | `references/eventing-rabbitmq.md` |
| `rabbitmq` | RabbitMQSource, RabbitMQ Broker, queue mapping, fanout, support caveat | `references/eventing-rabbitmq.md` |
| `migration` | AWS Lambda/SQS/EventBridge/API Gateway migration to Knative | `references/lambda-migration.md` |
| `openshift` | OpenShift Serverless operator, Kourier/Routes, SCC, OCP-specific behavior | `references/openshift-serverless-harbor.md` |
| `registry` | Harbor, private pull secrets, image digests, Cosign, admission, air-gap mirroring | `references/openshift-serverless-harbor.md` |
| `debug` | incidents, 503s, Revision not ready, stuck Proxy mode, queue backlog, DLQ | `references/debugging-incidents.md` |
| `ops` | production platform contract, multi-team operations, observability, quotas, GC | `references/production-ops.md` |
| `roadmap` | structured learning, labs, competency checks | `references/learning-roadmap.md` |

Common combinations:

- `debug` + suspected subsystem (`serving`, `autoscale`, `eventing`, `registry`, `openshift`)
- `migration` + `rabbitmq` for Lambda/SQS-like queue processors
- `openshift` + `registry` for Harbor/air-gapped OpenShift Serverless
- `eventing` + `ops` for retry/DLQ/replay/platform contract reviews

## Core Workflow

1. Identify mode, target platform/version, workload shape, support boundary, and blast radius.
2. Load the nearest reference only.
3. Draw the path before tuning: request path for Serving, event path for Eventing.
4. Gather read-only evidence before mutation.
5. Recommend the smallest supported change at the right owner: Service template, Route traffic, Source/Broker/Trigger delivery, Operator CR, registry policy, or app code.
6. Include validation: conditions, events, logs, metrics, traffic split result, DLQ observation, or source link.
7. Separate official/version-sensitive facts, practitioner heuristics, and local assumptions.

## Output Contract

Default response shape:

1. `Verdict` - likely layer or recommended path
2. `Why` - mechanism-level Knative/OpenShift reason
3. `Smallest safe path` - probes first, then minimal change if warranted
4. `Risks / edge cases` - version, support, security, data, latency, retry, and downstream caveats
5. `Validation` - exact observations that prove convergence
6. `Rollback / next step` - Route/source/DLQ/config revert or next probe

Mode-specific additions:

- `debug`: add `Likely owner`, `Read-only probes`, `Do not do yet`, `Stop condition`
- `migration`: add `Mapping`, `Non-equivalences`, `Idempotency gate`, `Cutover/rollback`
- `rabbitmq`: add `Support boundary`, `Ack/retry/DLQ semantics`, `Backpressure envelope`
- `review`: use `Verdict`, `Blockers`, `Risks`, `Evidence`, `Suggested fixes`, `Smallest next step`

## Guardrails

- Do not call Knative a drop-in Lambda replacement.
- Do not put databases, RabbitMQ/Kafka brokers, or stateful ordinal workloads behind Knative Serving.
- Do not recommend editing Knative-owned Deployments/ReplicaSets directly; change the Knative Service, Route, Source, Broker, Trigger, or operator CR.
- Do not stack HPA on a KPA-managed Knative Service unless deliberately switching autoscaling class with version-checked docs.
- Do not normalize `containerConcurrency: 0`, unlimited scale, or `min-scale: 0` for latency-sensitive production paths.
- Do not recommend RabbitMQ Eventing on OpenShift as Red Hat-supported; label it community-supported unless current docs prove otherwise.
- Do not deploy upstream manifests into OpenShift Serverless operator-managed clusters without an explicit unsupported/break-glass frame.
- Do not treat DLQ as solved recovery; require ownership, alerting, replay, and idempotency.
- Do not expose private registry hosts, robot tokens, pull-secret contents, internal domains, customer names, or real topology.

## Success Criteria

Pass when all are true:

- advice is Knative-specific and version/support aware
- Serving, Eventing, Functions, OpenShift Serverless, and registry concerns are not conflated
- request/event path is identified before tuning or debugging
- read-only evidence precedes mutation
- risky operations include preflight, approval, rollback/restore, post-checks, and stop conditions
- RabbitMQ, Kafka, KEDA, and plain Deployment alternatives are chosen by workload shape, not fashion
- public outputs use generic placeholders and avoid local/customer-specific source references

Fail when any are true:

- answer is generic Kubernetes advice that ignores queue-proxy, activator, KPA, Revision, Route, Source/Broker/Trigger, or OpenShift Serverless ownership
- command-first response mutates traffic, operators, registry trust, Service Mesh, or Eventing delivery before diagnosis
- support boundaries are hidden or overclaimed
- retries/DLQ are discussed without idempotency and duplicate side-effect handling
- scale-to-zero is treated as universally good
- examples leak private names, internal hosts, credentials, tokens, or local paths

## Failure Modes

| Scenario | Detection | Fallback |
|---|---|---|
| Version unclear | No Knative/OCP Serverless channel or CRD evidence | Ask for `kn version`, `oc get csv -A | grep serverless`, `oc get crd '*knative*'`, or operator release notes |
| Vague incident | Only symptom provided | Start with `ksvc/configuration/revision/route/sks/podautoscaler`, pods/events/logs, then activator/autoscaler/source logs |
| RabbitMQ support uncertain | User wants production OpenShift RabbitMQ Eventing | Flag community support, verify installed CRDs/operator, compare Kafka/AMQ Streams supported path |
| Risky mutation requested | Traffic flip, source pause, operator change, registry/CA/admission, mesh membership | Require preflight, approval, rollback/restore, validation, and stop condition |
| Public artifact requested | Examples could expose local context | Use `example.com`, `harbor.example.com`, generic namespaces, placeholder tokens, and public source URLs only |
| External docs needed | Local source/version evidence is insufficient | Prefer official Knative, Red Hat versioned docs, upstream releases/source, Harbor docs; label uncertainty |

### When in doubt

- Draw the path.
- Read conditions before logs; read logs before changing config.
- Prefer one queue -> one Source -> one Service before adding a Broker.
- Prefer Route rollback over redeploy.
- Prefer `min-scale: 1` over heroic cold-start tuning for customer-facing paths.
- Prefer public-safe placeholders over realistic internal names.
