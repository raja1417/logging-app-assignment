import express, { Express } from "express";
import path from "path";
import { requestIdMiddleware, accessLogMiddleware } from "./middleware/logging";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { hotelsRouter } from "./routes/hotels";
import { bookingsRouter } from "./routes/bookings";
import { healthRouter, markReady } from "./routes/health";

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "100kb" }));
  app.use(requestIdMiddleware);
  app.use(accessLogMiddleware);

  app.use(healthRouter);
  app.use("/api/hotels", hotelsRouter);
  app.use("/api/bookings", bookingsRouter);

  app.use(express.static(path.join(__dirname, "..", "public")));

  app.use(notFoundHandler);
  app.use(errorHandler);

  markReady();

  return app;
}
