# Logging Strategy

## Why this exists

The original assignment was triggered by a performance incident: the hotel
booking system logged so much that resource utilization (CPU/memory/I/O for
log writes and shipping) degraded request performance. This document
explains the specific mechanisms in this repo that keep log volume and
resource overhead low while preserving observability.

## Layered log-volume controls

1. **Levels** — `LOG_LEVEL` (env var, default `info`) controls what's
   emitted at all. `DEBUG` should be disabled in production.
2. **Sampling & rate limiting** (`app/src/lib/sampler.ts`) — the
   `LogSampler` combines a sample rate (`LOG_SAMPLE_RATE`, fraction of
   requests logged) with a token-bucket style cap
   (`LOG_MAX_PER_WINDOW` events per `LOG_WINDOW_MS`) per route. This is
   applied to naturally high-volume, low-information routes such as
   `/healthz`, `/readyz`, and `/metrics` (health checks/scrapes can fire
   many times a minute) so they don't dominate the log stream, while
   business-relevant routes (bookings, hotel lookups) are always logged.
3. **Redaction** — `app/src/lib/logger.ts` configures pino redaction paths
   for common secret/PII fields (e.g. Authorization headers, tokens,
   passwords, guest email) so sensitive data never reaches the log stream
   or Splunk, and log entries stay small.
4. **Structured JSON** — every log line is a single JSON object
   (`ts`, `level`, `service`, `request_id`, `route`, `method`, `status`,
   `latency_ms`, ...). This is cheaper to parse than free-form text and
   avoids multiline log explosion.
5. **Fluent Bit `grep` filter** — drops any record whose `level` still
   indicates `debug` (defense in depth if `LOG_LEVEL` is misconfigured).
6. **Fluent Bit `throttle` filter** — enforces a hard cap
   (`rate`/`window`, configurable via Helm values
   `fluentBit.throttle.rate`/`fluentBit.throttle.window`) on events/sec
   forwarded to Splunk, so a burst of traffic can't overwhelm the HEC
   ingest pipeline or the node running the sidecar.
7. **Buffered, bounded delivery** — `storage.type filesystem`,
   `mem_buf_limit`, and `storage.total_limit_size` bound the sidecar's
   memory/disk usage if Splunk is briefly unreachable, with `Retry_Limit`
   preventing unbounded retry storms.
8. **Observability of the mitigation itself** — `/metrics` exposes a
   log-volume counter (by level) so a regression in the mitigations above
   (e.g. sampling accidentally disabled) is visible in Prometheus/Grafana
   before it causes an incident, rather than being discovered after the
   fact.

## Correlation

Every request gets an `X-Request-Id` (generated if not supplied by the
client) that is attached to every log line for that request and echoed
back in the response header, so a single request's logs — API access log,
any error log, and the Fluent Bit-forwarded record — can be correlated
end-to-end in Splunk.
