/**
 * Simple deterministic log sampler + token-bucket rate limiter used to keep
 * high-volume routes (e.g. /healthz, /metrics) from flooding the log
 * pipeline. This is the core mitigation for the "huge logging" performance
 * issue described in the original assignment.
 */

export interface SamplerOptions {
  /** Fraction of matching log lines to keep, 0..1 (1 = keep all). */
  sampleRate: number;
  /** Max number of log lines allowed per rolling window, regardless of sampleRate. */
  maxPerWindow: number;
  /** Window size in milliseconds. */
  windowMs: number;
}

export class LogSampler {
  private count = 0;
  private windowStart = Date.now();
  private dropped = 0;

  constructor(private readonly options: SamplerOptions) {}

  /** Returns true if this log event should be emitted. */
  shouldLog(): boolean {
    const now = Date.now();
    if (now - this.windowStart >= this.options.windowMs) {
      this.windowStart = now;
      this.count = 0;
    }

    this.count += 1;

    if (this.count > this.options.maxPerWindow) {
      this.dropped += 1;
      return false;
    }

    if (this.options.sampleRate >= 1) {
      return true;
    }

    const keep = Math.random() < this.options.sampleRate;
    if (!keep) {
      this.dropped += 1;
    }
    return keep;
  }

  getDroppedCount(): number {
    return this.dropped;
  }

  resetDroppedCount(): void {
    this.dropped = 0;
  }
}

export function createSamplerFromEnv(): LogSampler {
  const sampleRate = Number(process.env.LOG_SAMPLE_RATE ?? 1);
  const maxPerWindow = Number(process.env.LOG_MAX_PER_WINDOW ?? 200);
  const windowMs = Number(process.env.LOG_WINDOW_MS ?? 1000);
  return new LogSampler({
    sampleRate: Number.isFinite(sampleRate) ? sampleRate : 1,
    maxPerWindow: Number.isFinite(maxPerWindow) ? maxPerWindow : 200,
    windowMs: Number.isFinite(windowMs) ? windowMs : 1000,
  });
}

/** Routes considered "high volume" and therefore subject to sampling. */
export const HIGH_VOLUME_ROUTES = new Set(["/healthz", "/readyz", "/metrics"]);
