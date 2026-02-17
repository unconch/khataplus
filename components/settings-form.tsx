"use client"

import { useState, useEffect, useCallback } from "react"
import { Organization, SystemSettings, Profile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { updateOrganization, updateSystemSettings } from "@/lib/data/organizations"
import { upsertProfile } from "@/lib/data/profiles"
import { toast } from "sonner"
import { Building2, Save, BadgeCheck, Phone, MapPin, Globe, Percent, Info, User, Fingerprint, Shield, MessageCircle,
    Trash2, AlertTriangle, Clock, CheckCircle2, XCircle, Users, ShieldAlert, RefreshCw, Loader2
} from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface SettingsFormProps {
    initialOrg: Organization
    initialSettings: SystemSettings
    initialProfile: Profile
    isAdmin: boolean
    orgRole?: string
}

export function SettingsForm({ initialOrg, initialSettings, initialProfile, isAdmin, orgRole }: SettingsFormProps) {
    const [org, setOrg] = useState(initialOrg)
    const [settings, setSettings] = useState(initialSettings)
    const [profile, setProfile] = useState(initialProfile)
    const [loading, setLoading] = useState(false)

    const router = useRouter()
    const [deleteConfirmText, setDeleteConfirmText] = useState("")
    const [showDeleteSection, setShowDeleteSection] = useState(false)
    const [isRequesting, setIsRequesting] = useState(false)
    const [isCancelling, setIsCancelling] = useState(false)
    const [deletionStatus, setDeletionStatus] = useState<any>(null)
    const [statusLoading, setStatusLoading] = useState(false)
    const isCreator = initialOrg.created_by === initialProfile.id

    const handleSave = async () => {
        if (!isAdmin) {
            toast.error("You don't have permission to update settings")
            return
        }

        setLoading(true)
        try {
            // Destructure settings out to avoid overwriting them with stale data in updateOrganization
            // updateSystemSettings manages the settings column exclusively
            const { settings: _unused, ...orgUpdates } = org

            await Promise.all([
                updateOrganization(org.id, orgUpdates),
                updateSystemSettings(settings, org.id),
                upsertProfile(profile)
            ])
            toast.success("Identity and settings updated!")
        } catch (error: any) {
            toast.error("Failed to update: " + error.message)
        } finally {
            setLoading(false)
        }
    }

        const fetchDeletionStatus = useCallback(async () => {
            if (!isCreator || !isAdmin) return
            setStatusLoading(true)
            try {
                const res = await fetch(`/api/organizations/deletion/status?orgId=${initialOrg.id}`)
                if (!res.ok) throw new Error("Status fetch failed")
                const data = await res.json()
                setDeletionStatus(data)
            } catch (e) {
                console.error("[DeletionStatus] fetch failed:", e)
                // Don't show error toast — this is background polling
            } finally {
                setStatusLoading(false)
            }
        }, [initialOrg.id, isCreator, isAdmin])

        // Fetch status on mount and poll every 30s if pending
        useEffect(() => {
            fetchDeletionStatus()
            let interval: NodeJS.Timeout | null = null
            if (deletionStatus?.hasPendingRequest) {
                interval = setInterval(fetchDeletionStatus, 30000)
            }
            return () => { if (interval) clearInterval(interval) }
        }, [fetchDeletionStatus, deletionStatus?.hasPendingRequest])

        const handleRequestDeletion = async () => {
            if (deleteConfirmText.trim() !== org.name.trim()) {
                toast.error("Organization name doesn't match — type it exactly")
                return
            }
            setIsRequesting(true)
            try {
                const res = await fetch("/api/organizations/deletion/request", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orgId: org.id })
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error)

                if (data.deleted) {
                    toast.success("Organization permanently deleted")
                    router.push("/setup-organization")
                    return
                }

                toast.success(`Deletion request sent to ${data.pendingOwners} owner(s) for approval`)
                setShowDeleteSection(false)
                setDeleteConfirmText("")
                await fetchDeletionStatus()
            } catch (error: any) {
                toast.error(error.message)
            } finally {
                setIsRequesting(false)
            }
        }

        const handleCancelDeletion = async () => {
            setIsCancelling(true)
            try {
                const res = await fetch("/api/organizations/deletion/cancel", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orgId: org.id })
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error)
                toast.success("Deletion request cancelled — your organization is safe")
                setDeletionStatus({ hasPendingRequest: false })
            } catch (error: any) {
                toast.error(error.message)
            } finally {
                setIsCancelling(false)
            }
        }

        return (
        <div className="space-y-12">
            {/* Owner Identity Section */}
            <section className="space-y-6">
                <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                    <User className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-bold">Your Identity</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Legal Name</Label>
                        <Input
                            value={profile.name || ""}
                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                            className="h-10 font-medium"
                            placeholder="Full Name"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Authorized Email</Label>
                        <div className="relative">
                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                            <Input
                                value={profile.email}
                                disabled
                                className="h-10 pl-10 bg-muted/30 cursor-not-allowed border-dashed"
                            />
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-2">
                            <Shield className="h-3 w-3" /> System Role
                        </Label>
                        <p className="text-sm font-bold capitalize">{orgRole || profile.role}</p>
                    </div>

                    <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-2">
                            <BadgeCheck className="h-3 w-3 text-emerald-500" /> Member Since
                        </Label>
                        <p className="text-sm font-bold">
                            {new Date(profile.created_at).toLocaleDateString('en-IN', {
                                month: 'long',
                                year: 'numeric'
                            })}
                        </p>
                    </div>

                </div>
            </section>

            {/* Business Profile Section */}
            <section className="space-y-6">
                <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-bold">Organization Identity</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Organization Display Name</Label>
                        <Input
                            value={org.name}
                            onChange={(e) => setOrg({ ...org, name: e.target.value })}
                            className="h-10 font-medium"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Access Link (Slug)</Label>
                        <div className="relative flex items-center">
                            <Globe size={14} className="absolute left-3 text-muted-foreground opacity-50" />
                            <Input
                                value={org.slug}
                                onChange={(e) => setOrg({ ...org, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-') })}
                                className="h-10 pl-10 font-medium"
                                placeholder="my-business"
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                            Your app is at <span className="text-primary font-bold">khataplus.online/{org.slug}/dashboard</span>
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">GSTIN / Tax ID</Label>
                        <div className="relative flex items-center">
                            <BadgeCheck size={14} className="absolute left-3 text-emerald-500" />
                            <Input
                                value={org.gstin || ""}
                                onChange={(e) => setOrg({ ...org, gstin: e.target.value.toUpperCase() })}
                                className="h-10 pl-10 font-mono uppercase"
                                placeholder="18AAAAA0000A1Z5"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Business Phone</Label>
                        <div className="relative flex items-center">
                            <Phone size={14} className="absolute left-3 text-muted-foreground opacity-50" />
                            <Input
                                value={org.phone || ""}
                                onChange={(e) => setOrg({ ...org, phone: e.target.value })}
                                className="h-10 pl-10"
                                placeholder="+91 00000 00000"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">UPI ID (for Direct Payments)</Label>
                        <div className="relative flex items-center">
                            <Percent size={14} className="absolute left-3 text-emerald-500" />
                            <Input
                                value={org.upi_id || ""}
                                onChange={(e) => setOrg({ ...org, upi_id: e.target.value })}
                                className="h-10 pl-10 font-mono"
                                placeholder="business@upi"
                            />
                        </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Business Address</Label>
                        <div className="relative flex items-center">
                            <MapPin size={14} className="absolute left-3 text-muted-foreground opacity-50" />
                            <Input
                                value={org.address || ""}
                                onChange={(e) => setOrg({ ...org, address: e.target.value })}
                                className="h-10 pl-10"
                                placeholder="Full business address..."
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* System Preferences Section */}
            <section className="space-y-6">
                <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                    <Percent className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-bold">Taxation & Operations</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-bold">Enable GST Invoicing</Label>
                            <p className="text-xs text-muted-foreground">Show GST fields in sales and invoices</p>
                        </div>
                        <Switch
                            checked={settings.gst_enabled}
                            onCheckedChange={(checked) => setSettings({ ...settings, gst_enabled: checked })}
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-bold">GST Inclusive Pricing</Label>
                            <p className="text-xs text-muted-foreground">Prices include tax by default</p>
                        </div>
                        <Switch
                            checked={settings.gst_inclusive}
                            onCheckedChange={(checked) => setSettings({ ...settings, gst_inclusive: checked })}
                        />
                    </div>
                </div>
            </section>

            {/* Staff Permissions Section */}
            <section className="space-y-6">
                <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                    <Info className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-bold">Staff Access Control</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { label: "Allow Staff Inventory Access", key: "allow_staff_inventory" },
                        { label: "Allow Staff Sales Access", key: "allow_staff_sales" },
                        { label: "Allow Staff Add Items", key: "allow_staff_add_inventory" },
                        { label: "Allow Staff Reports Access", key: "allow_staff_reports" },
                        { label: "Allow Staff Analytics", key: "allow_staff_analytics" },
                    ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between py-2 px-1">
                            <Label className="text-sm font-medium">{item.label}</Label>
                            <Switch
                                checked={(settings as any)[item.key]}
                                onCheckedChange={(checked) => setSettings({ ...settings, [item.key]: checked })}
                            />
                        </div>
                    ))}
                </div>
            </section>

            {/* Connected Automation Section (V2) */}
            <section className="space-y-6">
                <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                    <MessageCircle className="h-5 w-5 text-emerald-500" />
                    <h3 className="text-lg font-bold">Connected Automation</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/20 dark:bg-emerald-900/5">
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <Label className="text-sm font-bold">WhatsApp Automation Add-on</Label>
                                {org.whatsapp_addon_active && (
                                    <span className="bg-emerald-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase">Active</span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">Enable Smart Share & Automated Reminders</p>
                        </div>
                        <Switch
                            checked={org.whatsapp_addon_active}
                            onCheckedChange={(checked) => setOrg({ ...org, whatsapp_addon_active: checked })}
                        />
                    </div>

                    <div className={cn(
                        "flex items-center justify-between p-4 rounded-xl border transition-opacity",
                        org.whatsapp_addon_active ? "opacity-100" : "opacity-40 pointer-events-none"
                    )}>
                        <div className="space-y-0.5">
                            <Label className="text-sm font-bold">Auto Payment Reminders</Label>
                            <p className="text-xs text-muted-foreground">Send periodic alerts for overdue balances</p>
                        </div>
                        <Switch
                            checked={org.auto_reminders_enabled}
                            onCheckedChange={(checked) => setOrg({ ...org, auto_reminders_enabled: checked })}
                        />
                    </div>
                </div>
            </section>

            <div className="pt-6 border-t border-border/50">
                <Button
                    onClick={handleSave}
                    className="w-full h-14 text-lg font-black shadow-2xl active:scale-95 transition-all"
                    disabled={loading || !isAdmin}
                >
                    {loading ? "Synchronizing Identity..." : "Seal Identity & Configuration"}
                    {!loading && <Save className="ml-2 h-5 w-5" />}
                </Button>
            </div>
            {isAdmin && isCreator && (
                <section className="space-y-4 pt-8 border-t-2 border-red-100 dark:border-red-900/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-red-500" />
                            <h3 className="text-lg font-bold text-red-600">Danger Zone</h3>
                        </div>
                        {isCreator && (
                            <button
                                onClick={fetchDeletionStatus}
                                disabled={statusLoading}
                                className="text-xs text-zinc-400 hover:text-zinc-600 flex items-center gap-1"
                            >
                                <RefreshCw className={`h-3 w-3 ${statusLoading ? "animate-spin" : ""}`} />
                                Refresh
                            </button>
                        )}
                    </div>

                    {/* ── Pending deletion request status ── */}
                    {deletionStatus?.hasPendingRequest && (
                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5 space-y-4">
                            <div className="flex items-start gap-3">
                                <Clock className="h-5 w-5 text-amber-600 mt-0.5 shrink-0 animate-pulse" />
                                <div className="flex-1">
                                    <p className="font-bold text-amber-900 dark:text-amber-100">
                                        Deletion Request Pending
                                    </p>
                                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
                                        Waiting for{" "}
                                        {(deletionStatus.totalApproversNeeded ?? 0) - (deletionStatus.approvedCount ?? 0)}{" "}
                                        of {deletionStatus.totalApproversNeeded ?? 0} owner(s) to respond
                                    </p>
                                    {deletionStatus.expiresAt && (
                                        <p className="text-xs text-amber-600 mt-1">
                                            Expires: {new Date(deletionStatus.expiresAt).toLocaleDateString("en-IN", {
                                                day: "numeric", month: "long", year: "numeric"
                                            })}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Per-owner approval status */}
                            {deletionStatus.approvals && deletionStatus.approvals.length > 0 && (
                                <div className="space-y-2">
                                    {deletionStatus.approvals.map((approval: any) => (
                                        <div
                                            key={approval.ownerId}
                                            className="flex items-center justify-between bg-white dark:bg-zinc-900 rounded-lg px-4 py-3 border border-amber-100 dark:border-amber-900/30"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-zinc-400" />
                                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                                    {approval.ownerName}
                                                </span>
                                            </div>
                                            {approval.approved === true && (
                                                <div className="flex items-center gap-1.5 text-emerald-600">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    <span className="text-xs font-bold">Approved</span>
                                                </div>
                                            )}
                                            {approval.approved === false && (
                                                <div className="flex items-center gap-1.5 text-red-500">
                                                    <XCircle className="h-4 w-4" />
                                                    <span className="text-xs font-bold">Rejected</span>
                                                </div>
                                            )}
                                            {approval.approved === null && (
                                                <div className="flex items-center gap-1.5 text-zinc-400">
                                                    <Clock className="h-4 w-4" />
                                                    <span className="text-xs font-bold">Pending</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={handleCancelDeletion}
                                disabled={isCancelling}
                                className="w-full py-2.5 text-sm font-semibold text-amber-800 hover:text-amber-950 dark:text-amber-300 underline disabled:opacity-50 transition-colors"
                            >
                                {isCancelling ? "Cancelling..." : "Cancel Deletion Request"}
                            </button>
                        </div>
                    )}

                    {/* ── Deletion initiator UI ── */}
                    {!deletionStatus?.hasPendingRequest && (
                        <>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                Permanently delete this organization and all its data. This action is irreversible.
                                {" "}If other owners exist in the organization, <strong>all of them must approve</strong> before deletion proceeds.
                            </p>

                            {!showDeleteSection ? (
                                <Button
                                    variant="outline"
                                    className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-900 dark:hover:bg-red-950/20"
                                    onClick={() => setShowDeleteSection(true)}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Organization
                                </Button>
                            ) : (
                                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl p-6 space-y-5">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="font-bold text-red-900 dark:text-red-100 mb-2">
                                                This will permanently delete:
                                            </p>
                                            <ul className="text-sm text-red-700 dark:text-red-300 space-y-1 list-disc list-inside">
                                                <li>All products and inventory</li>
                                                <li>All sales and transaction history</li>
                                                <li>All customers and supplier records</li>
                                                <li>All khata ledger entries</li>
                                                <li>All reports and analytics data</li>
                                                <li>All team members and invitations</li>
                                                <li>All encrypted data (crypto-shredded, unrecoverable)</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-sm text-red-700 dark:text-red-300">
                                            Type <strong className="font-mono">{org.name}</strong> to confirm:
                                        </p>
                                        <input
                                            type="text"
                                            value={deleteConfirmText}
                                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                                            onPaste={(e) => e.preventDefault()} // Force manual typing
                                            placeholder={org.name}
                                            autoComplete="off"
                                            className="w-full border border-red-300 dark:border-red-800 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-red-400 dark:text-zinc-100"
                                        />
                                        <p className="text-[11px] text-red-500">Paste is disabled — type it manually</p>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => {
                                                setShowDeleteSection(false)
                                                setDeleteConfirmText("")
                                            }}
                                            disabled={isRequesting}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-40"
                                            onClick={handleRequestDeletion}
                                            disabled={
                                                deleteConfirmText.trim() !== org.name.trim() ||
                                                isRequesting
                                            }
                                        >
                                            {isRequesting ? (
                                                <span className="flex items-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Processing...
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-2">
                                                    <Trash2 className="h-4 w-4" />
                                                    Delete Forever
                                                </span>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </section>
            )}
        </div>
    )
}
