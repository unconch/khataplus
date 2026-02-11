"use client"

import { useState } from "react"
import { Organization, SystemSettings, Profile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { updateOrganization, updateSystemSettings } from "@/lib/data/organizations"
import { upsertProfile } from "@/lib/data/profiles"
import { toast } from "sonner"
import { Building2, Save, BadgeCheck, Phone, MapPin, Globe, Percent, Info, User, Fingerprint, Shield } from "lucide-react"

interface SettingsFormProps {
    initialOrg: Organization
    initialSettings: SystemSettings
    initialProfile: Profile
    isAdmin: boolean
}

export function SettingsForm({ initialOrg, initialSettings, initialProfile, isAdmin }: SettingsFormProps) {
    const [org, setOrg] = useState(initialOrg)
    const [settings, setSettings] = useState(initialSettings)
    const [profile, setProfile] = useState(initialProfile)
    const [loading, setLoading] = useState(false)

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
                        <p className="text-sm font-bold capitalize">{profile.role}</p>
                    </div>

                    <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-2">
                            <Fingerprint className="h-3 w-3" /> Status
                        </Label>
                        <p className={`text-sm font-bold capitalize ${profile.status === 'approved' ? 'text-emerald-500' : 'text-orange-500'}`}>
                            {profile.status}
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
        </div>
    )
}
