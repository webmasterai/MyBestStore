import { NextResponse } from "next/server";
import { requireAdminSecret } from "@/lib/admin/guards";
import { medusaAdminRequest } from "@/lib/medusa/admin";

export async function GET(req: Request) {
  const unauthorized = requireAdminSecret(req);
  if (unauthorized) return unauthorized;

  try {
    const data = await medusaAdminRequest<Record<string, unknown>>("/admin/orders", {
      query: { limit: 50 },
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load orders" },
      { status: 400 }
    );
  }
}
