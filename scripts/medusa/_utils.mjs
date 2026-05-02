import fs from "node:fs";
import path from "node:path";

export function readDotEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const raw = fs.readFileSync(filePath, "utf8");
  const env = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;

    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

export function loadEnv() {
  const cwd = process.cwd();
  const sources = [
    readDotEnvFile(path.join(cwd, ".env.local")),
    readDotEnvFile(path.join(cwd, ".env")),
  ];

  const merged = Object.assign({}, ...sources, process.env);
  return merged;
}

export function requireEnv(env, keys) {
  const missing = keys.filter((k) => !env[k]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

export function normalizeUrl(url) {
  return String(url || "").replace(/\/$/, "");
}

function extractToken(payload) {
  if (!payload || typeof payload !== "object") return null;

  const token =
    (payload.token && typeof payload.token === "string" ? payload.token : null) ||
    (payload.access_token && typeof payload.access_token === "string" ? payload.access_token : null) ||
    (payload.jwt && typeof payload.jwt === "string" ? payload.jwt : null);

  return token || null;
}

export async function tryMedusaAdminLogin(params) {
  const backendUrl = normalizeUrl(params?.backendUrl || "");
  const email = String(params?.email || "").trim();
  const password = String(params?.password || "");

  if (!backendUrl || !email || !password) return null;

  const attempts = [
    "/auth/user/emailpass",
    "/auth/admin/emailpass",
    "/admin/auth",
    "/admin/auth/token",
  ];

  for (const pathname of attempts) {
    try {
      const res = await fetch(`${backendUrl}${pathname}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) continue;
      const json = await res.json().catch(() => null);
      const token = extractToken(json);
      if (token) return token;
    } catch {
      // Try the next endpoint.
    }
  }

  return null;
}

export async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function chunk(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) {
    out.push(array.slice(i, i + size));
  }
  return out;
}

export function toCents(priceString) {
  const n = Number(priceString);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}
