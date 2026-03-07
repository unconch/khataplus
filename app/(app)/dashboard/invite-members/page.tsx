import { TeamManagement } from "@/components/team-management"
import { Button } from "@/components/ui/button"
import { ChevronLeft, UserPlus } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function InviteMembersPage() {
  const { getCurrentUser, getCurrentOrgId } = await import("@/lib/data/auth")
  const { getOrganization } = await import("@/lib/data/organizations")

  const user = await getCurrentUser()
  if (!user) {
    redirect("/auth/login")
    return null
  }

  const orgId = user.isGuest ? "demo-org" : await getCurrentOrgId(user.userId)
  if (!orgId) {
    redirect("/setup-organization")
    return null
  }

  const org = await getOrganization(orgId)
  if (!org) {
    redirect("/dashboard/settings")
    return null
  }

  const settingsHref = org.slug ? `/${org.slug}/dashboard/settings` : "/dashboard/settings"

  return (
    <div className="min-h-full space-y-8 pb-20 pt-4">
      <div className="flex flex-col gap-4">
        <Link href={settingsHref} className="w-fit">
          <Button variant="ghost" size="sm" className="h-8 px-2 text-zinc-500 hover:text-zinc-950 font-bold">
            <ChevronLeft size={16} className="mr-1" /> Back to Settings
          </Button>
        </Link>

        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-orange-500 text-white shadow-xl shadow-orange-200/50">
            <UserPlus size={24} />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-3xl font-black tracking-tighter text-foreground">
              Invite <span className="text-zinc-400">Members</span>
            </h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
              Team Access | Role Assignment | Secure Invite Links
            </p>
          </div>
        </div>
      </div>

      <TeamManagement orgId={orgId} orgName={org.name} />
    </div>
  )
}
