"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Descope } from "@descope/nextjs-sdk"
import { useRouter } from "next/navigation"
import { Fingerprint, Key, Loader2, LogOut, Shield, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import type { Profile, SystemSettings } from "@/lib/types"

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

    const promotePasskeyFlowId = process.env.NEXT_PUBLIC_DESCOPE_PROMOTE_PASSKEYS_FLOW_ID || "promote-passkeys"
    const reauthPasskeyFlowId =
        process.env.NEXT_PUBLIC_DESCOPE_PASSKEY_SETUP_FLOW_ID ||
        process.env.NEXT_PUBLIC_DESCOPE_PASSKEY_LOGIN_FLOW_ID ||
        ""

    const [activePasskeyFlowId, setActivePasskeyFlowId] = useState(promotePasskeyFlowId)
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

    useEffect(() => {
        setActivePasskeyFlowId(promotePasskeyFlowId)
    }, [promotePasskeyFlowId, showPasskeyModal])

    const goToLoginForPasskeySetup = () => {
        const nextPath = typeof window !== "undefined" ? window.location.pathname : "/dashboard/settings"
        router.push(`/auth/login?next=${encodeURIComponent(nextPath)}&passkey_setup=1`)
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
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Fingerprint className="h-5 w-5" />
                        Access Security
                    </CardTitle>
                    <CardDescription>Manage biometric lock and passkey-based quick sign in.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl border p-4">
                        <div>
                            <Label className="text-sm font-semibold">Biometric app lock</Label>
                            <p className="text-xs text-muted-foreground mt-1">
                                Require FaceID/Fingerprint before unlocking the app.
                            </p>
                        </div>
                        <Switch checked={biometricEnabled} onCheckedChange={toggleBiometric} disabled={isUpdating} />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
                        <div>
                            <Label className="text-sm font-semibold">Passkey quick login</Label>
                            <p className="text-xs text-muted-foreground mt-1">
                                Add this device as a passkey for OTP-less sign in.
                            </p>
                        </div>
                        <Button type="button" onClick={() => setShowPasskeyModal(true)}>
                            <Key className="h-4 w-4 mr-2" /> Add Passkey
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Shield className="h-5 w-5" />
                        Governance Controls
                    </CardTitle>
                    <CardDescription>Fine-tune what staff can view and modify.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {governanceRows.map((item) => (
                        <div key={item.key} className="flex items-center justify-between gap-3 rounded-xl border p-4">
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

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Smartphone className="h-5 w-5" />
                        Active Sessions
                    </CardTitle>
                    <CardDescription>Review and revoke active sessions for your account.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {sessions.length === 0 ? (
                        <div className="rounded-xl border p-4 text-sm text-muted-foreground">
                            No external sessions found.
                        </div>
                    ) : (
                        <>
                            {sessions.map((sid, idx) => (
                                <div key={sid} className="flex items-center justify-between rounded-xl border p-4">
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
                <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm p-4 flex items-center justify-center">
                    <div className="w-full max-w-md rounded-2xl border border-white/20 bg-zinc-950 shadow-2xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/10">
                            <h4 className="text-base font-bold text-white">Add Passkey</h4>
                            <p className="text-[11px] text-zinc-300 mt-1">Use this device for faster secure sign in.</p>
                        </div>
                        <div className="p-3 bg-white">
                            {activePasskeyFlowId ? (
                                <Descope
                                    key={activePasskeyFlowId}
                                    flowId={activePasskeyFlowId}
                                    onSuccess={() => {
                                        toast.success("Passkey added successfully")
                                        setShowPasskeyModal(false)
                                    }}
                                    onError={(error: any) => {
                                        const message = String(error?.errorDescription || error?.message || error || "")
                                        const missingRefreshToken = /refresh token|failed to load user/i.test(message)

                                        if (
                                            missingRefreshToken &&
                                            reauthPasskeyFlowId &&
                                            reauthPasskeyFlowId !== activePasskeyFlowId
                                        ) {
                                            setActivePasskeyFlowId(reauthPasskeyFlowId)
                                            toast.message("Please verify once to add a passkey")
                                            return
                                        }

                                        setShowPasskeyModal(false)
                                        if (missingRefreshToken) {
                                            toast.message("Session refresh needed. Continue via login to add passkey")
                                            goToLoginForPasskeySetup()
                                            return
                                        }
                                        toast.error("Could not add passkey. Please retry")
                                    }}
                                    theme="light"
                                    debug={false}
                                />
                            ) : (
                                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
                                    Passkey setup flow is not configured.
                                </div>
                            )}
                        </div>
                        <div className="px-4 py-3 border-t border-white/10 bg-zinc-950 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full border-white/20 bg-white/5 text-zinc-100 hover:bg-white/10"
                                onClick={() => setShowPasskeyModal(false)}
                            >
                                Close
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full border-emerald-400/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
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

