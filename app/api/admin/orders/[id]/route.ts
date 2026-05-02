import { NextResponse } from "next/server";
import { requireAdminSecret } from "@/lib/admin/guards";
import { medusaAdminRequest } from "@/lib/medusa/admin";
import { writeAdminAudit } from "@/lib/admin/audit";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const unauthorized = requireAdminSecret(req);
  if (unauthorized) return unauthorized;

  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const data = await medusaAdminRequest<Record<string, unknown>>(
      `/admin/orders/${id}`,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );

    await writeAdminAudit({
      actor: "admin-portal",
      action: "update",
      entity: "order",
      entityId: id,
      payload: body,
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update order" },
      { status: 400 }
    );
  }
}
