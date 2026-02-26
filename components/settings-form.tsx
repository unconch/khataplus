"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { Organization, Profile, SystemSettings } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Save, Loader2, User, Building2, Globe, Shield, Receipt, MapPin, Phone, Mail, Zap, CheckCircle2, Hash, Copy } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka",
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
]

// Helper: parse a comma-separated address string into structured parts
function parseAddress(raw?: string | null) {
  const parts = (raw || "").split(",").map(s => s.trim())
  const pinPattern = /\b\d{6}\b/

  const extractPin = (...fields: string[]) => {
    for (const f of fields) {
      const m = String(f || "").match(pinPattern)
      if (m) return m[0]
    }
    return ""
  }

  const pinFromAny = extractPin(parts[4] || "", parts[3] || "", parts[2] || "", parts[1] || "", parts[0] || "")
  const stripPin = (v: string) => String(v || "").replace(pinPattern, "").replace(/\s*-\s*$/, "").trim()

  return {
    street: stripPin(parts[0] || ""),
    city: stripPin(parts[1] || ""),
    district: stripPin(parts[2] || ""),
    state: stripPin(parts[3] || ""),
    pin: (parts[4] || pinFromAny || "").replace(/\D/g, "").slice(0, 6),
  }
}

function combineAddress(addr: { street: string; city: string; district: string; state: string; pin: string }) {
  return [addr.street, addr.city, addr.district, addr.state, addr.pin]
    .map(s => s.trim())
    .filter(Boolean)
    .join(", ")
}

function normalizeStateName(value: string) {
  return value.toLowerCase().replace(/[^a-z]/g, "")
}

// Conservative PIN -> state inference.
// Returns null where prefixes are shared by multiple states to avoid false mismatches.
function inferIndianStateFromPin(pin: string): string | null {
  const clean = pin.replace(/\D/g, "")
  if (clean.length !== 6) return null

  if (clean.startsWith("744")) return "Andaman and Nicobar Islands"
  if (clean.startsWith("682")) return "Lakshadweep"
  if (clean.startsWith("737")) return "Sikkim"

  const prefix2 = Number.parseInt(clean.slice(0, 2), 10)
  if (Number.isNaN(prefix2)) return null

  if (prefix2 === 11) return "Delhi"
  if (prefix2 >= 12 && prefix2 <= 13) return "Haryana"
  if (prefix2 >= 14 && prefix2 <= 16) return "Punjab"
  if (prefix2 === 17) return "Himachal Pradesh"
  if (prefix2 >= 18 && prefix2 <= 19) return "Jammu and Kashmir"
  if (prefix2 >= 36 && prefix2 <= 39) return "Gujarat"
  if (prefix2 >= 40 && prefix2 <= 44) return "Maharashtra"
  if (prefix2 >= 45 && prefix2 <= 48) return "Madhya Pradesh"
  if (prefix2 === 49) return "Chhattisgarh"
  if (prefix2 === 50) return "Telangana"
  if (prefix2 >= 56 && prefix2 <= 59) return "Karnataka"
  if (prefix2 >= 60 && prefix2 <= 64) return "Tamil Nadu"
  if (prefix2 >= 67 && prefix2 <= 69) return "Kerala"
  if (prefix2 >= 70 && prefix2 <= 74) return "West Bengal"
  if (prefix2 >= 75 && prefix2 <= 77) return "Odisha"
  if (prefix2 === 78) return "Assam"

  return null
}

interface SettingsFormProps {
  initialOrg: Organization
  initialSettings: SystemSettings
  initialProfile: Profile
  isAdmin: boolean
  orgRole?: string
  viewMode?: "full" | "profile" | "organization"
}

export function SettingsForm({
  initialOrg,
  initialSettings,
  initialProfile,
  isAdmin,
  viewMode = "full",
}: SettingsFormProps) {
  const [org, setOrg] = useState(initialOrg)
  const [profile, setProfile] = useState(initialProfile)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [address, setAddress] = useState(() => parseAddress(initialOrg.address))

  const isProfileView = viewMode === "profile"
  const showProfileSection = viewMode !== "organization"
  const showOrganizationSections = viewMode !== "profile"

  const canSave = useMemo(() => {
    if (isProfileView) return true
    return isAdmin
  }, [isAdmin, isProfileView])

  const pinStateValidation = useMemo(() => {
    const pin = (address.pin || "").replace(/\D/g, "")
    const state = (address.state || "").trim()

    if (!pin) return { kind: "idle" as const, message: "" }
    if (pin.length < 6) return { kind: "invalid" as const, message: "PIN code must be 6 digits." }

    const inferredState = inferIndianStateFromPin(pin)
    if (!inferredState) {
      return { kind: "unknown" as const, message: "PIN region not deterministically mapped. State check skipped." }
    }

    if (!state) return { kind: "warn" as const, message: `PIN ${pin} maps to ${inferredState}. Enter state to verify.` }

    const same = normalizeStateName(state) === normalizeStateName(inferredState)
    if (!same) {
      return { kind: "mismatch" as const, message: `PIN ${pin} maps to ${inferredState}, but state entered is ${state}.` }
    }

    return { kind: "ok" as const, message: `PIN ${pin} matches state ${inferredState}.` }
  }, [address.pin, address.state])

  const isPinStateMismatch = pinStateValidation.kind === "mismatch"
  const hasAddressValidationError = pinStateValidation.kind === "mismatch" || pinStateValidation.kind === "invalid"

  const handleSave = async () => {
    if (!canSave) {
      toast.error("You don't have permission to update settings")
      return
    }
    if (hasAddressValidationError) {
      toast.error("Address validation failed. Fix PIN/State before saving.")
      return
    }

    setLoading(true)
    const currentSlug = initialOrg.slug
    const nextSlug = org.slug?.toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
    const slugChanged = !!nextSlug && nextSlug !== currentSlug

    try {
      const { settings: _unused, ...orgUpdates } = org
      const res = await fetch("/api/settings/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isProfileView,
          org: orgUpdates,
          profile,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Settings update failed")

      toast.success("Identity and settings updated!")

      if (slugChanged && nextSlug) {
        toast.info(`Access URL updated to ${nextSlug}. Redirecting...`, { duration: 4000 })
        setTimeout(() => {
          window.location.href = `/${nextSlug}/dashboard/settings`
        }, 700)
      } else {
        router.refresh()
      }
    } catch (error: any) {
      console.error("Settings update failed:", error)
      toast.error(error?.message || "Update failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {showProfileSection && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <User size={16} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100">Personal Data</h3>
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Your Private Account Identity</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SettingField label="Full Name" icon={<User size={14} />}>
              <Input
                value={profile.name || ""}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 h-10 rounded-xl font-bold text-xs"
              />
            </SettingField>

            <SettingField label="Email Address" icon={<Mail size={14} />} disabled>
              <Input
                value={profile.email}
                disabled
                className="bg-zinc-50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800 h-10 rounded-xl font-medium italic opacity-60 text-xs"
              />
            </SettingField>

            <SettingField label="Direct Contact" icon={<Phone size={14} />}>
              <Input
                value={profile.phone || ""}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 h-10 rounded-xl font-bold text-xs"
                placeholder="+91 ..."
              />
            </SettingField>

            <SettingField label="System Permissions" icon={<Shield size={14} />} disabled>
              <div className="h-10 flex items-center px-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{profile.role}</span>
              </div>
            </SettingField>
          </div>
        </div>
      )}

      {showOrganizationSections && (
        <div className="space-y-8">
          <div className="space-y-5">
            <div className="flex items-center gap-3 px-2">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <Building2 size={18} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100">Company Profile</h3>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Public-facing organization details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SettingField label="Organization ID" icon={<Hash size={14} />} disabled>
                <div className="relative">
                  <Input
                    value={org.id || ""}
                    disabled
                    className="bg-zinc-50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800 h-10 rounded-xl font-mono text-[10px] font-bold opacity-70 pr-11"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!org.id) return
                      try {
                        await navigator.clipboard.writeText(String(org.id))
                        toast.success("Organization ID copied")
                      } catch {
                        toast.error("Failed to copy Organization ID")
                      }
                    }}
                    disabled={!org.id}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Copy organization ID"
                    title="Copy organization ID"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </SettingField>

              <SettingField label="Legitimacy Name" icon={<Building2 size={14} />}>
                <Input
                  value={org.name || ""}
                  onChange={(e) => setOrg({ ...org, name: e.target.value })}
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  disabled={!isAdmin}
                  className="bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 h-10 rounded-xl font-black text-emerald-600 dark:text-emerald-400 text-xs normal-case"
                />
              </SettingField>

              <SettingField label="Unique Discovery Slug" icon={<Globe size={14} />}>
                <div className="relative">
                  <Input
                    value={org.slug || ""}
                    onChange={(e) => setOrg({ ...org, slug: e.target.value })}
                    disabled={!isAdmin}
                    className="bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 h-10 rounded-xl font-bold pl-14 text-xs"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-zinc-400 uppercase tracking-tighter border-r pr-2 border-zinc-100 dark:border-zinc-800 leading-none">kh+/</div>
                </div>
              </SettingField>

              <SettingField label="GST Registration" icon={<Receipt size={14} />}>
                <Input
                  value={org.gstin || ""}
                  onChange={(e) => setOrg({ ...org, gstin: e.target.value })}
                  disabled={!isAdmin}
                  className="bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 h-10 rounded-xl font-mono text-[10px] font-bold"
                  placeholder="22AAAAA0000A1Z5"
                />
              </SettingField>

              <SettingField label="Org Contact" icon={<Phone size={14} />}>
                <Input
                  value={org.phone || ""}
                  onChange={(e) => setOrg({ ...org, phone: e.target.value })}
                  disabled={!isAdmin}
                  className="bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 h-10 rounded-xl font-bold text-xs"
                />
              </SettingField>

              <div className="md:col-span-2 mt-2">
                <div className="flex items-center gap-3 px-2 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600">
                    <MapPin size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100">Registered Address</h4>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Section-wise location</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl border border-dashed border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                  <div className="md:col-span-2">
                    <SettingField label="Building / Street" icon={<Building2 size={14} />}>
                      <Input
                        value={address.street}
                        onChange={(e) => {
                          const next = { ...address, street: e.target.value }
                          setAddress(next)
                          setOrg({ ...org, address: combineAddress(next) })
                        }}
                        disabled={!isAdmin}
                        className="bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 h-10 rounded-xl font-medium text-xs"
                      />
                    </SettingField>
                  </div>
                  <SettingField label="City / Town" icon={<MapPin size={14} />}>
                    <Input
                      value={address.city}
                      onChange={(e) => {
                        const next = { ...address, city: e.target.value }
                        setAddress(next)
                        setOrg({ ...org, address: combineAddress(next) })
                      }}
                      disabled={!isAdmin}
                      className="bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 h-10 rounded-xl font-bold text-xs"
                    />
                  </SettingField>
                  <SettingField label="State" icon={<Shield size={14} />}>
                    <Select
                      disabled={!isAdmin}
                      value={address.state}
                      onValueChange={(val) => {
                        const next = { ...address, state: val }
                        setAddress(next)
                        setOrg({ ...org, address: combineAddress(next) })
                      }}
                    >
                      <SelectTrigger
                        className={cn(
                          "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 h-10 rounded-xl font-bold text-xs w-full",
                          pinStateValidation.kind === "mismatch" && "border-red-400 focus-visible:ring-red-300"
                        )}
                      >
                        <SelectValue placeholder="Select State" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDIAN_STATES.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </SettingField>
                  <SettingField label="PIN Code" icon={<Hash size={14} />}>
                    <Input
                      value={address.pin}
                      onChange={(e) => {
                        const next = { ...address, pin: e.target.value.replace(/\D/g, "").slice(0, 6) }
                        setAddress(next)
                        setOrg({ ...org, address: combineAddress(next) })
                      }}
                      disabled={!isAdmin}
                      maxLength={6}
                      className={cn(
                        "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 h-10 rounded-xl font-mono font-bold text-xs tracking-widest",
                        pinStateValidation.kind === "mismatch" && "border-red-400 focus-visible:ring-red-300"
                      )}
                    />
                  </SettingField>
                  {pinStateValidation.kind !== "idle" && (
                    <div className={cn(
                      "md:col-span-2 text-[10px] font-bold px-2",
                      pinStateValidation.kind === "ok" && "text-emerald-600",
                      pinStateValidation.kind === "mismatch" && "text-red-600",
                      (pinStateValidation.kind === "warn" || pinStateValidation.kind === "invalid" || pinStateValidation.kind === "unknown") && "text-amber-600"
                    )}>
                      {pinStateValidation.message}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between p-1 border-t border-zinc-50 dark:border-zinc-800 mt-8 pt-8">
        <div className="hidden sm:flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-300">
          <div className="h-1 w-1 rounded-full bg-zinc-200 dark:bg-zinc-700" />
          Last calibrated: Feb 2026
        </div>
        <Button
          onClick={handleSave}
          disabled={loading || !canSave || hasAddressValidationError}
          className={cn(
            "h-11 px-8 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-500 shadow-xl",
            canSave ? "bg-zinc-950 dark:bg-zinc-100 hover:scale-105 active:scale-95 shadow-zinc-200 dark:shadow-zinc-950" : "bg-zinc-100 grayscale cursor-not-allowed"
          )}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-2" />}
          Commit Changes
        </Button>
      </div>
    </div>
  )
}

function SettingField({ label, icon, children, disabled }: { label: string, icon?: React.ReactNode, children: React.ReactNode, disabled?: boolean }) {
  return (
    <div className={cn("space-y-2 group transition-all", disabled && "opacity-80")}>
      <div className="flex items-center gap-2 px-1">
        <span className="text-zinc-400 group-hover:text-foreground transition-colors">{icon}</span>
        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">
          {label}
        </Label>
      </div>
      {children}
    </div>
  )
}

// Removing ControlSwitch from here since it will be moved to security-settings
