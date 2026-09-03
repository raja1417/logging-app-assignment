import pino from "pino";

export const LOG_LEVEL = process.env.LOG_LEVEL || "info";

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
  // Write through process.stdout (instead of pino's default fd-based
  // destination) so that log output can be captured/tested and redirected
  // consistently in containers.
  process.stdout
);

export type Logger = typeof logger;
