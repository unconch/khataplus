import { NextResponse } from "next/server";
import { activatePlanFromCashfreeOrder } from "@/lib/cashfree-billing";
import { getCurrentOrgId, getCurrentUser } from "@/lib/data/auth";

function toPricingUrl(req: Request, status: "success" | "failed", message: string) {
  const url = new URL("/pricing", req.url);
  url.searchParams.set("payment", status);
  url.searchParams.set("message", message);
  return url;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId =
    url.searchParams.get("order_id") ||
    url.searchParams.get("orderId") ||
    "";

  if (!orderId) {
    return NextResponse.redirect(
      toPricingUrl(request, "failed", "Missing order id in payment return"),
      { status: 302 }
    );
  }

  try {
    // If user session exists, enforce org match. If not, allow generic activation by order tags.
    const user = await getCurrentUser();
    const orgId =
      user && !user.isGuest ? await getCurrentOrgId(user.userId) : undefined;

    await activatePlanFromCashfreeOrder(orderId, orgId || undefined);
    return NextResponse.redirect(
      toPricingUrl(request, "success", "Payment verified and plan activated"),
      { status: 302 }
    );
  } catch (error: any) {
    return NextResponse.redirect(
      toPricingUrl(request, "failed", String(error?.message || "Payment verification failed")),
      { status: 302 }
    );
  }
}
