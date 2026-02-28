import type React from "react"
import { AuthGuard } from "@/components/auth-guard"
import { AppShell } from "@/components/app-shell"
import { BiometricGate } from "@/components/biometric-gate"
import type { Profile, Organization } from "@/lib/types"
import { Suspense } from "react"
import { LoadingScreen } from "@/components/loading-screen"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingScreen message="Initializing KhataPlus..." />}>
      <AppLayoutLogic>
        {children}
      </AppLayoutLogic>
    </Suspense>
  )
}

async function AppLayoutLogic({ children }: { children: React.ReactNode }) {
  try {
    const isDbConnectivityError = (err: any) => {
      const msg = String(err?.message || err || "").toLowerCase()
      return (
        msg.includes("error connecting to database") ||
        msg.includes("fetch failed") ||
        msg.includes("econnreset") ||
        msg.includes("etimedout") ||
        msg.includes("enotfound") ||
        msg.includes("socket hang up")
      )
    }

    const { getSession } = await import("@/lib/session")
    const { hasPlanFeature } = await import("@/lib/plan-feature-guard")
    const sessionRes = await getSession()
    const userId = sessionRes?.userId

    console.log("--- [DEBUG] AppLayoutLogic Execution: Render Phase - Fixing Stale Cache ---")
    const { getProfile, upsertProfile, getSystemSettings, ensureProfile } = await import("@/lib/data")
    const { getUserOrganizationsResolved } = await import("@/lib/data/auth")
    const { getTenant } = await import("@/lib/tenant")
    const { TenantProvider } = await import("@/components/tenant-provider")
    const { RealtimeSyncActivator } = await import("@/components/realtime-sync-activator")

    // Parallelize initial critical fetches with graceful DB outage handling
    let dbUnavailable = false
    const safeFetch = async <T,>(task: () => Promise<T>, fallback: T): Promise<T> => {
      try {
        return await task()
      } catch (err) {
        if (isDbConnectivityError(err)) {
          dbUnavailable = true
          return fallback
        }
        throw err
      }
    }

    const [subdomainTenant, profileResult, userOrgsResult] = await Promise.all([
      safeFetch(() => getTenant(), null as any),
      userId ? safeFetch(() => getProfile(userId), null as any) : Promise.resolve(null),
      userId ? safeFetch(() => getUserOrganizationsResolved(userId), [] as any) : Promise.resolve([])
    ])

    const headersList = await headers()
    const pathPrefix = headersList.get("x-path-prefix") || ""
    const xInvokePath = headersList.get("x-invoke-path") || ""

    if (dbUnavailable) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
          <h2 className="text-2xl font-bold mb-2">Database Connection Issue</h2>
          <p className="text-muted-foreground mb-4 max-w-md">
            Temporary network issue while connecting to database. Please refresh in a few seconds.
          </p>
          <button
            type="button"
            onClick={() => location.reload()}
            className="h-10 px-5 rounded-xl bg-zinc-950 text-white font-bold text-sm"
          >
            Retry
          </button>
        </div>
      )
    }

    // Check for Guest Mode
    const { isGuestMode } = await import("@/lib/data/auth")
    const isGuest = await isGuestMode()

    if (isGuest) {
      console.log("--- [DEBUG] Guest Mode Active: Rendering Sandbox Shell ---")
      const { getDemoSql } = await import("@/lib/db")
      const demoSql = getDemoSql()
      const orgsResult = await demoSql`SELECT * FROM organizations WHERE id = 'demo-org' LIMIT 1`
      let demoTenant = (orgsResult[0] as unknown as Organization) || null

      if (!demoTenant) {
        demoTenant = {
          id: "demo-org",
          name: "KhataPlus Demo Shop",
          slug: "demo",
          created_by: "system",
          created_at: new Date().toISOString()
        } as Organization
      }

      const demoSettings = await getSystemSettings(demoTenant.id)

      return (
        <TenantProvider tenant={demoTenant}>
          <AppShell
            profile={null}
            role="admin"
            settings={demoSettings}
            orgId={demoTenant.id}
            orgName={demoTenant.name}
            orgPlanType="business"
            pathPrefix={pathPrefix}
          >
            {children}
          </AppShell>
        </TenantProvider>
      )
    }

    if (!userId) {
      // Internal AuthGuard for production routes if not authenticated
      const defaultSettings = await getSystemSettings()
      return (
        <AuthGuard>
          <TenantProvider tenant={subdomainTenant}>
            <AppShell profile={null} role="staff" settings={defaultSettings} pathPrefix={pathPrefix}>
              {children}
            </AppShell>
          </TenantProvider>
        </AuthGuard>
      )
    }

    let profile = profileResult
    let userOrgs = userOrgsResult

    // Handle Profile Creation/Update/Consolidation
    const user = sessionRes?.user
    const email = sessionRes?.email || user?.email || `descope_${userId}@local.invalid`
    const name = (user?.name as string) || ""

    if (userId) {
      // Always call ensureProfile to handle consolidation of multiple accounts (Google vs Email)
      profile = await ensureProfile(userId, email, name)

      // If we didn't find organizations initially, re-fetch them after potential migration/consolidation
      if (userOrgs.length === 0) {
        const { getUserOrganizationsResolved } = await import("@/lib/data/auth")
        userOrgs = await getUserOrganizationsResolved(userId)
      }
    }

    // Handle missing organization with cache resilience
    if (userOrgs.length === 0) {
      if (profile?.organization_id) {
        console.log("--- [DEBUG] AppLayout: userOrgs empty but profile has org_id. Attempting recovery... ---")
        const { getOrganization } = await import("@/lib/data/organizations")
        const org = await getOrganization(profile.organization_id)
        if (org) {
          console.log(`--- [DEBUG] AppLayout: Recovered org context for ${org.slug}. Building fallback membership. ---`)
          userOrgs = [{
            id: `fallback-${profile.organization_id}`,
            org_id: profile.organization_id,
            user_id: userId,
            role: (profile.role === "owner" || profile.role === "manager" || profile.role === "staff")
              ? profile.role
              : "owner",
            created_at: new Date().toISOString(),
            organization: org
          }] as any
        }
      } else if (!pathPrefix || pathPrefix === "/setup-organization") {
        console.log("--- [DEBUG] AppLayout: No Orgs and no path prefix -> Redirecting to Setup ---")
        redirect("/setup-organization")
      } else {
        console.log("--- [DEBUG] AppLayout: Stale cache detected (No Orgs but path prefix exists). Waiting for revalidation... ---")
      }
    }

    // Resolve current organization context
    let currentOrgMembership = null

    if (subdomainTenant) {
      currentOrgMembership = userOrgs.find((o: any) => o.org_id === subdomainTenant.id)
      if (!currentOrgMembership) {
        throw new Error(`Forbidden: You are not a member of ${subdomainTenant.name}`)
      }
    } else {
      currentOrgMembership = userOrgs[0]
    }

    if (!currentOrgMembership) {
      console.log("--- [DEBUG] AppLayout: No organization membership found. Redirecting to setup. ---")
      redirect("/setup-organization")
      return null // Ensure execution stops
    }

    const orgRole = currentOrgMembership.role
    const orgId = currentOrgMembership.org_id
    const tenant = currentOrgMembership.organization
    const settings = await getSystemSettings(orgId)

    // Role-based route protection
    if (orgRole === "staff") {
      if (xInvokePath.includes("/dashboard/analytics") && !settings.allow_staff_analytics) redirect("/dashboard")
      if (xInvokePath.includes("/dashboard/reports") && !settings.allow_staff_reports) redirect("/dashboard")
      if (xInvokePath.includes("/dashboard/sales") && !settings.allow_staff_sales) redirect("/dashboard")
    }

    if (orgRole !== "owner" && xInvokePath.includes("/dashboard/admin")) {
      redirect("/dashboard")
    }

    const planType = String(tenant?.plan_type || "free")
    if (xInvokePath.includes("/dashboard/analytics") && !hasPlanFeature(planType, "analytics_dashboard")) {
      redirect("/pricing")
    }
    if (xInvokePath.includes("/dashboard/reports") && !hasPlanFeature(planType, "reports")) {
      redirect("/pricing")
    }
    if (xInvokePath.includes("/dashboard/migration") && !hasPlanFeature(planType, "migration_import")) {
      redirect("/pricing")
    }

    const { TrialExpiredGuard } = await import("@/components/trial-expired-guard")

    return (
      <>
        <RealtimeSyncActivator orgId={orgId} />
        <BiometricGate isRequired={profile?.biometric_required || false}>
          <TenantProvider tenant={tenant}>
            <TrialExpiredGuard
              trialEndsAt={tenant.trial_ends_at || ""}
              subscriptionStatus={tenant.subscription_status || "active"}
              orgName={tenant.name || ""}
            >
              <AppShell
                profile={profile}
                role={orgRole}
                settings={settings}
                orgId={orgId}
                orgName={tenant.name}
                orgPlanType={tenant.plan_type}
                pathPrefix={pathPrefix}
              >
                {children}
              </AppShell>
            </TrialExpiredGuard>
          </TenantProvider>
        </BiometricGate>
      </>
    )

  } catch (error: any) {
    if (error.digest?.startsWith("NEXT_REDIRECT")) throw error
    console.error("Critical Data Fetch Error in AppLayout:", error)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <h2 className="text-2xl font-bold mb-2">Connection Error</h2>
        <p className="text-muted-foreground mb-4 max-w-md">
          {String(error)}
        </p>
        <p className="text-sm text-muted-foreground italic">
          Please refresh the page to retry.
        </p>
      </div>
    )
  }
}
