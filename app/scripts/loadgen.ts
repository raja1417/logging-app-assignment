/**
 * Configurable load/log generator used to simulate the "huge logging"
 * high-volume scenario described in the original assignment, and to verify
 * that sampling/throttling keeps the log pipeline healthy.
 *
 * Usage:
 *   BASE_URL=http://localhost:8080 REQUESTS=500 CONCURRENCY=20 npm run loadgen
 */

const BASE_URL = process.env.BASE_URL ?? "http://localhost:8080";
const TOTAL_REQUESTS = Number(process.env.REQUESTS ?? 200);
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 10);

const ROUTES = ["/healthz", "/readyz", "/metrics", "/api/hotels", "/api/hotels/h-1"];

async function hitOnce(): Promise<void> {
  const route = ROUTES[Math.floor(Math.random() * ROUTES.length)];
  try {
    const res = await fetch(`${BASE_URL}${route}`);
    await res.text();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`request to ${route} failed`, err);
  }
}

async function worker(count: number): Promise<void> {
  for (let i = 0; i < count; i += 1) {
    await hitOnce();
  }
}

async function main(): Promise<void> {
  const perWorker = Math.ceil(TOTAL_REQUESTS / CONCURRENCY);
  const workers = Array.from({ length: CONCURRENCY }, () => worker(perWorker));
  const start = Date.now();
  await Promise.all(workers);
  // eslint-disable-next-line no-console
  console.log(`Sent ~${TOTAL_REQUESTS} requests in ${Date.now() - start}ms against ${BASE_URL}`);
}

main();
