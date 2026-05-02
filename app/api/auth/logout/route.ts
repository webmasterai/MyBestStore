import { NextResponse } from "next/server";
import { clearCustomerTokenCookie } from "@/lib/medusa/server";

export async function POST() {
  await clearCustomerTokenCookie();
  return NextResponse.json({ ok: true });
}
