import { AnalyticsDashboard } from "@/components/analytics-dashboard"

export default async function AnalyticsPage() {
  const { getCurrentUser, getCurrentOrgId, getDailyReports } = await import("@/lib/data")
  const user = await getCurrentUser()

  if (!user) {
    const { redirect } = await import("next/navigation")
    redirect("/auth/login")
    return null;
  }
  const { userId, isGuest } = user

  let orgId: string | null = null
  if (isGuest) {
    orgId = "demo-org"
  } else {
    orgId = await getCurrentOrgId(userId)
  }

  if (!orgId) {
    const { redirect } = await import("next/navigation")
    redirect("/setup-organization")
    return null;
  }

  const dailyReports = await getDailyReports(orgId as string)

  return (
    <div className="p-4 pb-24 space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Analytics</h2>
        <p className="text-sm text-muted-foreground">Comprehensive financial performance overview</p>
      </div>

      <div className="mt-4">
        <AnalyticsDashboard reports={dailyReports} />
      </div>
    </div>
  )
}
