import { loadEnv, requireEnv, nowIso } from "./_shared.mjs";

const env = loadEnv();
const targets = ["/", "/search?q=shirt", "/api/auth/me"];

async function runWorker(baseUrl, requestsPerWorker, stats) {
  for (let i = 0; i < requestsPerWorker; i += 1) {
    const path = targets[i % targets.length];
    const started = Date.now();
    let ok = false;
    let status = 0;

    try {
      const res = await fetch(`${baseUrl}${path}`, { redirect: "follow" });
      ok = res.ok || res.status === 401;
      status = res.status;
    } catch {
      ok = false;
    }

    const latencyMs = Date.now() - started;
    stats.total += 1;
    stats.latencies.push(latencyMs);
    if (ok) stats.success += 1;
    else stats.fail += 1;

    if (latencyMs > stats.maxLatency) stats.maxLatency = latencyMs;
    if (status >= 500) stats.serverErrors += 1;
  }
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function run() {
  requireEnv(env, ["NEXT_PUBLIC_SITE_URL"]);
  const baseUrl = String(env.NEXT_PUBLIC_SITE_URL).replace(/\/$/, "");

  const concurrency = Number(env.LOAD_CONCURRENCY || 20);
  const requestsPerWorker = Number(env.LOAD_REQUESTS_PER_WORKER || 25);

  const stats = {
    startedAt: nowIso(),
    total: 0,
    success: 0,
    fail: 0,
    serverErrors: 0,
    maxLatency: 0,
    latencies: [],
  };

  const started = Date.now();
  await Promise.all(
    Array.from({ length: concurrency }, () =>
      runWorker(baseUrl, requestsPerWorker, stats)
    )
  );
  const durationMs = Date.now() - started;

  const summary = {
    startedAt: stats.startedAt,
    completedAt: nowIso(),
    durationMs,
    totalRequests: stats.total,
    success: stats.success,
    fail: stats.fail,
    serverErrors: stats.serverErrors,
    successRate: stats.total ? Number((stats.success / stats.total).toFixed(4)) : 0,
    p50Ms: percentile(stats.latencies, 50),
    p95Ms: percentile(stats.latencies, 95),
    p99Ms: percentile(stats.latencies, 99),
    maxLatencyMs: stats.maxLatency,
  };

  console.log(JSON.stringify(summary, null, 2));

  const pass =
    summary.successRate >= Number(env.LOAD_MIN_SUCCESS_RATE || 0.98) &&
    summary.p95Ms <= Number(env.LOAD_MAX_P95_MS || 1200) &&
    summary.serverErrors === 0;

  if (!pass) process.exit(1);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
