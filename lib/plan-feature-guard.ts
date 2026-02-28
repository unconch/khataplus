import { sql } from "@/lib/db";
import { normalizeOrganizationPlanType, type OrganizationPlanType } from "@/lib/billing-plans";
import { type PlanFeature, formatPlanLabel, getRequiredPlanForFeature, hasPlanFeature } from "@/lib/plan-features";

export { hasPlanFeature, getRequiredPlanForFeature, formatPlanLabel, type PlanFeature } from "@/lib/plan-features";

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

export async function requirePlanFeature(orgId: string, feature: PlanFeature): Promise<void> {
  if (!orgId || orgId === "demo-org") return;

  const rows = await sql`SELECT plan_type FROM organizations WHERE id = ${orgId} LIMIT 1`;
  const currentPlan = normalizeOrganizationPlanType(rows[0]?.plan_type);
  const requiredPlan = getRequiredPlanForFeature(feature);

  if (!hasPlanFeature(currentPlan, feature)) {
    throw new PlanFeatureError(feature, requiredPlan, currentPlan);
  }
}
