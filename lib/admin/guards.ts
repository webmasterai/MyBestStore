import { NextResponse } from "next/server";

export function requireAdminSecret(req: Request) {
  const secret = process.env.ADMIN_PORTAL_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "ADMIN_PORTAL_SECRET is not configured" },
      { status: 500 }
    );
  }

  const incoming = req.headers.get("x-admin-secret");
  if (!incoming || incoming !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
