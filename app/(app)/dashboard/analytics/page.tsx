import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

export default async function AnalyticsPage() {
  const { getCurrentUser, getCurrentOrgId, getDailyReports } = await import("@/lib/data")
  const { requirePlanFeature, PlanFeatureError } = await import("@/lib/plan-feature-guard")
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

  try {
    await requirePlanFeature(orgId as string, "analytics_dashboard")
  } catch (e: any) {
    const { redirect } = await import("next/navigation")
    if (e instanceof PlanFeatureError) {
      redirect("/pricing")
      return null
    }
    throw e
  }

  const dailyReports = await getDailyReports(orgId as string)

  return (
    <div className="min-h-full space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pt-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
            Financial <span className="text-amber-600">Analytics</span>
          </h1>
          <p className="text-sm font-medium text-muted-foreground">Monitor your business performance and trends</p>
        </div>
      </div>

      <Suspense fallback={
        <div className="h-[600px] w-full flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-3xl animate-pulse border">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground/20" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Calculating Insights</p>
          </div>
        </div>
      }>
        <div className="space-y-8">
          <AnalyticsDashboard reports={dailyReports} />
        </div>
      </Suspense>
    </div>
  )
}
