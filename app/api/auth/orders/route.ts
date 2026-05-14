import { NextResponse } from "next/server";
import {
  getCustomerTokenFromCookie,
  medusaStoreRequest,
} from "@/lib/medusa/server";

async function fetchOrders(token: string) {
  const regionId = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || "";
  
  // Medusa v2 prefers passing region context if needed, 
  // but for authenticated /store/orders, it should just work.
  // If it's a 400, it might be because of the region_id query param format.
  
  const attempts: { path: string; headers: Record<string, string> }[] = [
    {
      path: "/store/orders?limit=20",
      headers: regionId ? { "x-region-id": regionId } : {},
    },
    {
      path: `/store/orders?limit=20&region_id=${regionId}`,
      headers: {},
    },
    {
      path: "/store/customers/me/orders?limit=20",
      headers: {},
    },
  ];

  for (const attempt of attempts) {
    try {
      return await medusaStoreRequest<Record<string, unknown>>(
        attempt.path,
        {
            method: "GET",
            headers: {
              ...(attempt.headers["x-region-id"] ? { "x-region-id": attempt.headers["x-region-id"] } : {})
            }
          },
        token
      );
    } catch (e) {
      console.error(`Fetch orders failed for ${attempt.path}:`, e instanceof Error ? e.message : e);
    }
  }

  throw new Error("Unable to fetch orders");
}

export async function GET() {
  try {
    const token = await getCustomerTokenFromCookie();
    if (!token) {
      return NextResponse.json({ orders: [] }, { status: 401 });
    }

    const payload = await fetchOrders(token);
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch orders" },
      { status: 400 }
    );
  }
}
