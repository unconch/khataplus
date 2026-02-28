"use client"

import React, { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Fingerprint, Key, Loader2, LogOut, Shield, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import type { Profile, SystemSettings } from "@/lib/types"
import { startRegistration } from "@simplewebauthn/browser"

interface SecuritySettingsProps {
    profile: Profile
    isAdmin: boolean
    orgId: string
    initialSessions?: string[]
    initialSettings: SystemSettings
}

type ToggleKey =
    | "allow_staff_inventory"
    | "allow_staff_sales"
    | "allow_staff_add_inventory"
    | "gst_enabled"
    | "show_buy_price_in_sales"

export function SecuritySettings({
    profile,
    isAdmin,
    orgId,
    initialSessions = [],
    initialSettings,
}: SecuritySettingsProps) {
    const router = useRouter()
    const [settings, setSettings] = useState(initialSettings)
    const [biometricEnabled, setBiometricEnabled] = useState(profile.biometric_required || false)
    const [sessions, setSessions] = useState(initialSessions)
    const [isUpdating, setIsUpdating] = useState(false)
    const [isRevoking, setIsRevoking] = useState<string | null>(null)
    const [showPasskeyModal, setShowPasskeyModal] = useState(false)
    const [isAddingPasskey, setIsAddingPasskey] = useState(false)
    const governanceRows = useMemo(
        () =>
            [
                {
                    key: "allow_staff_inventory" as ToggleKey,
                    label: "Staff inventory access",
                    description: "Let staff view inventory and stock status.",
                },
                {
                    key: "allow_staff_sales" as ToggleKey,
                    label: "Staff sales access",
                    description: "Allow staff to create sales and invoices.",
                },
                {
                    key: "allow_staff_add_inventory" as ToggleKey,
                    label: "Staff inventory edits",
                    description: "Allow staff to add and update stock entries.",
                },
                {
                    key: "gst_enabled" as ToggleKey,
                    label: "GST engine",
                    description: "Enable GST calculations across billing flows.",
                },
                {
                    key: "show_buy_price_in_sales" as ToggleKey,
                    label: "Show buy price in sales",
                    description: "Expose buy price during sales item selection.",
                },
            ] as const,
        []
    )

    const goToLoginForPasskeySetup = () => {
        const nextPath = typeof window !== "undefined" ? window.location.pathname : "/dashboard/settings"
        router.push(`/auth/login?next=${encodeURIComponent(nextPath)}&passkey_setup=1`)
    }

    const addPasskey = async () => {
        setIsAddingPasskey(true)
        // Close modal before native passkey prompt so the UI doesn't look blocked by a dark overlay.
        setShowPasskeyModal(false)
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

    const postSettingsUpdate = async (payload: Record<string, unknown>) => {
        const response = await fetch("/api/settings/update", {
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
            await postSettingsUpdate({
                isProfileView: true,
                profile: {
                    ...profile,
                    biometric_required: checked,
                },
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
            await postSettingsUpdate({
                isProfileView: false,
                profile,
                org: { id: orgId },
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
            const { revokeSession } = await import("@/lib/session-governance")
            await revokeSession(profile.id, sid)
            setSessions((prev) => prev.filter((s) => s !== sid))
            toast.success("Session revoked")
        } catch {
            toast.error("Failed to revoke session")
        } finally {
            setIsRevoking(null)
        }
    }

    const handleRevokeAll = async () => {
        if (!confirm("Sign out from all other devices?")) return
        setIsUpdating(true)
        try {
            const { revokeAllSessions } = await import("@/lib/session-governance")
            await revokeAllSessions(profile.id)
            setSessions([])
            toast.success("All other sessions revoked")
        } catch {
            toast.error("Failed to revoke all sessions")
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <div className="space-y-6">
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
                        <Button type="button" onClick={() => setShowPasskeyModal(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                            <Key className="h-4 w-4 mr-2" /> Add Passkey
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
                <CardContent className="space-y-3">
                    {governanceRows.map((item) => (
                        <div key={item.key} className="flex items-center justify-between gap-3 rounded-xl border border-indigo-200/70 dark:border-indigo-900/40 bg-white/70 dark:bg-zinc-900/40 p-4">
                            <div>
                                <Label className="text-sm font-semibold">{item.label}</Label>
                                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                            </div>
                            <Switch
                                checked={Boolean(settings[item.key])}
                                onCheckedChange={(val) => updateGovernanceToggle(item.key, val)}
                                disabled={!isAdmin || isUpdating}
                            />
                        </div>
                    ))}
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
                    {sessions.length === 0 ? (
                        <div className="rounded-xl border border-cyan-200/70 dark:border-cyan-900/40 bg-white/70 dark:bg-zinc-900/40 p-4 text-sm text-muted-foreground">
                            No external sessions found.
                        </div>
                    ) : (
                        <>
                            {sessions.map((sid, idx) => (
                                <div key={sid} className="flex items-center justify-between rounded-xl border border-cyan-200/70 dark:border-cyan-900/40 bg-white/70 dark:bg-zinc-900/40 p-4">
                                    <div>
                                        <p className="text-sm font-semibold">{idx === 0 ? "Current session" : "Other device"}</p>
                                        <p className="text-xs text-muted-foreground mt-1">ID: {sid.slice(0, 16)}...</p>
                                    </div>
                                    {idx !== 0 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => handleRevokeSession(sid)}
                                            disabled={isRevoking === sid}
                                        >
                                            {isRevoking === sid ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <LogOut className="h-4 w-4 mr-2" />
                                                    Revoke
                                                </>
                                            )}
                                        </Button>
                                    )}
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

            {showPasskeyModal && (
                <div className="fixed inset-0 z-[80] bg-black/30 backdrop-blur-[2px] p-4 flex items-center justify-center">
                    <div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                            <h4 className="text-base font-bold text-zinc-900 dark:text-white">Add Passkey</h4>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-300 mt-1">Use this device for faster secure sign in.</p>
                        </div>
                        <div className="p-4">
                            <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-4">
                                This will open your device passkey prompt (Windows Hello / Face ID / Touch ID).
                            </p>
                            <Button
                                type="button"
                                className="w-full"
                                onClick={addPasskey}
                                disabled={isAddingPasskey}
                            >
                                {isAddingPasskey ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Key className="h-4 w-4 mr-2" />
                                )}
                                {isAddingPasskey ? "Adding Passkey..." : "Continue"}
                            </Button>
                        </div>
                        <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => setShowPasskeyModal(false)}
                            >
                                Close
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                                onClick={() => {
                                    setShowPasskeyModal(false)
                                    goToLoginForPasskeySetup()
                                }}
                            >
                                Verify via Login
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
