import { LandingPage } from "@/components/landing-page"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export default async function MarketingHome() {
  const cookieStore = await cookies()
  const isGuest = cookieStore.get("guest_mode")?.value === "true"

  return (
    <LandingPage
      isAuthenticated={false}
      orgCount={0}
      orgSlug={null}
      isGuest={isGuest}
    />
  )
}
