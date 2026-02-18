import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentOrgId, getCurrentUser } from "@/lib/data/auth";
import { BILLING_PLANS, isBillingCycle, isBillingPlanKey } from "@/lib/billing-plans";

const PADDLE_API_BASE = "https://api.paddle.com";

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.isGuest) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const transactionId = String(body?.transactionId || "").trim();
    if (!transactionId) {
      return NextResponse.json({ error: "Missing transactionId" }, { status: 400 });
    }

    const orgId = await getCurrentOrgId(user.userId);
    if (!orgId || orgId === "demo-org") {
      return NextResponse.json({ error: "Organization not found" }, { status: 400 });
    }

    const apiKey = process.env.PADDLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Paddle is not configured (missing PADDLE_API_KEY)" }, { status: 500 });
    }

    const response = await fetch(`${PADDLE_API_BASE}/transactions/${transactionId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Paddle-Version": "1",
      },
      cache: "no-store",
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message =
        payload?.error?.detail ||
        payload?.error?.message ||
        payload?.detail ||
        "Failed to fetch Paddle transaction";
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const tx = payload?.data;
    if (!tx) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const status = String(tx.status || "").toLowerCase();
    if (status !== "completed") {
      return NextResponse.json({ error: "Payment not completed yet", status }, { status: 409 });
    }

    const custom = tx.custom_data || {};
    const customOrgId = String(custom.org_id || "");
    const planKey = String(custom.plan_key || "").toLowerCase();
    const cycle = String(custom.billing_cycle || "").toLowerCase();

    if (!isBillingPlanKey(planKey) || !isBillingCycle(cycle)) {
      return NextResponse.json({ error: "Invalid plan metadata in transaction" }, { status: 400 });
    }

    if (!customOrgId || customOrgId !== orgId) {
      return NextResponse.json({ error: "Transaction organization mismatch" }, { status: 403 });
    }

    const plan = BILLING_PLANS[planKey];
    const periodStart = new Date();
    const periodEnd = addMonths(periodStart, plan.durationMonths[cycle]);

    await sql`
      UPDATE organizations
      SET
        plan_type = ${plan.orgPlanType},
        subscription_status = 'active',
        plan_expires_at = ${periodEnd.toISOString()},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${orgId}
    `;

    const invoiceRef = `paddle:${tx.id}`;
    const amountMinor = Number(tx?.details?.totals?.total ?? 0);
    const amount = Number.isFinite(amountMinor) ? amountMinor / 100 : 0;
    const currency = String(tx?.currency_code || "INR");

    try {
      const existing = await sql`
        SELECT id FROM platform_invoices
        WHERE razorpay_payment_id = ${invoiceRef}
        LIMIT 1
      `;

      if (existing.length === 0) {
        await sql`
          INSERT INTO platform_invoices(
            org_id, amount, currency, status, plan_type, period_start, period_end, razorpay_payment_id, invoice_url
          )
          VALUES(
            ${orgId},
            ${amount},
            ${currency},
            'paid',
            ${plan.orgPlanType},
            ${periodStart.toISOString()},
            ${periodEnd.toISOString()},
            ${invoiceRef},
            ${tx?.checkout?.url || null}
          )
        `;
      }
    } catch (invoiceError: any) {
      console.warn("[Paddle/Complete] Invoice write skipped:", invoiceError?.message || invoiceError);
    }

    return NextResponse.json({
      success: true,
      planType: plan.orgPlanType,
      subscriptionStatus: "active",
      planExpiresAt: periodEnd.toISOString(),
    });
  } catch (error: any) {
    console.error("[Paddle/Complete] Error:", error?.message || error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
