import { Navbar } from "@/components/landing-page"
import { SiteFooter } from "@/components/landing-page/SiteFooter"
import { SolutionsSection } from "@/components/landing-page/SolutionsSection"
import { getCurrentUser } from "@/lib/data/auth"

export default async function SolutionsPage() {
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null

  try {
    user = await getCurrentUser()
  } catch {
    user = null
  }

  let orgSlug: string | null = null
  if (user && !user.isGuest) {
    try {
      const { getUserOrganizations } = await import("@/lib/data/organizations")
      const orgs = await getUserOrganizations(user.userId)
      orgSlug = orgs[0]?.organization?.slug || null
    } catch {
      orgSlug = null
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <Navbar
        isAuthenticated={!!user}
        lightMode={true}
        orgSlug={orgSlug}
        isGuest={user?.isGuest}
      />
      <div className="pt-24">
        <SolutionsSection />
      </div>
      <SiteFooter />
    </main>
  )
}
