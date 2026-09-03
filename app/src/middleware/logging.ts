import { NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";
import { logger } from "../lib/logger";
import { createSamplerFromEnv, HIGH_VOLUME_ROUTES } from "../lib/sampler";
import { httpRequestDurationSeconds, httpRequestsTotal, logDroppedTotal, logVolumeTotal } from "../lib/metrics";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId: string;
      startTime: [number, number];
    }
  }
}

const sampler = createSamplerFromEnv();

/** Adds/propagates X-Request-Id and attaches a start time for latency measurement. */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header("X-Request-Id");
  req.requestId = incoming && incoming.trim().length > 0 ? incoming : randomUUID();
  req.startTime = process.hrtime();
  res.setHeader("X-Request-Id", req.requestId);
  next();
}

/**
 * Structured access logging middleware.
 * Emits one JSON log line per request with fields: request_id, route, status,
 * latency_ms. High-volume routes (health/metrics) are subject to sampling and
 * rate limiting so that they do not overwhelm the log pipeline.
 */
export function accessLogMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.on("finish", () => {
    const diff = process.hrtime(req.startTime);
    const latencyMs = diff[0] * 1000 + diff[1] / 1e6;
    const route = req.route ? `${req.baseUrl}${req.route.path === "/" ? "" : req.route.path}` || "/" : req.path;

    httpRequestsTotal.inc({ method: req.method, route, status: String(res.statusCode) });
    httpRequestDurationSeconds.observe(
      { method: req.method, route, status: String(res.statusCode) },
      latencyMs / 1000
    );

    const isHighVolume = HIGH_VOLUME_ROUTES.has(req.path);
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

    if (isHighVolume && !sampler.shouldLog()) {
      logDroppedTotal.inc({ route });
      return;
    }

    logVolumeTotal.inc({ level });
    logger[level]({
      request_id: req.requestId,
      route,
      method: req.method,
      status: res.statusCode,
      latency_ms: Number(latencyMs.toFixed(3)),
    });
  });
  next();
}

export { sampler as accessLogSampler };
