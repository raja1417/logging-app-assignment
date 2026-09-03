import { createApp } from "./app";
import { logger } from "./lib/logger";
import { markNotReady } from "./routes/health";

const port = Number(process.env.PORT ?? 8080);
const requestTimeoutMs = Number(process.env.REQUEST_TIMEOUT_MS ?? 10000);

const app = createApp();
const server = app.listen(port, () => {
  logger.info({ route: "startup", port }, "server_started");
});

server.requestTimeout = requestTimeoutMs;
server.headersTimeout = requestTimeoutMs + 1000;

function shutdown(signal: string): void {
  logger.info({ route: "shutdown", signal }, "shutdown_initiated");
  markNotReady();
  server.close((err) => {
    if (err) {
      logger.error({ route: "shutdown", err: err.message }, "shutdown_error");
      process.exit(1);
    }
    logger.info({ route: "shutdown" }, "shutdown_complete");
    process.exit(0);
  });

  // Force-exit if graceful shutdown takes too long.
  setTimeout(() => {
    logger.warn({ route: "shutdown" }, "shutdown_forced");
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export { server };
