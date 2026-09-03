import client from "prom-client";

export const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });

export const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"] as const,
  registers: [registry],
});

export const httpRequestDurationSeconds = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request latency in seconds",
  labelNames: ["method", "route", "status"] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [registry],
});

export const logVolumeTotal = new client.Counter({
  name: "log_volume_total",
  help: "Total number of log lines emitted, by level",
  labelNames: ["level"] as const,
  registers: [registry],
});

export const logDroppedTotal = new client.Counter({
  name: "log_dropped_total",
  help: "Total number of log lines dropped by the sampler/rate limiter",
  labelNames: ["route"] as const,
  registers: [registry],
});
