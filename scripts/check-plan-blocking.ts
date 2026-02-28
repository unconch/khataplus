import { sql } from "../lib/db";
import { hasPlanFeature } from "../lib/plan-feature-guard";
import { NextRequest } from "next/server";
import { GET as reportsGET } from "../app/api/reports/route";
import { POST as migrationCustomersPOST } from "../app/api/migration/customers/route";

async function main() {
  const orgs = await sql`SELECT id, plan_type FROM organizations ORDER BY created_at DESC LIMIT 50`;
  const freeOrg = orgs.find((o: any) => String(o.plan_type || "free").toLowerCase() === "free");
  const starterOrg = orgs.find((o: any) => String(o.plan_type || "").toLowerCase() === "starter");
  const proOrg = orgs.find((o: any) => String(o.plan_type || "").toLowerCase() === "pro");

  console.log("=== Plan Matrix (pure function) ===");
  console.log("free->reports:", hasPlanFeature("free", "reports"));
  console.log("starter->reports:", hasPlanFeature("starter", "reports"));
  console.log("starter->analytics:", hasPlanFeature("starter", "analytics_dashboard"));
  console.log("pro->analytics:", hasPlanFeature("pro", "analytics_dashboard"));
  console.log("free->migration:", hasPlanFeature("free", "migration_import"));
  console.log("starter->migration:", hasPlanFeature("starter", "migration_import"));

  if (freeOrg) {
    console.log("\n=== Runtime checks on FREE org ===", freeOrg.id);
    const reportsReq = new NextRequest(`http://local/api/reports?orgId=${freeOrg.id}&range=month`);
    const reportsRes = await reportsGET(reportsReq);
    const reportsBody = await reportsRes.json();
    console.log("reports status:", reportsRes.status, "body:", reportsBody);

    const migrationReq = new Request("http://local/api/migration/customers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orgId: freeOrg.id, data: [] }),
    });
    const migrationRes = await migrationCustomersPOST(migrationReq as any);
    const migrationBody = await migrationRes.json();
    console.log("migration(customers) status:", migrationRes.status, "body:", migrationBody);
  } else {
    console.log("\nNo free-plan org found in DB for runtime 403 check.");
  }

  if (starterOrg) {
    console.log("\n=== Runtime checks on STARTER org ===", starterOrg.id);
    const reportsReq = new NextRequest(`http://local/api/reports?orgId=${starterOrg.id}&range=month`);
    const reportsRes = await reportsGET(reportsReq);
    console.log("reports status:", reportsRes.status);
  }

  if (proOrg) {
    console.log("\n=== Runtime check on PRO org ===", proOrg.id);
    console.log("pro analytics allowed:", hasPlanFeature("pro", "analytics_dashboard"));
  }
}

main().catch((e) => {
  console.error("CHECK_FAILED", e?.message || e);
  process.exit(1);
});
