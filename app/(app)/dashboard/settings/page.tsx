import { getOrganization, getSystemSettings } from "@/lib/data/organizations"
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
    const [org, settings, profile] = await Promise.all([
        getOrganization(orgId),
        getSystemSettings(orgId),
        getProfile(userId)
    ])

    if (!org) return <div>Organization not found</div>
    if (!profile) return <div>Identity not found</div>

    const isAdmin = profile?.role === "main admin" || profile?.role === "owner"

    return (
        <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="profile">Identity & Settings</TabsTrigger>
                <TabsTrigger value="team">Team Members</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
                <Card className="glass-card border-0 shadow-2xl overflow-hidden">
                    <CardHeader className="border-b border-border/50 bg-muted/20">
                        <CardTitle>Unified Configuration</CardTitle>
                        <CardDescription>
                            Update your personal identity and organization preferences in one place.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <SettingsForm
                            initialOrg={org}
                            initialSettings={settings}
                            initialProfile={profile}
                            isAdmin={isAdmin}
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
