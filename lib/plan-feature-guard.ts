import { sql } from "@/lib/db";
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

export class PlanFeatureError extends Error {
  readonly status: number;
  readonly code: string;
  readonly feature: PlanFeature;
  readonly requiredPlan: OrganizationPlanType;
  readonly currentPlan: OrganizationPlanType;

  constructor(feature: PlanFeature, requiredPlan: OrganizationPlanType, currentPlan: OrganizationPlanType) {
    super(`Feature "${feature}" requires ${formatPlanLabel(requiredPlan)} plan or higher.`);
    this.name = "PlanFeatureError";
    this.status = 403;
    this.code = "PLAN_FEATURE_LOCKED";
    this.feature = feature;
    this.requiredPlan = requiredPlan;
    this.currentPlan = currentPlan;
  }
}

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

export async function requirePlanFeature(orgId: string, feature: PlanFeature): Promise<void> {
  if (!orgId || orgId === "demo-org") return;

  const rows = await sql`SELECT plan_type FROM organizations WHERE id = ${orgId} LIMIT 1`;
  const currentPlan = normalizeOrganizationPlanType(rows[0]?.plan_type);
  const requiredPlan = FEATURE_MIN_PLAN[feature];

  if (PLAN_RANK[currentPlan] < PLAN_RANK[requiredPlan]) {
    throw new PlanFeatureError(feature, requiredPlan, currentPlan);
  }
}
