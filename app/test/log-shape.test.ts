import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";

describe("structured log output shape", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("emits a JSON access log line with the expected fields", async () => {
    const app = createApp();
    const lines: string[] = [];
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation((chunk: unknown) => {
      lines.push(chunk.toString());
      return true;
    });

    await request(app).get("/api/hotels");

    // Give the "finish" event listener and pino's async writer a moment to run.
    await new Promise((resolve) => setTimeout(resolve, 50));

    writeSpy.mockRestore();

    const parsed = lines
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter((entry): entry is Record<string, unknown> => entry !== null && entry.route === "/api/hotels");

    expect(parsed.length).toBeGreaterThan(0);
    const entry = parsed[0];
    expect(entry).toHaveProperty("ts");
    expect(entry).toHaveProperty("level");
    expect(entry).toHaveProperty("request_id");
    expect(entry).toHaveProperty("route");
    expect(entry).toHaveProperty("status");
    expect(entry).toHaveProperty("latency_ms");
  });
});
