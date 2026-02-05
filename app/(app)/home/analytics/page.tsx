import { AnalyticsDashboard } from "@/components/analytics-dashboard"

export default async function AnalyticsPage() {
  const { session } = await import("@descope/nextjs-sdk/server")
  const currSession = await session()
  const userId = (currSession as any)?.token?.sub || (currSession as any)?.user?.userId

  if (!userId) {
    const { redirect } = await import("next/navigation")
    redirect("/auth/login")
  }

  const { getCurrentOrgId, getDailyReports } = await import("@/lib/data")
  const orgId = await getCurrentOrgId(userId)

  if (!orgId) {
    const { redirect } = await import("next/navigation")
    redirect("/setup-organization")
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
