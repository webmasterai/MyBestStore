import fs from "node:fs";
import path from "node:path";
import { loadEnv, requireEnv, nowIso } from "./_shared.mjs";

const env = loadEnv();

async function run() {
  requireEnv(env, ["NEXT_PUBLIC_SITE_URL"]);
  const siteUrl = String(env.NEXT_PUBLIC_SITE_URL).replace(/\/$/, "");

  const paths = ["/", "/search?q=summer", "/account", "/api/auth/me"];
  const iterations = Number(env.HYPERCARE_ITERATIONS || 72);
  const intervalMs = Number(env.HYPERCARE_INTERVAL_MS || 60 * 60 * 1000);

  const outFile = path.join(process.cwd(), "scripts", "phase7", "hypercare-log.jsonl");

  for (let i = 0; i < iterations; i += 1) {
    const cycle = {
      at: nowIso(),
      index: i + 1,
      total: iterations,
      checks: [],
    };

    for (const p of paths) {
      const started = Date.now();
      try {
        const res = await fetch(`${siteUrl}${p}`, { redirect: "follow" });
        cycle.checks.push({
          path: p,
          ok: res.ok || res.status === 401,
          status: res.status,
          latencyMs: Date.now() - started,
        });
      } catch (error) {
        cycle.checks.push({
          path: p,
          ok: false,
          status: 0,
          latencyMs: Date.now() - started,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    cycle.ok = cycle.checks.every((c) => c.ok);
    fs.appendFileSync(outFile, `${JSON.stringify(cycle)}\n`, "utf8");
    console.log(`Cycle ${cycle.index}/${cycle.total}: ${cycle.ok ? "OK" : "DEGRADED"}`);

    if (i < iterations - 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
