import { cookies } from "next/headers";

export const CUSTOMER_TOKEN_COOKIE = "mb_customer_token";

function getBackendUrl() {
  const raw =
    process.env.MEDUSA_BACKEND_URL ||
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
    "";
  if (!raw) throw new Error("Missing MEDUSA_BACKEND_URL");
  return raw.replace(/\/$/, "");
}

function getPublishableKey() {
  return process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";
}

type Json = Record<string, unknown>;

export async function medusaStoreRequest<T>(
  path: string,
  init: RequestInit = {},
  authToken?: string
): Promise<T> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };

  const extraHeaders = new Headers(init.headers || {});
  extraHeaders.forEach((value, key) => {
    headers[key] = value;
  });

  const pk = getPublishableKey();
  if (pk) {
    headers["x-publishable-api-key"] = pk;
    // Some versions/configurations might expect this variant
    headers["x-publishable-key"] = pk;
  }

  if (authToken) {
    headers.authorization = `Bearer ${authToken}`;
  }

  const res = await fetch(`${getBackendUrl()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Medusa store request failed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
  }

  if (res.status === 204) return null as T;
  return (await res.json()) as T;
}

export async function tryMedusaAuthLogin(email: string, password: string): Promise<string> {
  const attempts: Array<{ path: string; body: Json }> = [
    {
      // Medusa v2 - Auth Module
      path: "/auth/customer/emailpass",
      body: { email, password },
    },
    {
      // Medusa v1 - Legacy Auth
      path: "/store/auth",
      body: { email, password },
    },
  ];

  for (const attempt of attempts) {
    try {
      const payload = await medusaStoreRequest<Record<string, unknown>>(attempt.path, {
        method: "POST",
        body: JSON.stringify(attempt.body),
      });

      const token =
        (payload.token as string | undefined) ||
        (payload.access_token as string | undefined) ||
        ((payload.customer as Record<string, unknown> | undefined)?.token as string | undefined);

      if (token) return token;
    } catch (e) {
      // Log error but continue to next attempt
      console.error(`Login attempt failed for ${attempt.path}:`, e instanceof Error ? e.message : e);
    }
  }

  throw new Error("Invalid email or password");
}

export async function tryMedusaAuthRegister(params: {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}) {
  // In Medusa v2, we first create the auth credentials
  // Then the storefront should ensure a customer record is created.
  
  let registered = false;
  const attempts: Array<{ path: string; body: Json }> = [
    {
      path: "/auth/customer/emailpass/register",
      body: params,
    },
    {
      path: "/store/customers",
      body: params,
    },
  ];

  for (const attempt of attempts) {
    try {
      await medusaStoreRequest<Record<string, unknown>>(attempt.path, {
        method: "POST",
        body: JSON.stringify(attempt.body),
      });
      registered = true;
      break;
    } catch (e) {
      console.error(`Registration attempt failed for ${attempt.path}:`, e instanceof Error ? e.message : e);
    }
  }

  if (!registered) {
    throw new Error("Registration failed. The email might already be in use.");
  }
}

export async function getCustomerTokenFromCookie() {
  const jar = await cookies();
  return jar.get(CUSTOMER_TOKEN_COOKIE)?.value;
}

export async function setCustomerTokenCookie(token: string) {
  const jar = await cookies();
  jar.set(CUSTOMER_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearCustomerTokenCookie() {
  const jar = await cookies();
  jar.set(CUSTOMER_TOKEN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
