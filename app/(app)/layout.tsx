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
    const { getSession } = await import("@/lib/session")
    const sessionRes = await getSession()
    const userId = sessionRes?.userId

    console.log("--- [DEBUG] AppLayoutLogic Execution: Render Phase - Fixing Stale Cache ---")
    const { getProfile, upsertProfile, getSystemSettings, getUserOrganizations, ensureProfile } = await import("@/lib/data")
    const { getTenant } = await import("@/lib/tenant")
    const { TenantProvider } = await import("@/components/tenant-provider")
    const { RealtimeSyncActivator } = await import("@/components/realtime-sync-activator")

    // Parallelize initial critical fetches
    const [subdomainTenant, profileResult, userOrgsResult] = await Promise.all([
      getTenant(),
      userId ? getProfile(userId) : Promise.resolve(null),
      userId ? getUserOrganizations(userId) : Promise.resolve([])
    ])

    const headersList = await headers()
    const pathPrefix = headersList.get("x-path-prefix") || ""
    const xInvokePath = headersList.get("x-invoke-path") || ""

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
    const userOrgs = userOrgsResult

    // Handle Profile Creation/Update
    const user = sessionRes?.user
    const email = sessionRes?.email || user?.email || ""
    const name = (user?.user_metadata?.full_name as string) || (user?.user_metadata?.name as string) || ""

    if (!profile) {
      profile = await ensureProfile(userId, email, name)
    }

    // Handle missing organization with cache resilience
    if (userOrgs.length === 0) {
      // If the profile already has an organization_id, we should try to use it
      // before giving up and redirecting to setup.
      if (profile?.organization_id) {
        console.log("--- [DEBUG] AppLayout: userOrgs empty but profile has org_id. Attempting recovery... ---")
        const { getOrganization } = await import("@/lib/data/organizations")
        const org = await getOrganization(profile.organization_id)
        if (org) {
          console.log(`--- [DEBUG] AppLayout: Recovered org context for ${org.slug}. Skipping setup redirect. ---`)
          // We don't have the membership role here, so we'll default to 'admin' (or fetch it)
          // But actually, if we are in this block, it's safer to just NOT redirect and let 
          // the downstream logic handle it (which it will, by trying to find the membership later).
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
