import { getOrganization, getSystemSettings, getUserOrganizations } from "@/lib/data/organizations"
import { getCurrentOrgId } from "@/lib/data/auth"
import { getProfile } from "@/lib/data/profiles"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SettingsForm } from "@/components/settings-form"
import { Suspense } from "react"
import { Loader2, Shield, User, Building2, Users, Settings2, Globe, Zap, Cpu } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TeamManagement } from "@/components/team-management"
import { SecuritySettings } from "@/components/security-settings"
import { getUserSessions } from "@/lib/session-governance"
import { cn } from "@/lib/utils"

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
        <div className="relative min-h-full space-y-8 pb-12 overflow-hidden">
            {/* Ambient Background Flair */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-amber-500/5 blur-[80px] rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 px-1">
                        <div className="h-px w-8 bg-zinc-950 dark:bg-zinc-100 opacity-20" />
                        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400">Governance</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-0.5 bg-zinc-950 dark:bg-zinc-100 rounded-full opacity-10" />
                        <h1 className="text-4xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl animate-in fade-in slide-in-from-left-6 duration-700">
                            Control <span className="text-zinc-400 font-light italic">Center</span>
                        </h1>
                    </div>
                </div>

                <div className="hidden lg:flex items-center gap-2 p-1 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm animate-in fade-in slide-in-from-right-8 duration-1000">
                    <div className="px-4 py-2 rounded-lg bg-white dark:bg-zinc-950 flex items-center gap-3 shadow-md">
                        <div className="flex -space-x-1">
                            {[1, 2].map(i => <div key={i} className="h-4 w-4 rounded-full border border-white dark:border-zinc-950 bg-zinc-200 dark:bg-zinc-800" />)}
                        </div>
                        <div className="space-y-0.5">
                            <span className="block text-[9px] font-black uppercase tracking-widest leading-none">System Load</span>
                            <div className="flex items-center gap-1.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">Verified Cluster Ready</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Suspense fallback={
                <div className="h-[400px] w-full flex flex-col items-center justify-center bg-zinc-50/50 dark:bg-zinc-950/20 rounded-2xl border border-dashed border-zinc-100 dark:border-zinc-800 animate-pulse">
                    <Loader2 className="h-8 w-8 animate-spin text-zinc-200" />
                    <span className="mt-4 text-[9px] font-black uppercase tracking-widest text-zinc-300">Calibrating</span>
                </div>
            }>
                <SettingsContent orgId={orgId as string} userId={userId} />
            </Suspense>
        </div>
    )
}

async function SettingsContent({ orgId, userId }: { orgId: string, userId: string }) {
    const [org, settings, profile, userOrgs, sessions] = await Promise.all([
        getOrganization(orgId),
        getSystemSettings(orgId),
        getProfile(userId),
        getUserOrganizations(userId),
        getUserSessions(userId)
    ])

    const { isGuestMode } = await import("@/lib/data/auth")
    const isGuest = await isGuestMode()

    if (isGuest) {
        return (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-950/20 space-y-6 animate-in fade-in zoom-in-95 duration-1000">
                <div className="relative">
                    <div className="absolute inset-0 bg-amber-500 blur-xl opacity-20 animate-pulse" />
                    <div className="relative w-16 h-16 rounded-2xl bg-zinc-950 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-950 shadow-xl">
                        <Cpu size={28} className="animate-bounce" />
                    </div>
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-2xl font-black italic tracking-tighter text-foreground">Sandbox Mode Active</h3>
                    <p className="text-xs text-zinc-400 font-medium max-w-sm mx-auto leading-relaxed">
                        Governance settings are <span className="text-amber-600 font-bold uppercase underline">Locked</span> in demonstration.
                    </p>
                </div>
                <div className="pt-2">
                    <a href="/auth/sign-up" className="group flex items-center gap-3 px-8 py-3 rounded-xl bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 dark:hover:bg-emerald-600 hover:text-white transition-all duration-500 shadow-lg">
                        Go Pro
                        <Zap size={10} className="group-hover:animate-ping" />
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

    const tabStyles = "flex items-center gap-2 px-6 h-full rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-950 dark:data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100"

    return (
        <Tabs defaultValue="profile" className="w-full space-y-10">
            <div className="flex items-center justify-center w-full">
                <TabsList className="flex h-12 items-center justify-start gap-1 rounded-2xl bg-zinc-100/50 dark:bg-zinc-900 p-1 backdrop-blur-3xl border border-white/20 dark:border-white/5 shadow-xl">
                    <TabsTrigger value="profile" className={tabStyles}>
                        <User size={16} strokeWidth={2.5} />
                        <span className="hidden sm:inline">Identity</span>
                    </TabsTrigger>

                    <TabsTrigger value="organization" className={tabStyles}>
                        <Building2 size={14} strokeWidth={2.5} />
                        <span className="hidden sm:inline">Organization</span>
                    </TabsTrigger>

                    <TabsTrigger value="team" className={tabStyles}>
                        <Users size={14} strokeWidth={2.5} />
                        <span className="hidden sm:inline">Team</span>
                    </TabsTrigger>

                    <TabsTrigger value="security" className={tabStyles}>
                        <Shield size={14} strokeWidth={2.5} />
                        <span className="hidden sm:inline">Vault & Governance</span>
                    </TabsTrigger>
                </TabsList>
            </div>

            <div className="max-w-4xl mx-auto w-full px-4">
                <TabsContent value="profile" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <SettingsCard
                        icon={<User size={18} />}
                        title="Personal Identity"
                        description="Calibrate your individual profile and secure signature."
                        color="amber"
                    >
                        <SettingsForm
                            initialOrg={org}
                            initialSettings={settings}
                            initialProfile={profile}
                            isAdmin={isAdmin}
                            orgRole={orgRole}
                            viewMode="profile"
                        />
                    </SettingsCard>
                </TabsContent>

                <TabsContent value="organization" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <SettingsCard
                        icon={<Building2 size={18} />}
                        title="Organization"
                        description="Manage legal entity and operational boundaries."
                        color="emerald"
                    >
                        <SettingsForm
                            initialOrg={org}
                            initialSettings={settings}
                            initialProfile={profile}
                            isAdmin={isAdmin}
                            orgRole={orgRole}
                            viewMode="organization"
                        />
                    </SettingsCard>
                </TabsContent>

                <TabsContent value="team" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <SettingsCard
                        icon={<Users size={18} />}
                        title="Team Management"
                        description="Govern organizational hierarchy and staff access."
                        color="indigo"
                    >
                        <TeamManagement orgId={orgId} orgName={org.name} />
                    </SettingsCard>
                </TabsContent>

                <TabsContent value="security" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <SettingsCard
                        icon={<Shield size={18} />}
                        title="Vault & Governance"
                        description="Administer biometric access and session streams."
                        color="zinc"
                    >
                        <SecuritySettings
                            profile={profile}
                            isAdmin={isAdmin}
                            orgId={orgId}
                            initialSessions={sessions}
                            initialSettings={settings}
                        />
                    </SettingsCard>
                </TabsContent>
            </div>
        </Tabs>
    )
}

function SettingsCard({ icon, title, description, children, color = "zinc" }: { icon: React.ReactNode, title: string, description: string, children: React.ReactNode, color?: string }) {
    const colors = {
        amber: "bg-amber-500",
        emerald: "bg-emerald-500",
        indigo: "bg-indigo-500",
        zinc: "bg-zinc-950 dark:bg-zinc-50 dark:text-zinc-950"
    }

    return (
        <Card className="glass-card border-0 shadow-xl overflow-hidden rounded-2xl transition-all">
            <CardHeader className="border-b border-zinc-100/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-950/40 p-6 relative overflow-hidden group">
                {/* Header Pattern */}
                <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                <div className="relative z-10 flex items-center gap-6">
                    <div className={cn("p-3 rounded-xl text-white shadow-lg transition-transform duration-500 group-hover:scale-110", colors[color as keyof typeof colors])}>
                        {icon}
                    </div>
                    <div>
                        <CardTitle className="text-xl font-black tracking-tight mb-0.5 uppercase italic">{title}</CardTitle>
                        <CardDescription className="text-xs font-bold text-zinc-400 tracking-tight leading-none">
                            {description}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 bg-white/5 dark:bg-zinc-950/5">
                {children}
            </CardContent>
        </Card>
    )
}

