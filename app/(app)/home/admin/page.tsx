import { redirect } from "next/navigation"
import type { Profile } from "@/lib/types"
import { UserManagement } from "@/components/user-management"
import { SystemManagement } from "@/components/system-management"
import { ActivityLogs } from "@/components/activity-logs"
import { SystemAlerts } from "@/components/system-alerts"
import { BusinessPulse } from "@/components/business-pulse"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { session } from "@descope/nextjs-sdk/server"
import { getProfiles, getSystemSettings, getAuditLogs, getDailyPulse } from "@/lib/data"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

export default function AdminPage() {
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
        <AdminContent />
      </Suspense>
    </div>
  )
}

async function AdminContent() {
  // Check if user is admin using Descope session ONLY
  const currSession = await session()

  if (!currSession) {
    redirect("/auth/login")
  }

  const userId = (currSession as any)?.token?.sub || (currSession as any)?.user?.userId

  const roles = (currSession as any)?.token?.roles ||
    (currSession as any)?.sessionToken?.roles ||
    (currSession as any)?.user?.roleNames ||
    (currSession as any)?.user?.roles || []

  const isMainAdmin = roles.includes("main admin")

  if (!isMainAdmin) {
    redirect("/home")
  }

  const { getCurrentOrgId, getProfiles, getSystemSettings, getAuditLogs, getDailyPulse } = await import("@/lib/data")
  const orgId = await getCurrentOrgId(userId)

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

      <Tabs defaultValue="users" className="w-full">
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
