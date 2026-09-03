# Architecture

## Components

- **hotel-logging-server** (`app/`): Express + TypeScript REST API for
  hotels/bookings. Emits structured JSON logs via `pino`, exposes
  Prometheus metrics on `/metrics`, and liveness/readiness endpoints
  (`/healthz`, `/readyz`).
- **fluent-bit-logger**: sidecar container in the same Pod, sharing an
  `emptyDir` volume with the app so it can tail the app's JSON log file
  (`/var/log/app/app.log`). Enriches records with Kubernetes metadata
  (from the Downward API), drops `DEBUG` records, throttles output, and
  forwards to Splunk HEC plus stdout.
- **Splunk**: log index/search backend. In local dev, `docker-compose.yaml`
  substitutes an HTTP echo mock for Splunk HEC so the full pipeline can be
  exercised without a real Splunk instance.
- **Prometheus/Grafana**: scrape and visualize `/metrics` (request rate,
  latency histogram, log-volume counter).

## Request flow

1. Client sends an HTTP request to the Service, which load-balances to a
   Pod.
2. The `logging` middleware assigns/propagates a request id
   (`X-Request-Id`), starts a timer, and (for high-volume routes) consults
   the `LogSampler` to decide whether to emit an access log for this
   request.
3. Route handlers validate input with `zod`, read/write the in-memory
   repository, and respond.
4. The `error` middleware catches and logs any thrown errors as structured
   JSON with the request id attached.
5. pino writes JSON logs to stdout and, if `LOG_FILE` is set, tees them to
   a file on the shared volume.
6. Fluent Bit tails that file, applies `modify`/`grep`/`throttle` filters,
   and forwards the (already-reduced) stream to Splunk HEC and stdout.

## Deployment topology

- `Deployment` runs `hotel-logging-server` + `fluent-bit-logger` in the same
  Pod (sidecar pattern), with pod anti-affinity/topology spread across
  nodes, a `PodDisruptionBudget`, and an `HorizontalPodAutoscaler` scaling
  on CPU/memory.
- `NetworkPolicy` restricts ingress to the app port from the same namespace
  and egress to DNS, the Splunk HEC port, and the Kubernetes API.
- `Ingress` (optional, `ingress.enabled` in Helm values) exposes the
  Service externally.

See the root [README](../README.md) for the Mermaid diagram and quickstart.
