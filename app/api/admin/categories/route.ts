import { NextResponse } from "next/server";
import { requireAdminSecret } from "@/lib/admin/guards";
import { medusaAdminRequest } from "@/lib/medusa/admin";
import { writeAdminAudit } from "@/lib/admin/audit";

export async function GET(req: Request) {
  const unauthorized = requireAdminSecret(req);
  if (unauthorized) return unauthorized;

  try {
    const data = await medusaAdminRequest<Record<string, unknown>>("/admin/collections", {
      query: { limit: 50 },
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load categories" },
      { status: 400 }
    );
  }
}

export async function POST(req: Request) {
  const unauthorized = requireAdminSecret(req);
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();
    const data = await medusaAdminRequest<Record<string, unknown>>("/admin/collections", {
      method: "POST",
      body: JSON.stringify(body),
    });

    await writeAdminAudit({
      actor: "admin-portal",
      action: "create",
      entity: "category",
      payload: body,
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create category" },
      { status: 400 }
    );
  }
}
