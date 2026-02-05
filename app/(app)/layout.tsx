import type React from "react"
import { AuthGuard } from "@/components/auth-guard"
import { AppShell } from "@/components/app-shell"
import { BiometricGate } from "@/components/biometric-gate"
import type { Profile } from "@/lib/types"
import { session } from "@descope/nextjs-sdk/server"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Initializing Platinum Environment...</p>
        </div>
      </div>
    }>
      <AppLayoutLogic>
        {children}
      </AppLayoutLogic>
    </Suspense>
  )
}

async function AppLayoutLogic({ children }: { children: React.ReactNode }) {
  const currSession = await session()
  const userId = (currSession as any)?.token?.sub || (currSession as any)?.user?.userId

  const { getProfile, upsertProfile, getSystemSettings, getUserOrganizations } = await import("@/lib/data")
  const { getTenant } = await import("@/lib/tenant")
  const { TenantProvider } = await import("@/components/tenant-provider")

  // 1. Resolve Tenant from Subdomain
  const subdomainTenant = await getTenant()

  if (userId) {
    let profile = await getProfile(userId)

    const descopeUser = (currSession as any)?.user || (currSession as any)?.token?.user || {}
    const token = (currSession as any)?.token || {}

    const email = descopeUser.email || token.email || (descopeUser as any).loginId || ""
    const name = descopeUser.name || descopeUser.givenName || descopeUser.fullName || token.name || token.given_name || token.family_name || ""

    if (!profile) {
      profile = await upsertProfile({
        id: userId,
        email: email,
        name: name,
        role: "staff" as any,
        status: "approved",
        biometric_required: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    } else if (profile && (name !== profile.name || email !== profile.email)) {
      profile = await upsertProfile({
        ...profile,
        name: name || profile.name,
        email: email || profile.email,
        updated_at: new Date().toISOString(),
      })
    }

    // 2. Resolve Organization Membership
    const { redirect } = await import("next/navigation")
    const userOrgs = await getUserOrganizations(userId)

    if (userOrgs.length === 0) {
      // No org - redirect to setup
      redirect("/setup-organization")
    }

    // Resolve current organization context
    // If we're on a tenant subdomain, use that. Otherwise use the user's first org.
    let currentOrgMembership = null

    if (subdomainTenant) {
      currentOrgMembership = userOrgs.find(o => o.org_id === subdomainTenant.id)
      if (!currentOrgMembership) {
        // User is not a member of the organization identified by the subdomain
        // For now, redirect to their default org or an error page
        // redirect(`https://${userOrgs[0].organization.slug}.localhost:3000/home`) // In prod: khataplus.com
        // For this implementation, we'll just show forbidden if they are on the wrong subdomain
        throw new Error(`Forbidden: You are not a member of ${subdomainTenant.name}`)
      }
    } else {
      currentOrgMembership = userOrgs[0]
    }

    const orgRole = currentOrgMembership.role // admin, manager, or staff
    const orgId = currentOrgMembership.org_id
    const tenant = currentOrgMembership.organization

    // Fetch per-org settings
    const settings = await getSystemSettings(orgId)

    // Role-based route protection based on org role
    const headersList = await (await import("next/headers")).headers()
    const path = headersList.get("x-invoke-path") || ""

    if (orgRole === "staff") {
      if (path.includes("/home/analytics") && !settings.allow_staff_analytics) redirect("/home")
      if (path.includes("/home/reports") && !settings.allow_staff_reports) redirect("/home")
      if (path.includes("/home/sales") && !settings.allow_staff_sales) redirect("/home")
    }

    // Only admin can access admin/settings pages
    if (orgRole !== "admin" && path.includes("/home/admin")) {
      redirect("/home")
    }

    return (
      <AuthGuard>
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
      </AuthGuard>
    )
  }

  // Fallback for public or unauthenticated (though AuthGuard usually handles this)
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
