import { NextResponse } from "next/server";
import {
  setCustomerTokenCookie,
  tryMedusaAuthLogin,
  medusaStoreRequest,
} from "@/lib/medusa/server";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    let token = await tryMedusaAuthLogin(email, password);

    // Ensure customer record exists (important for v2 if not already created)
    try {
      await medusaStoreRequest("/store/customers/me", { method: "GET" }, token);
    } catch (e) {
      console.log("Customer record missing during login, attempting to create...", e instanceof Error ? e.message : e);
      try {
        await medusaStoreRequest("/store/customers", {
          method: "POST",
          body: JSON.stringify({ email }),
        }, token);
        
        // RE-LOGIN to get a token with actor_id
        token = await tryMedusaAuthLogin(email, password);
      } catch (ce) {
        console.error("Failed to create customer record during login fallback:", ce instanceof Error ? ce.message : ce);
      }
    }

    await setCustomerTokenCookie(token);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Login failed" },
      { status: 401 }
    );
  }
}
