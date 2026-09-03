import { describe, expect, it } from "vitest";
import { LogSampler } from "../src/lib/sampler";

describe("LogSampler", () => {
  it("keeps all logs when sampleRate is 1 and under the window limit", () => {
    const sampler = new LogSampler({ sampleRate: 1, maxPerWindow: 100, windowMs: 1000 });
    for (let i = 0; i < 10; i += 1) {
      expect(sampler.shouldLog()).toBe(true);
    }
  });

  it("drops logs once maxPerWindow is exceeded", () => {
    const sampler = new LogSampler({ sampleRate: 1, maxPerWindow: 5, windowMs: 1000 });
    const results = Array.from({ length: 10 }, () => sampler.shouldLog());
    const kept = results.filter(Boolean).length;
    expect(kept).toBe(5);
    expect(sampler.getDroppedCount()).toBe(5);
  });

  it("resets the window after windowMs elapses", async () => {
    const sampler = new LogSampler({ sampleRate: 1, maxPerWindow: 2, windowMs: 20 });
    expect(sampler.shouldLog()).toBe(true);
    expect(sampler.shouldLog()).toBe(true);
    expect(sampler.shouldLog()).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(sampler.shouldLog()).toBe(true);
  });

  it("statistically samples at the configured rate", () => {
    const sampler = new LogSampler({ sampleRate: 0, maxPerWindow: 1000, windowMs: 1000 });
    const results = Array.from({ length: 20 }, () => sampler.shouldLog());
    expect(results.every((r) => r === false)).toBe(true);
    expect(sampler.getDroppedCount()).toBe(20);
  });

  it("resetDroppedCount clears the dropped counter", () => {
    const sampler = new LogSampler({ sampleRate: 0, maxPerWindow: 1000, windowMs: 1000 });
    sampler.shouldLog();
    expect(sampler.getDroppedCount()).toBe(1);
    sampler.resetDroppedCount();
    expect(sampler.getDroppedCount()).toBe(0);
  });
});
