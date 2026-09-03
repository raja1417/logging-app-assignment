# Runbook

## Health checks

- `GET /healthz` — liveness: process is up and able to serve.
- `GET /readyz` — readiness: process is ready to accept traffic.
- `GET /metrics` — Prometheus metrics (request count, latency histogram,
  log-volume counter).

## Common operations

### Check pod status

```bash
kubectl -n hotel get pods,svc,hpa,pdb
kubectl -n hotel describe pod <pod-name>
```

### Tail logs

```bash
kubectl -n hotel logs <pod-name> -c hotel-logging-server
kubectl -n hotel logs <pod-name> -c fluent-bit-logger
```

### Logs not arriving in Splunk

1. Check the Fluent Bit container logs for `[error]`/`[warn]` lines
   (`kubectl logs <pod> -c fluent-bit-logger`).
2. Confirm `SPLUNK_TOKEN` is populated
   (`kubectl -n hotel get secret splunk-secret -o jsonpath='{.data.SPLUNK_TOKEN}' | base64 -d`).
3. Confirm `splunk_hec_host`/`splunk_hec_port`/`splunk_hec_tls` in the
   ConfigMap match your Splunk HEC endpoint.
4. Check whether the `throttle` filter is dropping records
   (`Print_Status true` logs throttle stats periodically) — raise
   `fluentBit.throttle.rate`/`.window` in `values.yaml` if legitimate
   traffic is being dropped.

### High log volume / resource usage

1. Check `/metrics` for the log-volume counter by level/route to see which
   route is generating volume.
2. Lower `LOG_SAMPLE_RATE` / `LOG_MAX_PER_WINDOW` for the offending route,
   or confirm `LOG_LEVEL` isn't set to `debug` in production.
3. Check the Fluent Bit `throttle` filter's configured rate — it should be
   tuned below the Splunk HEC ingest limit for your deployment.

### Scaling

The `HorizontalPodAutoscaler` (`autoscaling.enabled` in Helm values) scales
on CPU/memory utilization between `autoscaling.minReplicas` and
`autoscaling.maxReplicas`. Manually scale with:

```bash
kubectl -n hotel scale deployment/hotel-logging --replicas=5
```

### Rolling back a deployment

```bash
helm history hotel-logging -n hotel
helm rollback hotel-logging <revision> -n hotel
```
