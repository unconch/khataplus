import { LandingPage } from "@/components/landing-page"

// Fully static — served from cache on every request
export const dynamic = "force-static"

export default function MarketingHome() {
  return (
    <LandingPage
      isAuthenticated={false}
      orgCount={0}
      orgSlug={null}
    />
  )
}
