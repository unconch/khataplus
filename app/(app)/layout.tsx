import type React from "react"
import { AuthGuard } from "@/components/auth-guard"
import { AppShell } from "@/components/app-shell"
import { BiometricGate } from "@/components/biometric-gate"
import type { Profile } from "@/lib/types"
import { session } from "@descope/nextjs-sdk/server"
import { Suspense } from "react"
import { LoadingScreen } from "@/components/loading-screen"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingScreen message="Initializing Platinum Environment..." />}>
      <AppLayoutLogic>
        {children}
      </AppLayoutLogic>
    </Suspense>
  )
}

async function AppLayoutLogic({ children }: { children: React.ReactNode }) {
  try {
    const sessionRes = await session()
    const userId = sessionRes?.token?.sub
    const userToken = sessionRes?.token

    console.log("--- [DEBUG] AppLayoutLogic Execution: Render Phase - Fixing Stale Cache ---")
    const { getProfile, upsertProfile, getSystemSettings, getUserOrganizations } = await import("@/lib/data")
    const { getTenant } = await import("@/lib/tenant")
    const { TenantProvider } = await import("@/components/tenant-provider")
    const { RealtimeSyncActivator } = await import("@/components/realtime-sync-activator")
    const { migrateOrCreateUser } = await import("@/lib/migrate-user")

    // Parallelize initial critical fetches
    const [subdomainTenant, profileResult, userOrgsResult] = await Promise.all([
      getTenant(),
      userId ? getProfile(userId) : Promise.resolve(null),
      userId ? getUserOrganizations(userId) : Promise.resolve([])
    ])

    const headersList = await headers()
    const pathPrefix = headersList.get("x-path-prefix") || ""
    const xInvokePath = headersList.get("x-invoke-path") || ""

    if (!userId) {
      // Check for Guest Mode
      const { isGuestMode } = await import("@/lib/data/auth")
      const isGuest = await isGuestMode()

      if (isGuest) {
        console.log("--- [DEBUG] Guest Mode Detected: Bypassing AuthGuard ---")
        const { sql } = await import("@/lib/db")
        const orgs = await sql`SELECT * FROM organizations LIMIT 1`
        let demoTenant = orgs[0]

        if (!demoTenant) {
          demoTenant = {
            id: "demo-org-id",
            name: "KhataPlus Demo Shop",
            slug: "demo-shop"
          }
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

      // Fallback for public or unauthenticated
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
    const email = userToken?.email as string || userToken?.loginId as string || ""
    const name = userToken?.name as string || ""

    if (!profile) {
      const migrationResult = await migrateOrCreateUser(userId, email, name)
      profile = migrationResult.profile as Profile
    }

    // Handle missing organization with cache resilience
    if (userOrgs.length === 0) {
      // If we are already on an org-prefixed path, don't redirect back to setup
      // This handles the race condition during onboarding where the first hit after creation 
      // might see a stale empty org list while the URL already has the slug.
      if (!pathPrefix || pathPrefix === "/setup-organization") {
        console.log("--- [DEBUG] AppLayout: No Orgs and no path prefix -> Redirecting to Setup ---")
        redirect("/setup-organization")
      } else {
        console.log("--- [DEBUG] AppLayout: Stale cache detected (No Orgs but path prefix exists). Waiting for revalidation... ---")
        // We allow it to proceed; if the tenant fetch fails later, it will hit the catch block.
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

    if (orgRole !== "admin" && orgRole !== "owner" && xInvokePath.includes("/dashboard/admin")) {
      redirect("/dashboard")
    }

    return (
      <>
        <RealtimeSyncActivator orgId={orgId} />
        <BiometricGate isRequired={profile?.biometric_required || false}>
          <TenantProvider tenant={tenant}>
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
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity font-medium"
        >
          Retry Connection
        </button>
      </div>
    )
  }
}
