import type React from "react"
import { AuthGuard } from "@/components/auth-guard"
import { AppShell } from "@/components/app-shell"
import type { Profile, Organization } from "@/lib/types"
import { Suspense } from "react"
import { AppShellSkeleton } from "@/components/skeletons"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <AppShellSkeleton />
      }
    >
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

    const { getCurrentUser, isGuestMode } = await import("@/lib/data/auth")
    const { hasPlanFeature } = await import("@/lib/plan-features")
    const headersList = await headers()
    const pathPrefix = headersList.get("x-path-prefix") || ""
    const xInvokePath = headersList.get("x-invoke-path") || ""
    const isGuest = await isGuestMode()

    if (isGuest) {
      console.log("--- [DEBUG] Guest Mode Active: Rendering Sandbox Shell ---")
      const { getSystemSettings } = await import("@/lib/data")
      const { getDemoSql } = await import("@/lib/db")
      const { TenantProvider } = await import("@/components/tenant-provider")
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
      const guestPathPrefix = ""

      return (
        <TenantProvider tenant={demoTenant}>
          <AppShell
            profile={null}
            role="admin"
            settings={demoSettings}
            orgId={demoTenant.id}
            orgName={demoTenant.name}
            orgSlug={demoTenant.slug}
            orgPlanType="business"
            pathPrefix={guestPathPrefix}
          >
            {children}
          </AppShell>
        </TenantProvider>
      )
    }

    const currentUser = await getCurrentUser()
    const userId = currentUser?.userId

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
    const email = currentUser?.email || `user_${userId}@local.invalid`
    const name = ""

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
      } else if (!pathPrefix || pathPrefix === "/onboarding") {
        console.log("--- [DEBUG] AppLayout: No Orgs and no path prefix -> Redirecting to Onboarding ---")
        redirect("/onboarding")
      } else {
        console.log("--- [DEBUG] AppLayout: Stale cache detected (No Orgs but path prefix exists). Waiting for revalidation... ---")
      }
    }

    // Resolve current organization context
    let currentOrgMembership = null

    if (subdomainTenant) {
      currentOrgMembership = userOrgs.find((o: any) => o.org_id === subdomainTenant.id)
      if (!currentOrgMembership) {
        const { logAccessBlockedAttempt } = await import("@/lib/monitoring")
        await logAccessBlockedAttempt({
          userId,
          userEmail: email,
          tenantId: subdomainTenant.id,
          tenantName: subdomainTenant.name,
          tenantSlug: subdomainTenant.slug,
          requestPath: xInvokePath,
          pathPrefix,
        })
        throw new Error(`Forbidden: You are not a member of ${subdomainTenant.name}`)
      }
    } else {
      currentOrgMembership = userOrgs[0]
    }

    if (!currentOrgMembership) {
      console.log("--- [DEBUG] AppLayout: No organization membership found. Redirecting to onboarding. ---")
      redirect("/onboarding")
      return null // Ensure execution stops
    }

    const orgRole = currentOrgMembership.role
    const orgId = currentOrgMembership.org_id
    let tenant = currentOrgMembership.organization || null

    if (!tenant && orgId) {
      const { getOrganization } = await import("@/lib/data/organizations")
      tenant = await getOrganization(orgId)
    }

    if (!tenant) {
      console.log("--- [DEBUG] AppLayout: Organization membership found but organization record was missing. Redirecting to onboarding. ---")
      redirect("/onboarding")
      return null
    }

    const settings = await getSystemSettings(orgId)
    const resolvedPathPrefix = pathPrefix || (tenant?.slug ? `/app/${tenant.slug}` : "")

    const wantsAnalytics = xInvokePath.includes("/analytics")
    const wantsReports = xInvokePath.includes("/reports")
    const wantsMigration = xInvokePath.includes("/migration")
    const wantsSales = xInvokePath.includes("/sales") || xInvokePath.includes("/pos")

    // Role-based route protection
    if (orgRole === "staff") {
      if (wantsAnalytics && !settings.allow_staff_analytics) redirect("/dashboard")
      if (wantsReports && !settings.allow_staff_reports) redirect("/dashboard")
      if (wantsSales && !settings.allow_staff_sales) redirect("/dashboard")
    }

    if (orgRole !== "owner" && xInvokePath.includes("/dashboard/admin")) {
      redirect("/dashboard")
    }

    const planType = String(tenant?.plan_type || "free")
    if (wantsAnalytics && !hasPlanFeature(planType, "analytics_dashboard")) redirect("/pricing")
    if (wantsReports && !hasPlanFeature(planType, "reports")) redirect("/pricing")
    if (wantsMigration && !hasPlanFeature(planType, "migration_import")) redirect("/pricing")

    const { TrialExpiredGuard } = await import("@/components/trial-expired-guard")

    return (
      <>
        <RealtimeSyncActivator orgId={orgId} />
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
              orgSlug={tenant.slug}
              orgPlanType={tenant.plan_type}
              pathPrefix={resolvedPathPrefix}
            >
              {children}
            </AppShell>
          </TrialExpiredGuard>
        </TenantProvider>
      </>
    )

  } catch (error: any) {
    if (error.digest?.startsWith("NEXT_REDIRECT")) throw error
    console.error("Critical Data Fetch Error in AppLayout:", error)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
        <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-zinc-200/70 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] p-8 text-center shadow-[0_36px_120px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(24,24,27,0.98),rgba(10,10,12,0.98))] dark:shadow-[0_36px_120px_rgba(0,0,0,0.56)] sm:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(244,63,94,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_28%)] dark:bg-[radial-gradient(circle_at_top,rgba(244,63,94,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_28%)]" />
          <div className="relative">
            <div className="mx-auto mb-6 flex h-18 w-18 items-center justify-center rounded-[1.75rem] bg-[linear-gradient(180deg,#111827,#1f2937)] text-white shadow-[0_20px_50px_rgba(15,23,42,0.24)] dark:bg-[linear-gradient(180deg,rgba(244,63,94,0.2),rgba(127,29,29,0.28))]">
              <span className="text-4xl font-black leading-none">!</span>
            </div>
            <div className="mx-auto mb-4 inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.28em] text-rose-700 dark:bg-rose-500/12 dark:text-rose-300">
              Access Blocked
            </div>
            <h2 className="mx-auto max-w-lg text-balance text-4xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">
              Connection Error
            </h2>
            <p className="mx-auto mt-6 max-w-xl rounded-[1.5rem] bg-black/[0.03] px-5 py-4 text-lg font-semibold leading-8 text-zinc-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:bg-white/[0.06] dark:text-zinc-100">
              {String(error)}
            </p>
            <p className="mx-auto mt-5 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Refresh to retry.
            </p>
          </div>
        </div>
      </div>
    )
  }
}
