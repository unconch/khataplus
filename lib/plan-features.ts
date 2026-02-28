import { normalizeOrganizationPlanType, type OrganizationPlanType } from "@/lib/billing-plans";

export type PlanFeature =
  | "analytics_dashboard"
  | "reports"
  | "migration_import"
  | "public_shop_profile";

const PLAN_RANK: Record<OrganizationPlanType, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  business: 3,
  legacy: 3,
};

const FEATURE_MIN_PLAN: Record<PlanFeature, OrganizationPlanType> = {
  analytics_dashboard: "pro",
  reports: "starter",
  migration_import: "starter",
  public_shop_profile: "pro",
};

export function formatPlanLabel(planType?: string | null): string {
  const p = normalizeOrganizationPlanType(planType);
  if (p === "free") return "Keep";
  if (p === "starter") return "Starter";
  if (p === "pro") return "Pro";
  if (p === "business") return "Business";
  return "Legacy";
}

export function hasPlanFeature(planType: string | null | undefined, feature: PlanFeature): boolean {
  const normalized = normalizeOrganizationPlanType(planType);
  return PLAN_RANK[normalized] >= PLAN_RANK[FEATURE_MIN_PLAN[feature]];
}

export function getRequiredPlanForFeature(feature: PlanFeature): OrganizationPlanType {
  return FEATURE_MIN_PLAN[feature];
}
