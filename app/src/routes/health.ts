import { Router } from "express";
import { registry } from "../lib/metrics";

export const healthRouter = Router();

let ready = false;

export function markReady(): void {
  ready = true;
}

export function markNotReady(): void {
  ready = false;
}

healthRouter.get("/healthz", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

healthRouter.get("/readyz", (_req, res) => {
  if (!ready) {
    res.status(503).json({ status: "not_ready" });
    return;
  }
  res.status(200).json({ status: "ready" });
});

healthRouter.get("/metrics", async (_req, res) => {
  res.setHeader("Content-Type", registry.contentType);
  res.send(await registry.metrics());
});
