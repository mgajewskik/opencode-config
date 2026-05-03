# Lambda Migration Patterns

Use this for moving AWS Lambda-style workloads to Knative/OpenShift Serverless.

## Migration Thesis

Do not migrate “a Lambda function” directly. Migrate business logic into a containerized HTTP/CloudEvents service, then wire platform-specific triggers around it.

Smallest safe path:

1. Extract business logic from AWS event parsing.
2. Wrap it with an HTTP or CloudEvents adapter.
3. Build a small OCI image.
4. Push/sign the image in Harbor or another registry.
5. Deploy a Knative Service by digest.
6. Configure explicit concurrency, min/max scale, resources, timeout, readiness.
7. Wire one event source, preferably direct Source-to-Sink first.
8. Prove duplicate handling, retry/DLQ, cold/warm latency, and Route rollback.

## Concept Mapping

| AWS Lambda | Knative/OpenShift | Caveat |
|---|---|---|
| Function image/zip | OCI image in Harbor | You own runtime and base-image patching. |
| Handler | HTTP/CloudEvents endpoint | Must listen on `$PORT`; no implicit Lambda runtime. |
| Event source mapping | Source adapter or Broker/Trigger | Component is in your cluster. |
| SQS queue trigger | RabbitMQSource/KafkaSource or KEDA | RabbitMQ on OCP support caveat. |
| Reserved concurrency | `max-scale`, quotas, downstream limits | Not identical; pod concurrency also matters. |
| Provisioned concurrency | `min-scale` | Warm pods consume cluster resources. |
| Timeout | `timeoutSeconds` | No Lambda 15-minute hard ceiling unless configured. |
| Versions | Revisions | Revisions include image + pod template config. |
| Aliases | Route tags/traffic splits | Rollback by traffic, not rebuild. |
| DLQ/destinations | `delivery.deadLetterSink` | DLQ is HTTP sink; replay policy is yours. |
| IAM role | ServiceAccount/RBAC/Vault/ESO | Identity and secret model changes. |

## Adapter Shape

Keep domain logic pure:

```text
HTTP/CloudEvents adapter
  -> parse CloudEvent or request body
  -> validate idempotency key
  -> call business logic
  -> commit side effects atomically
  -> return 2xx only after success
```

Rules:

- Return 2xx only when the event can be acknowledged.
- If side effect succeeded but response failed, retry can duplicate. Design for that.
- Use stable producer IDs or domain IDs for dedupe; generated delivery IDs may not survive retries/replays usefully.
- Preserve Lambda-era assumptions explicitly: filesystem, env vars, timeouts, credentials, concurrency, temp paths.

## TypeScript Minimal Adapter Sketch

```ts
import http from "node:http";

async function businessHandler(event: unknown) {
  return { ok: true, event };
}

const port = Number(process.env.PORT ?? 8080);

http.createServer(async (req, res) => {
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const raw = Buffer.concat(chunks).toString("utf8");
    const event = raw ? JSON.parse(raw) : {};
    const result = await businessHandler(event);
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(result));
  } catch (err) {
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: String(err) }));
  }
}).listen(port);
```

Production additions: request body limit, structured logging, CloudEvents SDK or header parsing, idempotency enforcement, graceful shutdown, readiness endpoint, auth if exposed.

## Python/FastAPI Minimal Adapter Sketch

```python
from fastapi import FastAPI, Request

app = FastAPI()

async def business_handler(event: dict) -> dict:
    return {"ok": True, "event": event}

@app.get("/healthz")
async def healthz():
    return {"ok": True}

@app.post("/")
async def handle(request: Request):
    try:
        event = await request.json()
    except Exception:
        event = {"body": (await request.body()).decode("utf-8")}
    return await business_handler(event)
```

Run with a server that respects `$PORT`, for example `uvicorn app:app --host 0.0.0.0 --port ${PORT:-8080}`.

## Initial Migration Template

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: migrated-handler
  namespace: workloads
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/min-scale: "1"
        autoscaling.knative.dev/max-scale: "10"
        autoscaling.knative.dev/target: "1"
    spec:
      serviceAccountName: migrated-handler-sa
      containerConcurrency: 1
      timeoutSeconds: 60
      containers:
        - image: harbor.example.com/workloads/migrated-handler@sha256:REPLACE_ME
          ports: [{ containerPort: 8080 }]
          readinessProbe:
            httpGet: { path: /healthz, port: 8080 }
            periodSeconds: 1
            failureThreshold: 10
```

Start with `containerConcurrency: 1` if the Lambda code assumes one event per runtime. Raise only after a concurrency safety review and load test.

## Production Gates

Pass before production cutover:

- image pulled from production registry by digest
- pull secret and CA trust verified
- new Revision becomes Ready from clean node cache and warm node cache
- cold/warm latency measured separately
- event shape captured with event-display or equivalent
- non-2xx retry path tested
- DLQ path tested and owned
- duplicate event test passes without duplicate side effects
- `max-scale` protects downstream systems
- rollback via Route traffic split practiced
- logs/metrics/traces carry enough correlation fields for incident triage

## Cutover Pattern

1. Deploy new Knative Service or new Revision with 0%/tagged traffic if possible.
2. Send synthetic events/requests to tagged URL or test sink.
3. Shift 1-10% traffic or source path.
4. Watch p95/p99, error rate, retries, DLQ, downstream saturation, pod count, queue depth.
5. Move to 50%, then 100%, only after stable windows.
6. Keep previous Revision retained for rollback.

Rollback:

- Serving HTTP: set Route traffic 100% to previous Revision.
- Source direct to Service: point source sink back or route Service traffic back depending on failure layer.
- Broker/Trigger: disable/fix Trigger or shift subscriber, preserving events.
- Retry storm: cap scale, pause source if supported/approved, preserve queue/DLQ, stop duplicate side effects.

## Migration Anti-Patterns

- Keeping AWS event parsing tangled with business logic.
- Treating `containerConcurrency` as a throughput knob only.
- Returning 500 after committing side effects without idempotency.
- Migrating SQS batching semantics without checking RabbitMQ/source parallelism and ack behavior.
- Rebuilding old images for rollback.
- Letting mutable image tags decide production identity.
- Skipping DLQ ownership and replay policy.
- Assuming Lambda timeout, retry, and duplicate semantics map exactly.
