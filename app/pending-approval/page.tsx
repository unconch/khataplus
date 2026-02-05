import { redirect } from "next/navigation"
import { PendingApprovalView } from "@/components/pending-approval-view"
import { getProfile, getUserOrganizations } from "@/lib/data"
import { session } from "@descope/nextjs-sdk/server"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

export default function PendingApprovalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Verifying Account Status...</p>
        </div>
      </div>
    }>
      <PendingApprovalLogic />
    </Suspense>
  )
}

async function PendingApprovalLogic() {
  const currSession = await session()

  if (!currSession) {
    redirect("/auth/login")
  }

  const userId = (currSession as any)?.token?.sub || (currSession as any)?.user?.userId

  // Check if user has an organization - if not, redirect to setup
  const userOrgs = await getUserOrganizations(userId)
  if (userOrgs.length === 0) {
    redirect("/setup-organization")
  }

  // If has org, go to dashboard
  redirect("/home")
  return null
}
