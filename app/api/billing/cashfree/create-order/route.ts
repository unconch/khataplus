import { NextResponse } from "next/server";
import { getCurrentOrgId, getCurrentUser } from "@/lib/data/auth";
import { getProfile } from "@/lib/data/profiles";
import { generateUUID } from "@/lib/universal-crypto";
import {
  getCashfreeEnvironment,
  getCashfreeOrdersBaseUrl,
  getCashfreeRequestHeaders,
} from "@/lib/cashfree-billing";
import {
  BILLING_PLANS,
  isBillingCycle,
  isBillingPlanKey,
  getPlanAmountInr,
} from "@/lib/billing-plans";

function getBaseUrl(req: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const forwardedProto = req.headers.get("x-forwarded-proto");
  const forwardedHost = req.headers.get("x-forwarded-host");
  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const host = req.headers.get("host");
  if (host) return `https://${host}`;
  return "http://localhost:3000";
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.isGuest) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const plan = String(body?.plan || "").toLowerCase();
    const cycle = String(body?.cycle || "").toLowerCase();

    if (!isBillingPlanKey(plan) || !isBillingCycle(cycle)) {
      return NextResponse.json({ error: "Invalid plan or billing cycle" }, { status: 400 });
    }

    const orgId = await getCurrentOrgId(user.userId);
    if (!orgId || orgId === "demo-org") {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    const profile = await getProfile(user.userId);
    const customerPhone =
      (profile?.phone || "").replace(/\D/g, "").slice(-10) || "9999999999";

    const orderId = `kp_${plan}_${cycle}_${generateUUID().replace(/-/g, "").slice(0, 14)}`;
    const orderAmount = getPlanAmountInr(plan, cycle);
    const baseUrl = getBaseUrl(request);

    const payload = {
      order_id: orderId,
      order_amount: Number(orderAmount.toFixed(2)),
      order_currency: "INR",
      customer_details: {
        customer_id: user.userId,
        customer_email: user.email,
        customer_phone: customerPhone,
      },
      order_meta: {
        return_url: `${baseUrl}/api/billing/cashfree/return?order_id={order_id}`,
      },
      order_note: `KhataPlus ${BILLING_PLANS[plan].displayName} (${cycle})`,
      order_tags: {
        org_id: orgId,
        plan_key: plan,
        billing_cycle: cycle,
      },
    };

    const response = await fetch(getCashfreeOrdersBaseUrl(), {
      method: "POST",
      headers: getCashfreeRequestHeaders(),
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message =
        data?.message ||
        data?.error?.message ||
        data?.error?.description ||
        "Failed to create Cashfree order";
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const paymentSessionId = String(data?.payment_session_id || "").trim();
    if (!paymentSessionId) {
      return NextResponse.json({ error: "Missing payment session id from Cashfree" }, { status: 500 });
    }

    return NextResponse.json({
      orderId,
      paymentSessionId,
      environment: getCashfreeEnvironment(),
    });
  } catch (error: any) {
    console.error("[Cashfree/CreateOrder] Error:", error?.message || error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
