import { NextResponse } from "next/server";
import { requireAdminSecret } from "@/lib/admin/guards";
import { medusaAdminRequest } from "@/lib/medusa/admin";
import { writeAdminAudit } from "@/lib/admin/audit";

export async function GET(req: Request) {
  const unauthorized = requireAdminSecret(req);
  if (unauthorized) return unauthorized;

  try {
    const data = await medusaAdminRequest<Record<string, unknown>>("/admin/products", {
      query: { limit: 50 },
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load products" },
      { status: 400 }
    );
  }
}

export async function POST(req: Request) {
  const unauthorized = requireAdminSecret(req);
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();
    const data = await medusaAdminRequest<Record<string, unknown>>("/admin/products", {
      method: "POST",
      body: JSON.stringify(body),
    });

    await writeAdminAudit({
      actor: "admin-portal",
      action: "create",
      entity: "product",
      payload: body,
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create product" },
      { status: 400 }
    );
  }
}
