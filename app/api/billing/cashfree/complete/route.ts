import { NextResponse } from "next/server";
import { getCurrentOrgId, getCurrentUser } from "@/lib/data/auth";
import { activatePlanFromCashfreeOrder } from "@/lib/cashfree-billing";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.isGuest) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const orderId = String(body?.orderId || "").trim();
    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const orgId = await getCurrentOrgId(user.userId);
    if (!orgId || orgId === "demo-org") {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    const result = await activatePlanFromCashfreeOrder(orderId, orgId);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    const message = String(error?.message || "Internal Server Error");
    const isUnpaid = message.toLowerCase().includes("not paid");
    const isMismatch = message.toLowerCase().includes("mismatch");
    return NextResponse.json(
      { error: message },
      { status: isUnpaid ? 409 : isMismatch ? 403 : 500 }
    );
  }
}
