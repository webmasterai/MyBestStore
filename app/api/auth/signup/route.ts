import { NextResponse } from "next/server";
import {
  setCustomerTokenCookie,
  tryMedusaAuthLogin,
  tryMedusaAuthRegister,
  medusaStoreRequest,
} from "@/lib/medusa/server";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string;
      password?: string;
      first_name?: string;
      last_name?: string;
    };

    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    await tryMedusaAuthRegister({
      email,
      password,
      first_name: body.first_name,
      last_name: body.last_name,
    });

    // Obtain initial token via login
    let token = await tryMedusaAuthLogin(email, password);

    // Medusa v2: Registration only creates the AuthUser. 
    // We must ensure the Customer record exists in the Customer Module and is linked.
    try {
      await medusaStoreRequest("/store/customers", {
        method: "POST",
        body: JSON.stringify({
          email,
          first_name: body.first_name,
          last_name: body.last_name,
        }),
      }, token);

      // CRITICAL: After creating the customer, we MUST login again to get a new token 
      // that contains the actor_id (customer_id). Without this, /me returns 401.
      token = await tryMedusaAuthLogin(email, password);
    } catch (e) {
      console.log("Customer record creation skip/fail (might already exist):", e instanceof Error ? e.message : e);
    }

    await setCustomerTokenCookie(token);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Signup failed" },
      { status: 400 }
    );
  }
}
