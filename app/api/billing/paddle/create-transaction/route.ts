import { NextResponse } from "next/server";
import { getCurrentOrgId, getCurrentUser } from "@/lib/data/auth";
import { BILLING_PLANS, isBillingCycle, isBillingPlanKey, getPlanPriceId } from "@/lib/billing-plans";

const PADDLE_API_BASE = "https://api.paddle.com";

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

    const apiKey = process.env.PADDLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Paddle is not configured (missing PADDLE_API_KEY)" }, { status: 500 });
    }

    const priceId = getPlanPriceId(plan, cycle);
    if (!priceId) {
      const missingEnv = BILLING_PLANS[plan].envPriceKey[cycle];
      return NextResponse.json(
        { error: `Missing Paddle price id: ${missingEnv}` },
        { status: 500 }
      );
    }

    const payload = {
      items: [{ price_id: priceId, quantity: 1 }],
      collection_mode: "automatic",
      custom_data: {
        org_id: orgId,
        plan_key: plan,
        billing_cycle: cycle,
        created_by_user_id: user.userId,
      },
    };

    const response = await fetch(`${PADDLE_API_BASE}/transactions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Paddle-Version": "1",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message =
        data?.error?.detail ||
        data?.error?.message ||
        data?.detail ||
        "Failed to create Paddle transaction";
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const transactionId = data?.data?.id as string | undefined;
    if (!transactionId) {
      return NextResponse.json({ error: "Paddle transaction id missing in response" }, { status: 500 });
    }

    return NextResponse.json({
      transactionId,
      clientToken: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || "",
      environment: process.env.NEXT_PUBLIC_PADDLE_ENV || process.env.PADDLE_ENV || "sandbox",
      planDisplayName: BILLING_PLANS[plan].displayName,
    });
  } catch (error: any) {
    console.error("[Paddle/CreateTransaction] Error:", error?.message || error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
