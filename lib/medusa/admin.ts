type AdminRequestInit = RequestInit & {
  query?: Record<string, string | number | boolean | undefined>;
};

function getMedusaAdminConfig() {
  const backendUrl = (
    process.env.MEDUSA_BACKEND_URL ||
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
    ""
  ).replace(/\/$/, "");
  const token = process.env.MEDUSA_ADMIN_API_TOKEN || "";

  if (!backendUrl) throw new Error("Missing MEDUSA_BACKEND_URL");
  if (!token) throw new Error("Missing MEDUSA_ADMIN_API_TOKEN");

  return { backendUrl, token };
}

export async function medusaAdminRequest<T>(
  path: string,
  init: AdminRequestInit = {}
): Promise<T> {
  const { backendUrl, token } = getMedusaAdminConfig();
  const query = init.query
    ? `?${new URLSearchParams(
        Object.entries(init.query)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString()}`
    : "";

  const res = await fetch(`${backendUrl}${path}${query}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Medusa admin request failed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
  }

  if (res.status === 204) return null as T;
  return (await res.json()) as T;
}
