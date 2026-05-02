import { NextResponse } from "next/server";
import { requireAdminSecret } from "@/lib/admin/guards";
import { medusaAdminRequest } from "@/lib/medusa/admin";
import { writeAdminAudit } from "@/lib/admin/audit";

const STORE_ID = process.env.MEDUSA_STORE_ID || "";

export async function GET(req: Request) {
  const unauthorized = requireAdminSecret(req);
  if (unauthorized) return unauthorized;

  try {
    const store = await medusaAdminRequest<{ store?: { metadata?: Record<string, unknown> } }>(
      `/admin/stores/${STORE_ID || "store"}`
    );

    return NextResponse.json({
      homepage_content: store.store?.metadata?.homepage_content || null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load homepage content" },
      { status: 400 }
    );
  }
}

export async function PUT(req: Request) {
  const unauthorized = requireAdminSecret(req);
  if (unauthorized) return unauthorized;

  try {
    const body = (await req.json()) as { homepage_content?: unknown; actor?: string };
    const homepageContent = body.homepage_content;

    const store = await medusaAdminRequest<{ store?: { id: string; metadata?: Record<string, unknown> } }>(
      `/admin/stores/${STORE_ID || "store"}`,
      {
        method: "POST",
        body: JSON.stringify({
          metadata: {
            homepage_content: homepageContent,
          },
        }),
      }
    );

    await writeAdminAudit({
      actor: body.actor || "admin-portal",
      action: "update",
      entity: "homepage_content",
      entityId: store.store?.id,
      payload: homepageContent,
    });

    return NextResponse.json({ ok: true, store: store.store });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update homepage content" },
      { status: 400 }
    );
  }
}
