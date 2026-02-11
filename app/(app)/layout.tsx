import type React from "react"
import { AuthGuard } from "@/components/auth-guard"
import { AppShell } from "@/components/app-shell"
import { BiometricGate } from "@/components/biometric-gate"
import type { Profile } from "@/lib/types"
import { session } from "@descope/nextjs-sdk/server"
import { Suspense } from "react"
import { LoadingScreen } from "@/components/loading-screen"

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
    const { redirect } = await import("next/navigation")
    const { RealtimeSyncActivator } = await import("@/components/realtime-sync-activator")
    const { migrateOrCreateUser } = await import("@/lib/migrate-user")

    // Parallelize initial critical fetches
    const [subdomainTenant, profileResult, userOrgsResult] = await Promise.all([
      getTenant(),
      userId ? getProfile(userId) : Promise.resolve(null),
      userId ? getUserOrganizations(userId) : Promise.resolve([])
    ])

    if (!userId) {
      // Check for Guest Mode
      const { cookies, headers } = await import("next/headers")
      const cookieStore = await cookies()
      const headerList = await headers()

      const { isGuestMode } = await import("@/lib/data/auth")
      const isGuest = await isGuestMode()

      console.log(`--- [DEBUG] Layout: isGuest=${isGuest} (Cookie: ${cookieStore.has("guest_mode")}) ---`)

      if (isGuest) {
        console.log("--- [DEBUG] Guest Mode Detected: Bypassing AuthGuard ---")
        const defaultSettings = await getSystemSettings()

        const guestProfile: any = {
          id: "guest-user",
          name: "Guest User",
          email: "guest@khataplus.demo",
          role: "admin",
          status: "approved",
          created_at: new Date().toISOString()
        }

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
              profile={guestProfile}
              role="admin"
              settings={demoSettings}
              orgId={demoTenant.id}
              orgName={demoTenant.name}
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
            <AppShell profile={null} role="staff" settings={defaultSettings}>
              {children}
            </AppShell>
          </TenantProvider>
        </AuthGuard>
      )
    }

    let profile = profileResult
    const userOrgs = userOrgsResult

    // Handle Profile Creation/Update using Descope user data
    const email = userToken?.email as string || userToken?.loginId as string || ""
    const name = userToken?.name as string || ""

    if (!profile) {
      // Try migration first, then create if needed
      const migrationResult = await migrateOrCreateUser(userId, email, name)
      profile = migrationResult.profile as Profile
    } else if (profile && (name !== profile.name || email !== profile.email)) {
      profile = await upsertProfile({
        ...profile,
        name: name || profile.name,
        email: email || profile.email,
        updated_at: new Date().toISOString(),
      })
    }

    // Refetch orgs after potential migration
    const updatedUserOrgs = userOrgs.length === 0 ? await getUserOrganizations(userId) : userOrgs

    if (updatedUserOrgs.length === 0) {
      redirect("/setup-organization")
    }

    // Resolve current organization context
    let currentOrgMembership = null

    if (subdomainTenant) {
      currentOrgMembership = updatedUserOrgs.find((o: any) => o.org_id === subdomainTenant.id)
      if (!currentOrgMembership) {
        throw new Error(`Forbidden: You are not a member of ${subdomainTenant.name}`)
      }
    } else {
      currentOrgMembership = updatedUserOrgs[0]
    }

    const orgRole = currentOrgMembership.role
    const orgId = currentOrgMembership.org_id
    const tenant = currentOrgMembership.organization

    // Fetch settings for the resolved org
    const settings = await getSystemSettings(orgId)

    // Role-based route protection
    const headersList = await (await import("next/headers")).headers()
    const path = headersList.get("x-invoke-path") || ""

    if (orgRole === "staff") {
      if (path.includes("/dashboard/analytics") && !settings.allow_staff_analytics) {
        redirect("/dashboard")
      }
      if (path.includes("/dashboard/reports") && !settings.allow_staff_reports) {
        redirect("/dashboard")
      }
      if (path.includes("/dashboard/sales") && !settings.allow_staff_sales) {
        redirect("/dashboard")
      }
    }

    if (orgRole !== "admin" && path.includes("/dashboard/admin")) {
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
            >
              {children}
            </AppShell>
          </TenantProvider>
        </BiometricGate>
      </>
    )

  } catch (error: any) {
    if (error.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Critical Data Fetch Error in AppLayout:", error);
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <h2 className="text-2xl font-bold mb-2">Connection Error</h2>
        <p className="text-muted-foreground mb-4 max-w-md">
          We couldn't load your account data. This might be a network issue or a database timeout.
        </p>
        <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm font-mono mb-6 max-w-lg break-all">
          {String(error)}
        </div>
        <form action={async () => {
          "use server"
          const { redirect } = await import("next/navigation")
          redirect("/dashboard")
        }}>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity font-medium">
            Retry Connection
          </button>
        </form>
      </div>
    )
  }
}
