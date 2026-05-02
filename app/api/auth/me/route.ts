import { NextResponse } from "next/server";
import {
  getCustomerTokenFromCookie,
  medusaStoreRequest,
} from "@/lib/medusa/server";

export async function GET() {
  try {
    const token = await getCustomerTokenFromCookie();
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    try {
      const payload = await medusaStoreRequest<any>(
        "/store/customers/me",
        { method: "GET" },
        token
      );
      
      // Medusa v2 usually returns { customer: { ... } }
      // Medusa v1 might return { customer: { ... } } or just the customer object
      const customer = payload?.customer || (payload?.id ? payload : null);

      if (!customer) {
        throw new Error("No customer record found in Medusa response");
      }

      return NextResponse.json({ authenticated: true, customer });
    } catch (e) {
      console.error("Medusa /store/customers/me failed with token:", e instanceof Error ? e.message : e);
      return NextResponse.json({ authenticated: false, error: "Unauthorized by Medusa" }, { status: 401 });
    }
  } catch (err) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
