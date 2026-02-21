import { sql } from "@/lib/db";
import { BILLING_PLANS, isBillingCycle, isBillingPlanKey } from "@/lib/billing-plans";

const CASHFREE_API_VERSION = "2023-08-01";

type CashfreeEnvironment = "sandbox" | "production";

interface CashfreeOrderResponse {
  order_id: string;
  order_status: string;
  order_amount: number | string;
  order_currency?: string;
  order_tags?: Record<string, unknown>;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function getCashfreeEnvironment(): CashfreeEnvironment {
  const raw = String(
    process.env.CASHFREE_ENV ||
      process.env.NEXT_PUBLIC_CASHFREE_ENV ||
      "sandbox"
  ).toLowerCase();
  return raw === "production" || raw === "live" ? "production" : "sandbox";
}

function getCashfreeBaseUrl(env: CashfreeEnvironment): string {
  return env === "production" ? "https://api.cashfree.com" : "https://sandbox.cashfree.com";
}

function getCashfreeHeaders(): Record<string, string> {
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  if (!appId || !secretKey) {
    throw new Error("Cashfree is not configured (missing CASHFREE_APP_ID or CASHFREE_SECRET_KEY)");
  }

  return {
    "x-client-id": appId,
    "x-client-secret": secretKey,
    "x-api-version": CASHFREE_API_VERSION,
    "Content-Type": "application/json",
  };
}

export async function fetchCashfreeOrder(orderId: string): Promise<CashfreeOrderResponse> {
  const env = getCashfreeEnvironment();
  const baseUrl = getCashfreeBaseUrl(env);
  const response = await fetch(`${baseUrl}/pg/orders/${orderId}`, {
    method: "GET",
    headers: getCashfreeHeaders(),
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      data?.message ||
      data?.error?.message ||
      data?.error?.description ||
      "Failed to fetch Cashfree order";
    throw new Error(message);
  }
  return data as CashfreeOrderResponse;
}

export async function activatePlanFromCashfreeOrder(orderId: string, expectedOrgId?: string) {
  const order = await fetchCashfreeOrder(orderId);
  const status = String(order.order_status || "").toUpperCase();
  if (status !== "PAID") {
    throw new Error(`Order is not paid yet (${status || "UNKNOWN"})`);
  }

  const tags = order.order_tags || {};
  const orgId = String(tags.org_id || "").trim();
  const planKey = String(tags.plan_key || "").toLowerCase();
  const cycle = String(tags.billing_cycle || "").toLowerCase();

  if (!orgId) throw new Error("Missing org_id in Cashfree order tags");
  if (!isBillingPlanKey(planKey) || !isBillingCycle(cycle)) {
    throw new Error("Invalid plan metadata in Cashfree order");
  }
  if (expectedOrgId && expectedOrgId !== orgId) {
    throw new Error("Order organization mismatch");
  }

  const plan = BILLING_PLANS[planKey];
  const periodStart = new Date();
  const periodEnd = addMonths(periodStart, plan.durationMonths[cycle]);
  const invoiceRef = `cashfree:${orderId}`;

  await sql`
    UPDATE organizations
    SET
      plan_type = ${plan.orgPlanType},
      subscription_status = 'active',
      plan_expires_at = ${periodEnd.toISOString()},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${orgId}
  `;

  const amount = Number(order.order_amount || 0);
  const currency = String(order.order_currency || "INR");

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
          NULL
        )
      `;
    }
  } catch (error: any) {
    console.warn("[CashfreeBilling] Invoice write skipped:", error?.message || error);
  }

  return {
    orgId,
    orderId,
    orderStatus: status,
    planType: plan.orgPlanType,
    subscriptionStatus: "active" as const,
    planExpiresAt: periodEnd.toISOString(),
  };
}

export function getCashfreeRequestHeaders() {
  return getCashfreeHeaders();
}

export function getCashfreeOrdersBaseUrl() {
  return `${getCashfreeBaseUrl(getCashfreeEnvironment())}/pg/orders`;
}

export function getCashfreeOrderSessionsUrl() {
  return `${getCashfreeBaseUrl(getCashfreeEnvironment())}/pg/orders/sessions`;
}
