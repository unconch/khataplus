import { redirect } from "next/navigation"
import type { Profile } from "@/lib/types"
import { UserManagement } from "@/components/user-management"
import { SystemManagement } from "@/components/system-management"
import { ActivityLogs } from "@/components/activity-logs"
import { SystemAlerts } from "@/components/system-alerts"
import { BusinessPulse } from "@/components/business-pulse"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const tab = typeof resolvedParams?.tab === 'string' ? resolvedParams.tab : 'users'

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Admin Panel</h2>
        <p className="text-sm text-muted-foreground">Manage users, system settings, and track activity</p>
      </div>

      <Suspense fallback={
        <div className="h-[400px] w-full flex items-center justify-center bg-muted/20 rounded-xl animate-pulse">
          <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
        </div>
      }>
        <AdminContent tab={tab} />
      </Suspense>
    </div>
  )
}

async function AdminContent({ tab = "users" }: { tab?: string }) {
  const { getCurrentUser, getCurrentOrgId } = await import("@/lib/data/auth")
  const { getProfiles, getProfile } = await import("@/lib/data/profiles")
  const { getSystemSettings } = await import("@/lib/data/organizations")
  const { getAuditLogs } = await import("@/lib/data/audit")
  const { getDailyPulse } = await import("@/lib/data/analytics")

  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
    return null
  }
  const { userId, isGuest } = user

  let isMainAdmin = false
  if (isGuest) {
    isMainAdmin = true // Allow guest to see admin panel
  } else {
    // Check if user is admin using profile from database
    const profile = await getProfile(userId)
    isMainAdmin = profile?.role === "main admin" || profile?.role === "owner"
  }

  if (!isMainAdmin) {
    redirect("/dashboard")
    return null
  }

  let orgId: string | null = null
  if (isGuest) {
    orgId = "demo-org"
  } else {
    orgId = await getCurrentOrgId(userId)
  }

  // Get all users, settings, audit logs and daily pulse
  const [users, systemSettings, auditLogs, dailyPulse] = await Promise.all([
    getProfiles(),
    getSystemSettings(orgId || undefined),
    getAuditLogs(),
    getDailyPulse()
  ])

  return (
    <>
      <BusinessPulse data={dailyPulse} />

      <Tabs defaultValue={tab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 shadow-sm">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="management">Management</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-4">
          <UserManagement users={(users as Profile[]) || []} currentUserId={userId} />
        </TabsContent>
        <TabsContent value="management" className="mt-4">
          <SystemManagement initialSettings={systemSettings} />
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          <ActivityLogs logs={auditLogs} />
        </TabsContent>
        <TabsContent value="health" className="mt-4">
          <SystemAlerts />
        </TabsContent>
      </Tabs>
    </>
  )
}
