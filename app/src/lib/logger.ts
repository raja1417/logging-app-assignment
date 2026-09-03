import pino from "pino";
import fs from "fs";
import path from "path";

export const LOG_LEVEL = process.env.LOG_LEVEL || "info";

/**
 * Optional log file path (e.g. /var/log/app/app.log). When set, log lines
 * are written to both stdout and this file, so a Fluent Bit sidecar can tail
 * the file via a shared volume (docker-compose / Kubernetes emptyDir) while
 * `docker logs` / `kubectl logs` still show output directly from stdout.
 */
const logFilePath = process.env.LOG_FILE;

function createDestination(): pino.DestinationStream {
  if (!logFilePath) {
    return process.stdout;
  }
  fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
  const fileStream = pino.destination({ dest: logFilePath, sync: false, mkdir: true });
  return pino.multistream([{ stream: process.stdout }, { stream: fileStream }]);
}

/**
 * Base structured JSON logger.
 * - redacts common secret/PII fields
 * - level controlled via LOG_LEVEL env var
 * - emits fields consumed downstream by Fluent Bit: ts, level, msg, request_id, route, status, latency_ms
 */
export const logger = pino(
  {
    level: LOG_LEVEL,
    timestamp: () => `,"ts":"${new Date().toISOString()}"`,
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "*.password",
        "*.token",
        "*.splunk_token",
        "*.ssn",
        "*.creditCard",
      ],
      censor: "[REDACTED]",
    },
    base: { service: "hotel-booking-api" },
  },
  // Write through process.stdout by default (instead of pino's default
  // fd-based destination) so that log output can be captured/tested and
  // redirected consistently in containers; optionally tee to LOG_FILE too.
  createDestination()
);

export type Logger = typeof logger;
