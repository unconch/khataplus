import { getOrganization, getSystemSettings, getUserOrganizations } from "@/lib/data/organizations"
import { getCurrentOrgId } from "@/lib/data/auth"
import { getProfile } from "@/lib/data/profiles"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SettingsForm } from "@/components/settings-form"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TeamManagement } from "@/components/team-management"

export default async function SettingsPage() {
    const { getCurrentUser, getCurrentOrgId } = await import("@/lib/data/auth")
    const user = await getCurrentUser()

    if (!user) {
        redirect("/auth/login")
        return null
    }
    const { userId, isGuest } = user

    let orgId: string | null = null
    if (isGuest) {
        orgId = "demo-org"
    } else {
        orgId = await getCurrentOrgId(userId)
    }

    if (!orgId) {
        redirect("/setup-organization")
        return null
    }

    return (
        <div className="p-4 space-y-6 pb-24 max-w-4xl mx-auto">
            <div className="flex flex-col gap-1 animate-slide-up">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Organization & Identity</h2>
                <p className="text-sm text-muted-foreground">Manage your business profile and personal identity</p>
            </div>

            <Suspense fallback={
                <div className="h-[500px] w-full flex items-center justify-center bg-muted/20 rounded-xl animate-pulse">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                </div>
            }>
                <SettingsContent orgId={orgId} userId={userId} />
            </Suspense>
        </div>
    )
}

async function SettingsContent({ orgId, userId }: { orgId: string, userId: string }) {
    const [org, settings, profile, userOrgs] = await Promise.all([
        getOrganization(orgId),
        getSystemSettings(orgId),
        getProfile(userId),
        getUserOrganizations(userId)
    ])

    const { isGuestMode } = await import("@/lib/data/auth")
    const isGuest = await isGuestMode()

    if (isGuest) {
        return (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-muted rounded-[2rem] bg-muted/5 space-y-4 animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
                    <div className="text-2xl font-black italic">!</div>
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-xl font-black italic tracking-tighter text-foreground">Settings Disabled</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                        Identity and organization settings are <span className="text-amber-600 font-bold uppercase underline">not available in demo mode</span>.
                    </p>
                </div>
                <div className="pt-4">
                    <a href="/auth/sign-up" className="px-6 py-2.5 rounded-full bg-zinc-950 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all">
                        Create Real Account
                    </a>
                </div>
            </div>
        )
    }

    if (!org) return <div>Organization not found</div>
    if (!profile) return <div>Identity not found</div>

    const membership = userOrgs.find((o: any) => o.org_id === orgId)
    const orgRole = membership?.role || "staff"
    const isAdmin = orgRole === "owner" || String(profile?.role) === "main admin"

    return (
        <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="profile">Identity</TabsTrigger>
                <TabsTrigger value="organization">Organization</TabsTrigger>
                <TabsTrigger value="team">Team Members</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
                <Card className="glass-card border-0 shadow-2xl overflow-hidden">
                    <CardHeader className="border-b border-border/50 bg-muted/20">
                        <CardTitle>Personal Identity</CardTitle>
                        <CardDescription>
                            Update your personal profile and account identity.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <SettingsForm
                            initialOrg={org}
                            initialSettings={settings}
                            initialProfile={profile}
                            isAdmin={isAdmin}
                            orgRole={orgRole}
                            viewMode="profile"
                        />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="organization">
                <Card className="glass-card border-0 shadow-2xl overflow-hidden">
                    <CardHeader className="border-b border-border/50 bg-muted/20">
                        <CardTitle>Organization & Billing</CardTitle>
                        <CardDescription>
                            Manage organization profile, billing, access rules, and automation.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <SettingsForm
                            initialOrg={org}
                            initialSettings={settings}
                            initialProfile={profile}
                            isAdmin={isAdmin}
                            orgRole={orgRole}
                            viewMode="organization"
                        />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="team">
                <TeamManagement orgId={orgId} orgName={org.name} />
            </TabsContent>
        </Tabs>
    )
}
