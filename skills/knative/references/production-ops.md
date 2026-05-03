# Production Operations, Tuning, and Review

Use this for production design, platform contracts, multi-team operations, observability, scaling, revision retention, quotas, and review checklists.

## Production Platform Contract

Define these before onboarding teams:

- supported OpenShift Serverless channel and upgrade cadence
- allowed event substrates: Kafka/AMQ Streams, RabbitMQ community extension, HTTP webhooks, custom sources
- namespace template: quotas, limit ranges, NetworkPolicies, default ServiceAccounts, pull secrets
- image contract: Harbor project, robot accounts, digest deploys, signing, scanning, retention
- Service defaults: min/max scale, target, concurrency, timeout, resources, logging labels
- Eventing defaults: Broker policy, Source policy, retry, DLQ sink, replay owner
- observability: metrics, logs, tracing, dashboard names, alert thresholds
- rollback/cutover rules: Route split, source sink changes, DLQ replay, source pause process

## Golden Manifest Checklist

For each Knative Service:

- image by digest from trusted registry
- dedicated ServiceAccount with pull secret
- explicit `containerConcurrency`
- explicit `min-scale` and `max-scale`
- explicit timeout
- CPU/memory requests and memory limit
- readiness/startup probes aligned with app behavior
- labels for ownership and cost allocation
- structured logs with request/event correlation
- no broad SCC/RBAC grants without least-privilege reason

For each Source/Broker/Trigger:

- support boundary documented
- event schema and CloudEvent attributes known
- retry/backoff/deadLetterSink configured
- DLQ owner and replay policy documented
- source parallelism tuned with sink concurrency and downstream capacity
- duplicate event test exists
- network policy path verified

## Multi-Team Operations

Prefer:

- namespace-per-team or namespace-per-application boundary
- per-namespace Brokers for tenant isolation
- team-owned Services/Sources/Triggers in GitOps repos
- platform-owned operator CRs, Kourier, admission, catalog, registry policy
- explicit ResourceQuota and `max-scale` to prevent noisy-neighbor bursts
- per-team RabbitMQ vhosts or Kafka topics where using shared brokers

Avoid:

- one cluster-wide Broker for unrelated tenants
- all teams editing cluster-wide Knative configs
- mutable image tags as production identity
- manual `oc apply` outside GitOps for steady-state production
- shared pull credentials across teams

## Autoscaling Envelope

For HTTP/Eventing handlers:

```text
peak concurrency ~= peak RPS * avg_duration_seconds
desired pods ~= ceil(peak concurrency / per_pod_concurrency)
source parallelism <= desired pods * containerConcurrency
max-scale <= downstream safe concurrency / containerConcurrency
```

Tune as a system:

- `containerConcurrency`
- `autoscaling.knative.dev/target`
- `target-utilization-percentage`
- `min-scale`
- `max-scale`
- Source `parallelism` / Kafka partitions / RabbitMQ prefetch
- namespace quota and cluster capacity
- downstream database/API rate limits

## Cold Start Policy

Classify workloads:

| Workload | Default posture |
|---|---|
| login/payment/customer API | `min-scale: 1+`, measured p99, no casual scale-to-zero |
| internal admin tool | `min-scale: 0`, low max-scale, accept cold start |
| webhook long tail | `min-scale: 0` if sender tolerates latency/retry |
| queue processor during business hours | schedule or set `min-scale: 1` if backlog latency matters |
| dev/test | scale-to-zero aggressively |

Cold-start optimization order:

1. Business decision: warm pod or not.
2. Image size and startup profile.
3. Registry locality and node cache behavior.
4. Probe/startup tuning.
5. Activator/autoscaler tuning.

## Revision Retention and GC

Every deploy can leave Revisions, Deployments, ReplicaSets, PodAutoscalers, SKS, Services, and history. Set retention deliberately through supported Knative/OpenShift Serverless configuration.

Operational rules:

- retain enough old Revisions for rollback and audit
- cap non-active Revisions to avoid etcd bloat
- ensure rollback target exists before relying on Route rollback
- never delete Revisions during an incident unless you know traffic and rollback state

## Observability Signals

Serving:

- ksvc/Revision conditions
- desiredScale vs actualScale
- activator request/error/latency
- queue-proxy request concurrency and 5xx
- pod startup and image pull duration
- cold/warm latency split
- Route/Kourier ingress status

Eventing:

- Source Ready condition
- source adapter logs/errors
- Broker/Trigger conditions
- event delivery latency
- retry count and DLQ count
- RabbitMQ queue depth, unacked, consumers, ack rate
- Kafka lag/partition health where applicable

Registry/supply chain:

- Harbor pull latency/errors
- signature/admission rejections
- robot account expiration or scope drift
- catalog/mirror drift in disconnected clusters

## Anti-Patterns

- databases, brokers, or persistent state behind Knative Serving
- `min-scale: 0` everywhere
- `containerConcurrency: 0` in production by accident
- no `max-scale` on shared clusters
- HPA and KPA fighting over replicas
- Broker/Trigger for one queue -> one consumer with no fanout need
- DLQ sink that depends on the same broken downstream
- no event idempotency gate
- support-boundary blindness around RabbitMQ on OpenShift
- editing generated Deployments or Revisions
- Route rollback replaced by redeploying old image
- old `v1alpha1` core Eventing manifests copied from blogs
- Service Mesh injection enabled without activator/probe/mTLS rehearsal

## Review Checklist

Use this for architecture/code/config review.

`Verdict`: pass / pass with risks / block

Block if any are true:

- unsupported install path is presented as supported
- production image uses mutable tag without digest policy
- no explicit concurrency/max-scale on shared cluster
- retry/DLQ exists without idempotency and replay owner
- latency-sensitive workload uses scale-to-zero without acceptance
- Eventing path cannot be traced source -> broker/trigger -> sink -> DLQ
- rollback depends on rebuilding instead of retained Revision/Route where avoidable
- examples expose internal domains, credentials, local paths, or customer names

Risk-rank:

- **Critical**: data loss, duplicate financial/business side effects, unsupported cluster mutation, hidden support gap
- **High**: retry storm, downstream overload, unbounded scale, no rollback, registry/admission block
- **Medium**: cold-start SLO risk, observability gap, GC/etcd growth, source parallelism mismatch
- **Low**: ergonomic issue, docs drift, minor naming/labeling gap

## Production Readiness Gates

- load test proves concurrency and downstream safety
- duplicate event test passes
- DLQ test and replay drill pass
- cold and warm start measured
- Route rollback drill passes
- image pull from clean node works
- unsigned/unapproved image rejected where policy requires it
- alerting exists for Revision failures, source failures, DLQ, queue depth, activator errors
- owner map exists for app team vs platform team
