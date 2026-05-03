# Evidence Base, Version Caveats, and Source Map

Use this to check source quality and version-sensitive claims. Do not cite local source files or private research paths in public output.

## Source Hierarchy

Prefer in this order:

1. Installed cluster evidence: CRDs, CSVs, operator CRs, `kn version`, `oc explain`, controller logs, resource status.
2. Red Hat versioned OpenShift Serverless docs/release notes for OCP production behavior.
3. Official Knative versioned docs and upstream release notes/source.
4. Harbor official docs for registry/auth/signing behavior.
5. CloudEvents specification for event envelope semantics.
6. RabbitMQ official/operator docs for broker/topology behavior.
7. Practitioner posts and issue trackers only as incident heuristics, labelled as such.

## Current Research Corrections

As of the targeted 2026-05-03 research pass:

- OpenShift Serverless 1.37 is the current visible Red Hat documentation line, mapping to Knative 1.17 core components.
- OpenShift Serverless 1.36 maps to Knative 1.16 core components.
- Older local claims that 1.35 was latest are stale.
- Upstream Knative 1.21 is current active upstream; v1.22 was not confirmed released.
- `eventing-rabbitmq` latest confirmed release was v1.21.0; local claims of GA v1.22 should be treated as incorrect unless new release evidence is found.
- `RabbitmqSource` remains `sources.knative.dev/v1alpha1`; `RabbitmqBrokerConfig` remains `eventing.knative.dev/v1alpha1`.
- Core `Serving/Eventing v1alpha1` APIs were removed in recent OpenShift Serverless releases; use `serving.knative.dev/v1` and `eventing.knative.dev/v1` for Service/Broker/Trigger.
- RabbitMQ Eventing is not Red Hat-supported in the OpenShift Serverless docs checked; supported messaging path is Knative for Apache Kafka with AMQ Streams.

## Primary Sources to Prefer

- Knative docs: https://knative.dev/docs/
- Knative Serving: https://knative.dev/docs/serving/
- Knative Serving autoscaling: https://knative.dev/docs/serving/autoscaling/
- Knative traffic management: https://knative.dev/docs/serving/traffic-management/
- Knative Eventing: https://knative.dev/docs/eventing/
- Knative event delivery: https://knative.dev/docs/eventing/event-delivery/
- RabbitMQSource docs: https://knative.dev/docs/eventing/sources/rabbitmq-source/
- RabbitMQ Broker docs: https://knative.dev/development/eventing/brokers/broker-types/rabbitmq-broker/
- eventing-rabbitmq source: https://github.com/knative-extensions/eventing-rabbitmq
- Knative Functions source/docs: https://github.com/knative/func
- OpenShift Serverless docs: https://docs.redhat.com/en/documentation/red_hat_openshift_serverless/
- OpenShift Serverless 1.37 release notes: https://docs.redhat.com/en/documentation/red_hat_openshift_serverless/1.37/html/about_openshift_serverless/serverless-release-notes
- OpenShift Serverless 1.36 release notes: https://docs.redhat.com/en/documentation/red_hat_openshift_serverless/1.36/html/about_openshift_serverless/serverless-release-notes
- Harbor docs: https://goharbor.io/docs/
- Kubernetes private registry pull secrets: https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/
- CloudEvents: https://cloudevents.io/

## Evidence Caveats

- OpenShift Serverless version support is tied to OCP minor, operator channel, and Red Hat's supported configuration matrix. Re-check before production.
- Upstream Knative API availability can differ from OpenShift Serverless productized behavior.
- RabbitMQ extension support on OpenShift is a support-contract decision, not just a technical one.
- Examples with `v1alpha1` may be correct for extensions but wrong for core Eventing APIs.
- Cold-start and throughput numbers are environment-specific; measure with real images, real registry path, real node cache state, real ingress/mesh, and real downstreams.
- Harbor signing/admission behavior depends on selected controller and OCP/RHACS/Sigstore support status.
- Service Mesh + Knative compatibility is version-sensitive and should be lab-tested.

## Public-Safety Rule

When improving or redistributing this skill:

- use public official/upstream source URLs
- use placeholders such as `harbor.example.com`, `orders`, `workloads`, `idp.example.com`
- do not reference local file paths, private repositories, customer names, internal hostnames, credentials, tokens, or raw incident artifacts
- do not copy private source material verbatim when a public-source-backed distilled rule is enough

## Coverage Map

| Topic | Reference |
|---|---|
| Boundaries, Lambda comparison, mental models | `mental-models.md` |
| Serving, Revisions, Routes, autoscaling, cold starts | `serving-autoscaling.md` |
| Eventing, RabbitMQ, Kafka, DLQ, retry | `eventing-rabbitmq.md` |
| Lambda migration and adapters | `lambda-migration.md` |
| OpenShift Serverless, Harbor, air gap, signing, Service Mesh | `openshift-serverless-harbor.md` |
| Incidents and debug probes | `debugging-incidents.md` |
| Production operations and reviews | `production-ops.md` |
| Labs and ramp-up | `learning-roadmap.md` |
