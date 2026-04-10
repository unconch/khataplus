"use client"

import React, { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Fingerprint, Key, Loader2, LogOut, Shield, Smartphone, Sparkles, LockKeyhole, Activity, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import type { Profile, SystemSettings } from "@/lib/types"
import type { SessionSnapshot } from "@/lib/session-governance"
import { startRegistration } from "@simplewebauthn/browser"

interface SecuritySettingsProps {
    profile: Profile
    isAdmin: boolean
    initialSessions?: SessionSnapshot[]
    currentSessionId?: string
    initialSettings: SystemSettings
}

type ToggleKey =
    | "allow_staff_inventory"
    | "allow_staff_sales"
    | "allow_staff_reports"
    | "allow_staff_reports_entry_only"
    | "allow_staff_analytics"
    | "allow_staff_add_inventory"
    | "gst_enabled"
    | "gst_inclusive"
    | "show_buy_price_in_sales"

export function SecuritySettings({
    profile,
    isAdmin,
    initialSessions = [],
    currentSessionId = "",
    initialSettings,
}: SecuritySettingsProps) {
    const router = useRouter()
    const [settings, setSettings] = useState(initialSettings)
    const [biometricEnabled, setBiometricEnabled] = useState(profile.biometric_required || false)
    const [sessions, setSessions] = useState(initialSessions)
    const [isUpdating, setIsUpdating] = useState(false)
    const [isRevoking, setIsRevoking] = useState<string | null>(null)
    const [isAddingPasskey, setIsAddingPasskey] = useState(false)
    const governanceRows = useMemo(
        () =>
            [
                {
                    group: "Sales Workflow",
                    key: "allow_staff_inventory" as ToggleKey,
                    label: "Staff inventory access",
                    description: "Let staff view inventory and stock status.",
                },
                {
                    group: "Sales Workflow",
                    key: "allow_staff_sales" as ToggleKey,
                    label: "Staff sales access",
                    description: "Allow staff to create sales and invoices.",
                },
                {
                    group: "Inventory Operations",
                    key: "allow_staff_add_inventory" as ToggleKey,
                    label: "Staff inventory edits",
                    description: "Allow staff to add and update stock entries.",
                },
                {
                    group: "Tax & Compliance",
                    key: "gst_enabled" as ToggleKey,
                    label: "GST engine",
                    description: "Enable GST calculations across billing flows.",
                },
                {
                    group: "Tax & Compliance",
                    key: "gst_inclusive" as ToggleKey,
                    label: "GST pricing mode",
                    description: "Choose whether entered prices include GST or GST is added on top.",
                },
                {
                    group: "Sales Workflow",
                    key: "show_buy_price_in_sales" as ToggleKey,
                    label: "Show buy price in sales",
                    description: "Expose buy price during sales item selection.",
                },
                {
                    group: "Reporting & Insights",
                    key: "allow_staff_reports" as ToggleKey,
                    label: "Staff reports access",
                    description: "Allow staff to open reports and exports.",
                },
                {
                    group: "Reporting & Insights",
                    key: "allow_staff_reports_entry_only" as ToggleKey,
                    label: "Reports entry-only mode",
                    description: "Let staff enter report data without full report visibility.",
                },
                {
                    group: "Reporting & Insights",
                    key: "allow_staff_analytics" as ToggleKey,
                    label: "Staff analytics access",
                    description: "Expose analytics dashboards to staff accounts.",
                },
            ] as const,
        []
    )

    const governanceSummary = useMemo(() => {
        const enabled = governanceRows.filter((row) => Boolean(settings[row.key])).length
        return {
            enabled,
            total: governanceRows.length,
            sessions: sessions.length,
            passkeyReady: biometricEnabled,
        }
    }, [biometricEnabled, governanceRows, sessions.length, settings])

    const governanceGroups = useMemo(
        () => ({
            "Sales Workflow": "Control how far staff can move through inventory visibility, billing, and margin-sensitive screens.",
            "Inventory Operations": "Keep stock-changing actions separate from stock visibility to reduce accidental edits.",
            "Reporting & Insights": "Split report entry, report visibility, and analytics access into separate controls.",
            "Tax & Compliance": "Keep GST behavior explicit so operators understand whether prices are tax-inclusive or not.",
        }),
        []
    )

    const governanceNotes = useMemo(() => {
        const notes: string[] = []
        if (!isAdmin) {
            notes.push("This workspace is in read-only governance mode for your account. Owner access is required to change controls.")
        }
        if (!settings.gst_enabled) {
            notes.push("GST pricing mode stays visible for context, but it has no effect until the GST engine is enabled.")
        }
        if (settings.allow_staff_reports && settings.allow_staff_reports_entry_only) {
            notes.push("Reports entry-only mode is redundant while full staff reports access is enabled.")
        }
        return notes
    }, [isAdmin, settings.allow_staff_reports, settings.allow_staff_reports_entry_only, settings.gst_enabled])

    const currentSession = useMemo(
        () => sessions.find((session) => session.isCurrent) || null,
        [sessions]
    )
    const externalSessions = useMemo(
        () => sessions.filter((session) => !session.isCurrent),
        [sessions]
    )

    const formatSessionMoment = (value?: number | null) => {
        if (!value) return "Recent activity unavailable"

        const date = new Date(value)
        const diffMinutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000))

        if (diffMinutes < 1) return "Active just now"
        if (diffMinutes < 60) return `Active ${diffMinutes}m ago`
        if (diffMinutes < 24 * 60) return `Active ${Math.round(diffMinutes / 60)}h ago`

        return `Active on ${date.toLocaleDateString()}`
    }

    const formatSessionDetails = (session: SessionSnapshot) => {
        const details = [session.browser, session.os, session.ipAddress].filter(Boolean)
        return details.length > 0 ? details.join(" . ") : `Session ID: ${session.id.slice(0, 16)}...`
    }

    const goToLoginForPasskeySetup = () => {
        const nextPath = typeof window !== "undefined" ? window.location.pathname : "/dashboard/settings"
        router.push(`/auth/login?next=${encodeURIComponent(nextPath)}&passkey_setup=1`)
    }

    const addPasskey = async () => {
        setIsAddingPasskey(true)
        try {
            const optionsResp = await fetch("/api/auth/webauthn/register/options", {
                method: "GET",
                credentials: "include",
                cache: "no-store",
            })
            const optionsData = await optionsResp.json().catch(() => ({} as any))
            if (!optionsResp.ok) {
                throw new Error(optionsData?.error || "Failed to get passkey options")
            }

            const registration = await startRegistration({ optionsJSON: optionsData })

            const verifyResp = await fetch("/api/auth/webauthn/register/verify", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(registration),
            })
            const verifyData = await verifyResp.json().catch(() => ({} as any))
            if (!verifyResp.ok) {
                throw new Error(verifyData?.error || "Failed to save passkey")
            }

            toast.success("Passkey added successfully")
        } catch (error: any) {
            const message = String(error?.message || "")
            if (/unauthorized|missing challenge|not logged in|session/i.test(message)) {
                toast.message("Session refresh needed. Continue via login to add passkey")
                goToLoginForPasskeySetup()
                return
            }
            if (error?.name === "NotAllowedError") {
                toast.error("Passkey setup cancelled")
                return
            }
            toast.error(error?.message || "Could not add passkey. Please retry")
        } finally {
            setIsAddingPasskey(false)
        }
    }

    const postSecuritySettingsUpdate = async (payload: Record<string, unknown>) => {
        const response = await fetch("/api/security/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
        })
        const data = await response.json().catch(() => ({} as any))
        if (!response.ok) throw new Error(data?.error || "Update failed")
        return data
    }

    const toggleBiometric = async (checked: boolean) => {
        const previous = biometricEnabled
        setBiometricEnabled(checked)
        setIsUpdating(true)
        try {
            await postSecuritySettingsUpdate({
                action: "biometric",
                biometricRequired: checked,
            })
            toast.success(`Biometric protection ${checked ? "enabled" : "disabled"}`)
        } catch (err: any) {
            setBiometricEnabled(previous)
            toast.error(err?.message || "Failed to update biometric status")
        } finally {
            setIsUpdating(false)
        }
    }

    const updateGovernanceToggle = async (key: ToggleKey, value: boolean) => {
        const prev = settings
        setSettings((current) => ({ ...current, [key]: value }))

        try {
            await postSecuritySettingsUpdate({
                action: "governance",
                settings: { [key]: value },
            })
            toast.success("Governance setting updated")
        } catch (err: any) {
            setSettings(prev)
            toast.error(err?.message || "Failed to update setting")
        }
    }

    const handleRevokeSession = async (sid: string) => {
        setIsRevoking(sid)
        try {
            const response = await fetch("/api/security/sessions", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ sessionId: sid }),
            })
            const data = await response.json().catch(() => ({} as any))
            if (!response.ok) throw new Error(data?.error || "Failed to revoke session")
            setSessions((prev) => prev.filter((session) => session.id !== sid))
            toast.success("Session revoked")
        } catch (error: any) {
            toast.error(error?.message || "Failed to revoke session")
        } finally {
            setIsRevoking(null)
        }
    }

    const handleRevokeAll = async () => {
        if (!confirm("Sign out from all other devices?")) return
        setIsUpdating(true)
        try {
            const response = await fetch("/api/security/sessions", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ revokeAll: true }),
            })
            const data = await response.json().catch(() => ({} as any))
            if (!response.ok) throw new Error(data?.error || "Failed to revoke all sessions")
            setSessions((prev) => prev.filter((session) => session.id === currentSessionId))
            toast.success("All other sessions revoked")
        } catch (error: any) {
            toast.error(error?.message || "Failed to revoke all sessions")
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Card className="border-zinc-200/70 dark:border-zinc-800">
                    <CardContent className="p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Security State</p>
                        <p className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">
                            {biometricEnabled ? "Locked" : "Open"}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Biometric gate for this account.</p>
                    </CardContent>
                </Card>
                <Card className="border-zinc-200/70 dark:border-zinc-800">
                    <CardContent className="p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Governance Rules</p>
                        <p className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">
                            {governanceSummary.enabled}/{governanceSummary.total}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Enabled operational controls.</p>
                    </CardContent>
                </Card>
                <Card className="border-zinc-200/70 dark:border-zinc-800">
                    <CardContent className="p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Active Sessions</p>
                        <p className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">
                            {governanceSummary.sessions}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Tracked devices for this account.</p>
                    </CardContent>
                </Card>
                <Card className="border-zinc-200/70 dark:border-zinc-800">
                    <CardContent className="p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Workspace Scope</p>
                        <p className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">
                            {isAdmin ? "Admin" : "Member"}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Permission level for governance updates.</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="overflow-hidden border-zinc-200/70 dark:border-zinc-800 bg-[linear-gradient(135deg,rgba(24,24,27,0.04),rgba(14,165,233,0.06))] dark:bg-[linear-gradient(135deg,rgba(24,24,27,0.96),rgba(8,47,73,0.45))]">
                <CardContent className="grid gap-4 p-5 md:grid-cols-3">
                    <div className="rounded-2xl border border-zinc-200/70 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            <LockKeyhole className="h-4 w-4 text-emerald-500" />
                            Access posture
                        </div>
                        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                            Biometric lock and passkey access are managed here for this account.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-zinc-200/70 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            <Activity className="h-4 w-4 text-cyan-500" />
                            Session control
                        </div>
                        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                            Review current devices and revoke stale sessions without leaving settings.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-zinc-200/70 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            <Sparkles className="h-4 w-4 text-indigo-500" />
                            Governance matrix
                        </div>
                        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                            Staff visibility and workflow permissions are grouped by operational domain.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card className="overflow-hidden border-emerald-200/60 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/90 via-white to-cyan-50/50 dark:from-emerald-950/20 dark:via-zinc-950 dark:to-cyan-950/20">
                <CardHeader className="border-b border-emerald-100/70 dark:border-emerald-900/40">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <span className="h-8 w-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <Fingerprint className="h-4 w-4" />
                        </span>
                        Access Security
                    </CardTitle>
                    <CardDescription>Manage biometric lock and passkey-based quick sign in.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border border-emerald-200/70 dark:border-emerald-900/40 bg-white/70 dark:bg-zinc-900/40 p-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Biometric Gate</p>
                            <p className="mt-1 text-sm font-black text-zinc-950 dark:text-zinc-50">
                                {biometricEnabled ? "Required" : "Optional"}
                            </p>
                        </div>
                        <div className="rounded-xl border border-emerald-200/70 dark:border-emerald-900/40 bg-white/70 dark:bg-zinc-900/40 p-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Current Device</p>
                            <p className="mt-1 text-sm font-black text-zinc-950 dark:text-zinc-50">
                                {currentSession?.deviceLabel || "Active"}
                            </p>
                        </div>
                        <div className="rounded-xl border border-emerald-200/70 dark:border-emerald-900/40 bg-white/70 dark:bg-zinc-900/40 p-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Other Devices</p>
                            <p className="mt-1 text-sm font-black text-zinc-950 dark:text-zinc-50">
                                {externalSessions.length === 0 ? "None" : String(externalSessions.length)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-emerald-200/70 dark:border-emerald-900/40 bg-white/70 dark:bg-zinc-900/40 p-4">
                        <div>
                            <Label className="text-sm font-semibold">Biometric app lock</Label>
                            <p className="text-xs text-muted-foreground mt-1">
                                Require FaceID/Fingerprint before unlocking the app.
                            </p>
                        </div>
                        <Switch checked={biometricEnabled} onCheckedChange={toggleBiometric} disabled={isUpdating} />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200/70 dark:border-emerald-900/40 bg-white/70 dark:bg-zinc-900/40 p-4">
                        <div>
                            <Label className="text-sm font-semibold">Passkey quick login</Label>
                            <p className="text-xs text-muted-foreground mt-1">
                                Add this device as a passkey for OTP-less sign in.
                            </p>
                        </div>
                        <Button
                            type="button"
                            onClick={addPasskey}
                            disabled={isAddingPasskey}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                            {isAddingPasskey ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Key className="h-4 w-4 mr-2" />
                            )}
                            {isAddingPasskey ? "Adding..." : "Add Passkey"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="overflow-hidden border-indigo-200/60 dark:border-indigo-900/40 bg-gradient-to-br from-indigo-50/90 via-white to-blue-50/50 dark:from-indigo-950/20 dark:via-zinc-950 dark:to-blue-950/20">
                <CardHeader className="border-b border-indigo-100/70 dark:border-indigo-900/40">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <span className="h-8 w-8 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <Shield className="h-4 w-4" />
                        </span>
                        Governance Controls
                    </CardTitle>
                    <CardDescription>Fine-tune what staff can view and modify.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-xl border border-indigo-200/70 dark:border-indigo-900/40 bg-white/70 dark:bg-zinc-900/40 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">
                                {isAdmin ? "Admin editing enabled" : "Read-only view"}
                            </span>
                            <span className="rounded-full bg-zinc-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-700 dark:text-zinc-300">
                                {governanceSummary.enabled} of {governanceSummary.total} controls active
                            </span>
                        </div>
                        {governanceNotes.length > 0 ? (
                            <div className="mt-3 space-y-2">
                                {governanceNotes.map((note) => (
                                    <div key={note} className="flex items-start gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                                        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                        <span>{note}</span>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </div>

                    {(["Sales Workflow", "Inventory Operations", "Reporting & Insights", "Tax & Compliance"] as const).map((group) => {
                        const rows = governanceRows.filter((row) => row.group === group)
                        if (!rows.length) return null
                        return (
                            <div key={group} className="space-y-3 rounded-2xl border border-indigo-200/70 dark:border-indigo-900/40 bg-white/70 dark:bg-zinc-900/40 p-4">
                                <div className="px-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500/80 dark:text-indigo-300/80">
                                        {group}
                                    </p>
                                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                        {governanceGroups[group]}
                                    </p>
                                </div>
                                {rows.map((item) => (
                                    <div key={item.key} className="flex items-center justify-between gap-3 rounded-xl border border-indigo-100/80 dark:border-indigo-900/30 bg-white dark:bg-zinc-950/70 p-4">
                                        <div>
                                            <Label className="text-sm font-semibold">{item.label}</Label>
                                            <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                                        </div>
                                        {item.key === "gst_inclusive" ? (
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant={settings.gst_inclusive ? "default" : "outline"}
                                                    className="h-8"
                                                    onClick={() => updateGovernanceToggle("gst_inclusive", true)}
                                                    disabled={!isAdmin || isUpdating || !settings.gst_enabled}
                                                >
                                                    Inclusive
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant={!settings.gst_inclusive ? "default" : "outline"}
                                                    className="h-8"
                                                    onClick={() => updateGovernanceToggle("gst_inclusive", false)}
                                                    disabled={!isAdmin || isUpdating || !settings.gst_enabled}
                                                >
                                                    Exclusive
                                                </Button>
                                            </div>
                                        ) : (
                                            <Switch
                                                checked={Boolean(settings[item.key])}
                                                onCheckedChange={(val) => updateGovernanceToggle(item.key, val)}
                                                disabled={!isAdmin || isUpdating}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )
                    })}
                </CardContent>
            </Card>

            <Card className="overflow-hidden border-cyan-200/60 dark:border-cyan-900/40 bg-gradient-to-br from-cyan-50/90 via-white to-sky-50/50 dark:from-cyan-950/20 dark:via-zinc-950 dark:to-sky-950/20">
                <CardHeader className="border-b border-cyan-100/70 dark:border-cyan-900/40">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <span className="h-8 w-8 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                            <Smartphone className="h-4 w-4" />
                        </span>
                        Active Sessions
                    </CardTitle>
                    <CardDescription>Review and revoke active sessions for your account.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="rounded-xl border border-cyan-200/70 dark:border-cyan-900/40 bg-white/70 dark:bg-zinc-900/40 p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold">{currentSession?.deviceLabel || "This device"}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {currentSession
                                        ? formatSessionDetails(currentSession)
                                        : "Current login is active on this device."}
                                </p>
                                {currentSession ? (
                                    <p className="mt-2 text-[11px] text-cyan-700/80 dark:text-cyan-300/80">
                                        {formatSessionMoment(currentSession.lastSeenAt)}
                                    </p>
                                ) : null}
                            </div>
                            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                                Active now
                            </span>
                        </div>
                    </div>

                    {externalSessions.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-cyan-200/70 dark:border-cyan-900/40 bg-white/40 dark:bg-zinc-900/20 p-4 text-sm text-muted-foreground">
                            No other signed-in devices found. This account is only active on the current device.
                        </div>
                    ) : (
                        <>
                            {externalSessions.map((session, index) => (
                                <div key={session.id} className="flex items-center justify-between gap-4 rounded-xl border border-cyan-200/70 dark:border-cyan-900/40 bg-white/70 dark:bg-zinc-900/40 p-4">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold">{session.deviceLabel || `Other device ${index + 1}`}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{formatSessionDetails(session)}</p>
                                        <p className="mt-2 text-[11px] text-cyan-700/80 dark:text-cyan-300/80">
                                            {formatSessionMoment(session.lastSeenAt)}
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => handleRevokeSession(session.id)}
                                        disabled={isRevoking === session.id}
                                    >
                                        {isRevoking === session.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <>
                                                <LogOut className="h-4 w-4 mr-2" />
                                                Revoke
                                            </>
                                        )}
                                    </Button>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleRevokeAll}
                                disabled={isUpdating}
                                className="w-full sm:w-auto"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Revoke All Other Sessions
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>

        </div>
    )
}
