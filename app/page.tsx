import { LandingPage } from "@/components/landing-page"
import { getTotalOrganizationCount } from "@/lib/data/organizations"
import { getCurrentUser } from "@/lib/data/auth"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export default async function Home() {
  const orgCount = await getTotalOrganizationCount()
  const user = await getCurrentUser()
  const cookieStore = await cookies()
  const isGuest = cookieStore.get('guest_mode')?.value === 'true'

  let orgSlug = null
  if (user && !user.isGuest) {
    const { getUserOrganizations } = await import("@/lib/data/organizations")
    const userOrgs = await getUserOrganizations(user.userId).catch(() => [])
    orgSlug = userOrgs?.[0]?.organization?.slug
  }

  return (
    <LandingPage
      isAuthenticated={!!user}
      orgCount={orgCount}
      orgSlug={orgSlug}
      isGuest={user?.isGuest}
    />
  )
}
