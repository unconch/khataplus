export type BillingCycle = "monthly" | "yearly";
export type BillingPlanKey = "keep" | "starter" | "pro" | "business";
export type OrganizationPlanType = "free" | "starter" | "pro" | "business" | "legacy";

export interface BillingPlanConfig {
  key: BillingPlanKey;
  displayName: string;
  orgPlanType: OrganizationPlanType;
  durationMonths: Record<BillingCycle, number>;
  amountInr: Record<BillingCycle, number>;
  envPriceKey: Record<BillingCycle, string>;
}

export const BILLING_PLANS: Record<BillingPlanKey, BillingPlanConfig> = {
  keep: {
    key: "keep",
    displayName: "Keep",
    orgPlanType: "free",
    durationMonths: { monthly: 1, yearly: 12 },
    amountInr: { monthly: 49, yearly: 399 },
    envPriceKey: {
      monthly: "PADDLE_PRICE_KEEP_MONTHLY",
      yearly: "PADDLE_PRICE_KEEP_YEARLY",
    },
  },
  starter: {
    key: "starter",
    displayName: "Starter",
    orgPlanType: "starter",
    durationMonths: { monthly: 1, yearly: 12 },
    amountInr: { monthly: 179, yearly: 1499 },
    envPriceKey: {
      monthly: "PADDLE_PRICE_STARTER_MONTHLY",
      yearly: "PADDLE_PRICE_STARTER_YEARLY",
    },
  },
  pro: {
    key: "pro",
    displayName: "Pro",
    orgPlanType: "pro",
    durationMonths: { monthly: 1, yearly: 12 },
    amountInr: { monthly: 449, yearly: 3999 },
    envPriceKey: {
      monthly: "PADDLE_PRICE_PRO_MONTHLY",
      yearly: "PADDLE_PRICE_PRO_YEARLY",
    },
  },
  business: {
    key: "business",
    displayName: "Business",
    orgPlanType: "business",
    durationMonths: { monthly: 1, yearly: 12 },
    amountInr: { monthly: 899, yearly: 7999 },
    envPriceKey: {
      monthly: "PADDLE_PRICE_BUSINESS_MONTHLY",
      yearly: "PADDLE_PRICE_BUSINESS_YEARLY",
    },
  },
};

export function isBillingCycle(value: string): value is BillingCycle {
  return value === "monthly" || value === "yearly";
}

export function isBillingPlanKey(value: string): value is BillingPlanKey {
  return value in BILLING_PLANS;
}

export function getPlanPriceId(planKey: BillingPlanKey, cycle: BillingCycle): string | null {
  const key = BILLING_PLANS[planKey].envPriceKey[cycle];
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : null;
}

export function getPlanAmountInr(planKey: BillingPlanKey, cycle: BillingCycle): number {
  return BILLING_PLANS[planKey].amountInr[cycle];
}

const PLAN_LIMITS: Record<OrganizationPlanType, { staffSeats: number | null; inventoryItems: number | null }> = {
  free: { staffSeats: 1, inventoryItems: 30 },
  starter: { staffSeats: 3, inventoryItems: 200 },
  pro: { staffSeats: 10, inventoryItems: null },
  business: { staffSeats: null, inventoryItems: null },
  legacy: { staffSeats: null, inventoryItems: null },
};

export function normalizeOrganizationPlanType(value?: string | null): OrganizationPlanType {
  const raw = String(value || "free").toLowerCase();
  if (raw === "starter" || raw === "pro" || raw === "business" || raw === "legacy") return raw;
  return "free";
}

export function getStaffSeatLimit(planType?: string | null): number | null {
  return PLAN_LIMITS[normalizeOrganizationPlanType(planType)].staffSeats;
}

export function getInventoryItemLimit(planType?: string | null): number | null {
  return PLAN_LIMITS[normalizeOrganizationPlanType(planType)].inventoryItems;
}
