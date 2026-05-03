# Eventing, RabbitMQ, Kafka, Retry, and DLQ

Use this for CloudEvents, Source/Sink, Broker/Trigger, RabbitMQSource, RabbitMQ Broker, Knative Kafka alternatives, delivery semantics, idempotency, and queue-driven workloads.

## Eventing Model

```text
Producer -> Source -> Sink
Producer -> Broker -> Trigger -> Subscriber
External system -> Source adapter -> CloudEvent HTTP POST -> Knative Service
```

Terms:

- **Source**: converts external events into CloudEvents and sends them to a sink.
- **Sink**: HTTP receiver for CloudEvents; can be a Knative Service, Broker, K8s Service, URI, or another addressable resource.
- **Broker**: decoupling/fanout layer; receives CloudEvents and exposes a Broker URL.
- **Trigger**: filters Broker events by CloudEvent attributes and dispatches to subscribers.
- **DeliverySpec**: retry, backoff, timeout, and dead-letter sink behavior.

## Direct vs Brokered Decision

| Pattern | Use when | Avoid when |
|---|---|---|
| `RabbitmqSource -> Service` | one queue, one consumer; Lambda/SQS-style migration; easiest debugging | multiple consumers, governance/fanout/filtering needed |
| `RabbitmqSource -> Broker -> Trigger -> Services` | fanout, CloudEvent filtering, event mesh conventions | one consumer and no near-term fanout |
| `KafkaSource/KafkaBroker` | Red Hat-supported OpenShift Eventing path, high-throughput streams, replay/partitioning | existing RabbitMQ queue semantics are hard constraints |
| KEDA + Deployment | backlog-driven pull worker; no need for CloudEvents/HTTP | you need Revisions, Route splits, CloudEvents routing |
| Camel-K / custom source | protocol transformation, AMQP 1.0, unsupported integration | a maintained Source already exists |

## Red Hat Support Boundary

- Upstream `eventing-rabbitmq` components may be GA in the upstream project sense, but RabbitMQ Eventing is **community-supported on OpenShift** unless current Red Hat docs say otherwise.
- Red Hat-supported OpenShift Serverless Eventing messaging is Knative for Apache Kafka backed by AMQ Streams.
- `RabbitmqSource` remains `sources.knative.dev/v1alpha1` even when behavior is described as GA.
- `RabbitmqBrokerConfig` remains `eventing.knative.dev/v1alpha1`; the `Broker` itself is `eventing.knative.dev/v1`.
- Core Eventing `v1alpha1` APIs were removed in recent OpenShift Serverless releases; do not use old `Broker`/`Trigger` examples with core `v1alpha1`.

## RabbitMQSource Template

This is a production-shaped template with placeholders. Verify CRDs in the target cluster first. The DLQ sink must durably record the event before returning 2xx; `event-display` is lab-only and is intentionally not used here.

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: orders-dlq-sink
  namespace: orders
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/min-scale: "1"
        autoscaling.knative.dev/max-scale: "3"
    spec:
      containerConcurrency: 10
      containers:
        - image: harbor.example.com/platform/dlq-recorder@sha256:REPLACE_ME
          env:
            - name: DLQ_STORE
              value: durable-store-placeholder
---
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: order-processor
  namespace: orders
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/min-scale: "1"
        autoscaling.knative.dev/max-scale: "20"
        autoscaling.knative.dev/target: "10"
    spec:
      serviceAccountName: order-processor-sa
      containerConcurrency: 10
      timeoutSeconds: 60
      containers:
        - image: harbor.example.com/orders/processor@sha256:REPLACE_ME
          ports: [{ containerPort: 8080 }]
---
apiVersion: sources.knative.dev/v1alpha1
kind: RabbitmqSource
metadata:
  name: orders-created-source
  namespace: orders
spec:
  rabbitmqClusterReference:
    connectionSecret:
      name: rabbit-credentials
  rabbitmqResourcesConfig:
    predeclared: true
    parallelism: 20
    exchangeName: "orders"
    queueName: "orders.created"
  delivery:
    retry: 5
    backoffPolicy: "exponential"
    backoffDelay: "PT1S"
    deadLetterSink:
      ref:
        apiVersion: serving.knative.dev/v1
        kind: Service
        name: orders-dlq-sink
  sink:
    ref:
      apiVersion: serving.knative.dev/v1
      kind: Service
      name: order-processor
```

Notes:

- `rabbitmqClusterReference.name` and `connectionSecret` are mutually exclusive.
- `predeclared: true` is production-friendly when ops owns queues/exchanges/bindings outside the Source.
- `parallelism` maps to AMQP prefetch/worker concurrency in practice; tune with sink concurrency and pod count.
- RabbitMQ integration may require cert-manager, RabbitMQ Cluster Operator, and RabbitMQ Messaging Topology Operator depending on topology and `predeclared` usage.

## RabbitMQ Broker + Trigger Template

```yaml
apiVersion: eventing.knative.dev/v1alpha1
kind: RabbitmqBrokerConfig
metadata:
  name: orders-broker-config
  namespace: orders
spec:
  rabbitmqClusterReference:
    connectionSecret:
      name: rabbit-credentials
  queueType: quorum
---
apiVersion: eventing.knative.dev/v1
kind: Broker
metadata:
  name: orders-broker
  namespace: orders
  annotations:
    eventing.knative.dev/broker.class: RabbitMQBroker
spec:
  config:
    apiVersion: eventing.knative.dev/v1alpha1
    kind: RabbitmqBrokerConfig
    name: orders-broker-config
  delivery:
    retry: 5
    backoffPolicy: "exponential"
    backoffDelay: "PT1S"
    deadLetterSink:
      ref:
        apiVersion: serving.knative.dev/v1
        kind: Service
        name: orders-dlq-sink
---
apiVersion: eventing.knative.dev/v1
kind: Trigger
metadata:
  name: orders-created-trigger
  namespace: orders
  annotations:
    rabbitmq.eventing.knative.dev/parallelism: "10"
spec:
  broker: orders-broker
  filter:
    attributes:
      type: com.example.orders.created.v1
  subscriber:
    ref:
      apiVersion: serving.knative.dev/v1
      kind: Service
      name: order-processor
```

## Delivery Semantics

Delivery is at-least-once.

Typical behavior:

1. Source receives/consumes from external substrate.
2. Source or Broker POSTs CloudEvent to sink.
3. Sink returns 2xx -> delivery success/ack.
4. Sink non-2xx, timeout, or unreachable -> retry/backoff.
5. Retries exhausted -> POST original event to `deadLetterSink`.
6. DLQ POST success -> source/broker can ack upstream.
7. DLQ POST fails -> message can be requeued/loop, depending on implementation.

Always assume duplicates. Idempotency patterns:

- stable domain ID, message ID, or CloudEvent `id` as dedupe key
- unique constraints or conditional writes for side effects
- TTL dedupe store covering retry window and replay horizon
- non-2xx only when the entire operation should be retried
- safe partial-success handling before returning 500

## DLQ Rules

- DLQ is a CloudEvents sink, not necessarily a queue.
- Make the DLQ sink boring and highly available; it should not call the same broken dependency.
- Capture `ce-id`, `ce-source`, `ce-type`, original payload, failure destination, error code, and timestamp.
- Alert on DLQ volume and age.
- Define replay owner, replay command/process, dedupe behavior, and poison-message quarantine.
- Consider a broker-side DLX/queue as a second safety net when RabbitMQ policy allows it.

## CloudEvents Debugging

Before writing filters, observe actual events.

```bash
oc -n <ns> get broker,trigger,source
oc -n <ns> get rabbitmqsource <name> -o yaml
oc -n <ns> logs deploy/<event-display-or-sink> --tail=200
```

Check attributes:

- `id`
- `source`
- `type`
- `subject`
- `time`
- `datacontenttype`
- extension attributes from RabbitMQ headers or delivery errors

## RabbitMQ Scale and Backpressure

Tune together:

```text
RabbitMQ prefetch/source parallelism
  <= sink pod count * containerConcurrency
  <= downstream safe concurrency
  <= namespace/resource quota capacity
```

Too low:

- sink underused
- queue depth grows despite healthy pods

Too high:

- one slow sink hoards unacked messages
- head-of-line blocking
- downstream overload
- retry storms amplify backlog

Prefer a conservative `max-scale`, explicit source `parallelism`, and downstream bulkheads over unbounded burst.

## Failure Signatures

| Symptom | Likely cause | First probes |
|---|---|---|
| Source Ready=False | RabbitMQ credentials, DNS/network, missing operator/CRD, topology issue | source conditions, source adapter logs, RabbitMQ connections |
| Queue depth grows, pods healthy | parallelism too low, sink 5xx, filters mismatch, broker bottleneck | RabbitMQ ack rate, source logs, Broker/Trigger status, sink response codes |
| No events reach sink | wrong sink ref, Trigger filter mismatch, Broker name/namespace, NetworkPolicy | event-display capture, Trigger status, Broker address |
| Retry storm | sink returns non-2xx after partial side effect, no idempotency | sink logs, DLQ, source/broker delivery metrics |
| Poison message loop | DLQ missing or DLQ sink fails | DLQ sink logs/status, delivery config, RabbitMQ requeue count |
| Duplicate side effects | at-least-once not handled | idempotency key/path, database uniqueness, external API calls |

## Kafka Alternative on OpenShift

Use Knative for Apache Kafka with AMQ Streams when:

- supportability matters more than RabbitMQ compatibility
- event replay, partition ordering, and durable streams are needed
- Red Hat support contract must cover the Eventing substrate

Be precise: Kafka is not a drop-in RabbitMQ replacement. It changes event retention, consumer group semantics, ordering, backpressure, operational skills, and migration cost.
