"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { Organization, Profile, SystemSettings } from "@/lib/types"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Save, Loader2, User, Building2, Globe, Shield, Receipt, MapPin, Phone, Mail, Zap, CheckCircle2, Hash, Copy, Rocket } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLocale } from "@/components/locale-provider"
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
  const parts = (raw || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  const pinPattern = /\b\d{6}\b/

  const stateByNorm = new Map(
    INDIAN_STATES.map((state) => [normalizeStateName(state), state])
  )

  let pin = ""
  for (let i = parts.length - 1; i >= 0; i--) {
    const m = parts[i].match(pinPattern)
    if (m) {
      pin = m[0]
      parts[i] = parts[i].replace(pinPattern, "").trim()
      if (!parts[i]) parts.splice(i, 1)
      break
    }
  }

  let state = ""
  for (let i = parts.length - 1; i >= 0; i--) {
    const resolved = stateByNorm.get(normalizeStateName(parts[i]))
    if (resolved) {
      state = resolved
      parts.splice(i, 1)
      break
    }
  }

  const city = parts.length > 0 ? parts.pop() || "" : ""
  const district = parts.length > 0 ? parts.pop() || "" : ""
  const street = parts.join(", ")

  return { street, city, district, state, pin: pin.replace(/\D/g, "").slice(0, 6) }
}

function combineAddress(addr: { street: string; city: string; district: string; state: string; pin: string }) {
  return [addr.street, addr.city, addr.district, addr.state, addr.pin]
    .map(s => s.trim())
    .filter(Boolean)
    .join(", ")
}

function normalizeSlug(value?: string | null) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
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
  billingNudge?: {
    showAnnualNudge: boolean
    spentThisYear: number
    saveWithAnnual: number
    targetPlan: "keep" | "starter" | "pro"
  }
}

export function SettingsForm({
  initialOrg,
  initialSettings,
  initialProfile,
  isAdmin,
  viewMode = "full",
  billingNudge: _billingNudge,
}: SettingsFormProps) {
  const { dictionary } = useLocale()
  const [org, setOrg] = useState(initialOrg)
  const [profile, setProfile] = useState(initialProfile)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [address, setAddress] = useState(() => parseAddress(initialOrg.address))
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid" | "error">("idle")
  const [slugMessage, setSlugMessage] = useState("")
  const [slugSuggestions, setSlugSuggestions] = useState<string[]>([])

  const isProfileView = viewMode === "profile"
  const showProfileSection = viewMode !== "organization"
  const showOrganizationSections = viewMode !== "profile"
  const normalizedSlug = useMemo(() => normalizeSlug(org.slug), [org.slug])
  const initialNormalizedSlug = useMemo(() => normalizeSlug(initialOrg.slug), [initialOrg.slug])

  const canSave = useMemo(() => {
    if (isProfileView) return true
    return isAdmin
  }, [isAdmin, isProfileView])

  const planLabel = useMemo(() => {
    const raw = String(org.plan_type || "free").toLowerCase()
    if (raw === "pro") return "Pro"
    if (raw === "starter") return "Starter"
    if (raw === "business") return "Business"
    if (raw === "legacy") return "Legacy"
    return "Keep"
  }, [org.plan_type])

  const planStatus = useMemo(() => {
    const raw = String(org.subscription_status || "active").toLowerCase()
    if (raw === "trial") return "Trial"
    if (raw === "past_due") return "Past Due"
    if (raw === "canceled") return "Canceled"
    return "Active"
  }, [org.subscription_status])

  const trialEndsText = useMemo(() => {
    if (!org.trial_ends_at) return ""
    const date = new Date(org.trial_ends_at)
    if (Number.isNaN(date.getTime())) return ""
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
  }, [org.trial_ends_at])

  const pinStateValidation = useMemo(() => {
    const pin = (address.pin || "").replace(/\D/g, "")
    const state = (address.state || "").trim()

    if (!pin) return { kind: "idle" as const, message: "" }
    if (pin.length < 6) return { kind: "invalid" as const, message: dictionary.settings.pinMustBeSixDigits }

    const inferredState = inferIndianStateFromPin(pin)
    if (!inferredState) {
      return { kind: "unknown" as const, message: dictionary.settings.pinRegionUnknown }
    }

    if (!state) return { kind: "warn" as const, message: dictionary.settings.enterStateToVerify(pin, inferredState) }

    const same = normalizeStateName(state) === normalizeStateName(inferredState)
    if (!same) {
      return { kind: "mismatch" as const, message: dictionary.settings.pinStateMismatch(pin, inferredState, state) }
    }

    return { kind: "ok" as const, message: dictionary.settings.pinMatchesState(pin, inferredState) }
  }, [address.pin, address.state, dictionary.settings])

  const isPinStateMismatch = pinStateValidation.kind === "mismatch"
  const hasAddressValidationError = pinStateValidation.kind === "mismatch" || pinStateValidation.kind === "invalid"
  const hasSlugValidationError = isAdmin && showOrganizationSections && !isProfileView && (slugStatus === "taken" || slugStatus === "invalid" || slugStatus === "error")
  const readableDisabledFieldClass = "disabled:opacity-100 disabled:text-zinc-900 dark:disabled:text-zinc-100"
  const fieldSurfaceClass = "bg-white border-zinc-100 dark:bg-[rgba(30,41,59,0.72)] dark:border-white/10"
  const mutedFieldSurfaceClass = "bg-zinc-50 border-zinc-100 dark:bg-[rgba(15,23,42,0.72)] dark:border-white/8"
  const surfaceInputClass = "bg-white/95 border-zinc-100 dark:bg-[rgba(30,41,59,0.72)] dark:border-white/10 dark:text-zinc-100 dark:placeholder:text-zinc-500"
  const mutedSurfaceClass = "bg-zinc-50/90 border-zinc-100 dark:bg-[rgba(15,23,42,0.72)] dark:border-white/10"

  useEffect(() => {
    if (!isAdmin || isProfileView || !showOrganizationSections) {
      setSlugStatus("idle")
      setSlugMessage("")
      setSlugSuggestions([])
      return
    }

    if (!normalizedSlug) {
      setSlugStatus("idle")
      setSlugMessage(dictionary.settings.slugHint)
      setSlugSuggestions([])
      return
    }

    if (normalizedSlug.length < 3) {
      setSlugStatus("invalid")
      setSlugMessage(dictionary.settings.slugTooShort)
      setSlugSuggestions([])
      return
    }

    if (normalizedSlug === initialNormalizedSlug) {
      setSlugStatus("available")
      setSlugMessage(dictionary.settings.currentSlugInUse)
      setSlugSuggestions([])
      return
    }

    const ctrl = new AbortController()
    const timer = window.setTimeout(async () => {
      setSlugStatus("checking")
      setSlugMessage(dictionary.settings.checkingSlugAvailability)
      setSlugSuggestions([])
      try {
        const params = new URLSearchParams({
          slug: normalizedSlug,
          currentOrgId: String(org.id || ""),
          limit: "4",
        })
        const res = await fetch(`/api/organizations/slug-suggestions?${params.toString()}`, {
          method: "GET",
          cache: "no-store",
          signal: ctrl.signal,
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || "Could not verify slug")
        if (data?.available) {
          setSlugStatus("available")
          setSlugMessage(dictionary.settings.slugAvailable)
          setSlugSuggestions([])
        } else {
          setSlugStatus("taken")
          setSlugMessage(dictionary.settings.slugTaken)
          setSlugSuggestions(Array.isArray(data?.suggestions) ? data.suggestions.slice(0, 4) : [])
        }
      } catch (error: any) {
        if (error?.name === "AbortError") return
        setSlugStatus("error")
        setSlugMessage(dictionary.settings.slugCheckFailed)
        setSlugSuggestions([])
      }
    }, 350)

    return () => {
      ctrl.abort()
      window.clearTimeout(timer)
    }
  }, [dictionary.settings.checkingSlugAvailability, dictionary.settings.currentSlugInUse, dictionary.settings.slugAvailable, dictionary.settings.slugCheckFailed, dictionary.settings.slugHint, dictionary.settings.slugTaken, dictionary.settings.slugTooShort, initialNormalizedSlug, isAdmin, isProfileView, normalizedSlug, org.id, showOrganizationSections])

  const handleSave = async () => {
    if (!canSave) {
      toast.error(dictionary.settings.noPermission)
      return
    }
    if (hasAddressValidationError) {
      toast.error(dictionary.settings.addressValidationFailed)
      return
    }
    if (hasSlugValidationError) {
      toast.error(dictionary.settings.slugValidationFailed)
      return
    }

    setLoading(true)
    const currentSlug = normalizeSlug(initialOrg.slug)
    const nextSlug = normalizeSlug(org.slug)
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
      if (!res.ok) throw new Error(data?.error || dictionary.settings.settingsUpdateFailed)

      toast.success(dictionary.settings.settingsUpdated)

      if (slugChanged && nextSlug) {
        toast.info(dictionary.settings.redirectingToUpdatedUrl(nextSlug), { duration: 4000 })
        setTimeout(() => {
          window.location.href = `/${nextSlug}/dashboard/settings`
        }, 700)
      } else {
        router.refresh()
      }
    } catch (error: any) {
      console.error("Settings update failed:", error)
      toast.error(error?.message || dictionary.settings.updateFailed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 md:animate-in md:fade-in md:slide-in-from-bottom-2 md:duration-700">
      {showProfileSection && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <User size={16} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100">{dictionary.settings.personalData}</h3>
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none">{dictionary.settings.privateAccountIdentity}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SettingField label={dictionary.settings.fullName} icon={<User size={14} />}>
              <Input
                value={profile.name || ""}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className={cn("h-10 rounded-xl font-bold text-xs", surfaceInputClass)}
              />
            </SettingField>

            <SettingField label={dictionary.settings.emailAddress} icon={<Mail size={14} />} disabled>
              <Input
                value={profile.email}
                disabled
                className={cn("h-10 rounded-xl font-medium italic opacity-60 text-xs", mutedSurfaceClass)}
              />
            </SettingField>

            <SettingField label={dictionary.settings.directContact} icon={<Phone size={14} />}>
              <Input
                value={profile.phone || ""}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className={cn("h-10 rounded-xl font-bold text-xs", surfaceInputClass)}
                placeholder={dictionary.settings.phonePlaceholder}
              />
            </SettingField>

            <SettingField label={dictionary.settings.systemPermissions} icon={<Shield size={14} />} disabled>
              <div className={cn("h-10 flex items-center px-4 rounded-xl border", mutedSurfaceClass)}>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{profile.role}</span>
              </div>
            </SettingField>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-[rgba(15,23,42,0.74)] dark:shadow-[0_14px_30px_rgba(0,0,0,0.22)]">
            <div className="flex items-center gap-3 px-1">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <Globe size={16} strokeWidth={2.5} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100">Language</h3>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Choose your interface language</p>
              </div>
              <LanguageSwitcher compact className="shrink-0" />
            </div>
          </div>
        </div>
      )}

      {showOrganizationSections && (
        <div className="space-y-8">
          <div className="rounded-2xl border border-emerald-200/70 dark:border-emerald-900/40 bg-gradient-to-r from-emerald-50/90 to-cyan-50/60 dark:from-emerald-950/20 dark:to-cyan-950/20 p-4 md:p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="space-y-1">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{dictionary.settings.currentPlan}</div>
                <div className="flex items-center gap-2.5">
                  <span className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100">{planLabel}</span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                      planStatus === "Active" && "text-emerald-700 border-emerald-300 bg-emerald-100/70 dark:text-emerald-300 dark:border-emerald-700 dark:bg-emerald-950/30",
                      planStatus === "Trial" && "text-blue-700 border-blue-300 bg-blue-100/70 dark:text-blue-300 dark:border-blue-700 dark:bg-blue-950/30",
                      planStatus === "Past Due" && "text-amber-700 border-amber-300 bg-amber-100/70 dark:text-amber-300 dark:border-amber-700 dark:bg-amber-950/30",
                      planStatus === "Canceled" && "text-rose-700 border-rose-300 bg-rose-100/70 dark:text-rose-300 dark:border-rose-700 dark:bg-rose-950/30"
                    )}
                  >
                    {planStatus}
                  </span>
                </div>
                {trialEndsText && planStatus === "Trial" && (
                  <p className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                    Trial ends on {trialEndsText}
                  </p>
                )}
              </div>
              <Link href="/pricing" className="w-full md:w-auto">
                <Button type="button" className="w-full md:w-auto bg-zinc-950 hover:bg-zinc-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold">
                  <Rocket className="h-4 w-4 mr-2" />
                  Upgrade Plan
                </Button>
              </Link>
            </div>
          </div>

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
                  className={cn("h-10 rounded-xl font-mono text-[10px] font-bold opacity-70 pr-11", mutedSurfaceClass, readableDisabledFieldClass)}
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
                    className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 transition-colors hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-[rgba(15,23,42,0.92)] dark:text-zinc-300 dark:hover:text-zinc-100"
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
                  className={cn("h-10 rounded-xl font-black text-emerald-600 text-xs normal-case dark:text-emerald-300", surfaceInputClass, readableDisabledFieldClass)}
                />
              </SettingField>

              <SettingField label="Unique Discovery Slug" icon={<Globe size={14} />}>
                <div className="relative">
                  <Input
                    value={org.slug || ""}
                    onChange={(e) => setOrg({ ...org, slug: normalizeSlug(e.target.value) })}
                    disabled={!isAdmin}
                    className={cn(
                      "h-10 rounded-xl font-bold pl-14 text-xs",
                      surfaceInputClass,
                      readableDisabledFieldClass,
                      slugStatus === "taken" || slugStatus === "invalid" || slugStatus === "error"
                        ? "border-rose-300 dark:border-rose-500/40"
                        : slugStatus === "available"
                          ? "border-emerald-300 dark:border-emerald-500/40"
                          : ""
                    )}
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-zinc-400 uppercase tracking-tighter border-r pr-2 border-zinc-100 dark:border-zinc-800 leading-none">kh+/</div>
                </div>
                <div className="mt-1.5 space-y-1.5">
                  <p className={cn(
                    "text-[10px] font-semibold",
                    slugStatus === "available" && "text-emerald-600 dark:text-emerald-400",
                    slugStatus === "checking" && "text-zinc-500 dark:text-zinc-400",
                    (slugStatus === "taken" || slugStatus === "invalid" || slugStatus === "error") && "text-rose-600 dark:text-rose-400",
                    slugStatus === "idle" && "text-zinc-500 dark:text-zinc-400"
                  )}>
                    {slugMessage || "Use lowercase letters, numbers, and hyphens."}
                  </p>
                  {slugSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {slugSuggestions.map((candidate) => (
                        <button
                          key={candidate}
                          type="button"
                          onClick={() => setOrg({ ...org, slug: candidate })}
                          className="px-2 py-1 rounded-md text-[10px] font-bold border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-500/30 dark:text-emerald-300 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20"
                        >
                          {candidate}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </SettingField>

              <SettingField label="GST Registration" icon={<Receipt size={14} />}>
                <Input
                  value={org.gstin || ""}
                  onChange={(e) => setOrg({ ...org, gstin: e.target.value })}
                  disabled={!isAdmin}
                  className={cn("h-10 rounded-xl font-mono text-[10px] font-bold", surfaceInputClass, readableDisabledFieldClass)}
                  placeholder="22AAAAA0000A1Z5"
                />
              </SettingField>

              <SettingField label="Org Contact" icon={<Phone size={14} />}>
                <Input
                  value={org.phone || ""}
                  onChange={(e) => setOrg({ ...org, phone: e.target.value })}
                  disabled={!isAdmin}
                  className={cn("h-10 rounded-xl font-bold text-xs", surfaceInputClass, readableDisabledFieldClass)}
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

                <div className="grid grid-cols-1 gap-4 rounded-2xl border border-dashed border-zinc-100 bg-zinc-50/60 p-4 dark:border-white/10 dark:bg-[rgba(15,23,42,0.55)] md:grid-cols-2">
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
                        className={cn("h-10 rounded-xl font-medium text-xs", surfaceInputClass, readableDisabledFieldClass)}
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
                      className={cn("h-10 rounded-xl font-bold text-xs", surfaceInputClass)}
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
                          "h-10 w-full rounded-xl font-bold text-xs",
                          surfaceInputClass,
                          readableDisabledFieldClass,
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
                        "h-10 rounded-xl font-mono font-bold text-xs tracking-widest",
                        surfaceInputClass,
                        readableDisabledFieldClass,
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
          disabled={loading || !canSave || hasAddressValidationError || hasSlugValidationError}
          className={cn(
            "h-11 px-8 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] transition-colors md:transition-all md:duration-500 shadow-xl",
            canSave
              ? "bg-gradient-to-r from-amber-200 via-orange-200 to-rose-200 text-slate-900 md:hover:from-amber-100 md:hover:via-orange-100 md:hover:to-rose-100 md:hover:scale-105 md:active:scale-95 shadow-orange-200/70 dark:from-amber-300 dark:via-orange-300 dark:to-rose-300 dark:text-slate-950 dark:shadow-orange-950/50"
              : "bg-zinc-100 text-zinc-400 grayscale cursor-not-allowed"
          )}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-2" />}
          {loading ? dictionary.settings.saving : dictionary.settings.saveChanges}
        </Button>
      </div>
    </div>
  )
}

function SettingField({ label, icon, children, disabled }: { label: string, icon?: React.ReactNode, children: React.ReactNode, disabled?: boolean }) {
  return (
    <div className={cn("space-y-2 group transition-colors md:transition-all", disabled && "opacity-80")}>
      <div className="flex items-center gap-2 px-1">
        <span className="text-zinc-400 md:group-hover:text-foreground transition-colors">{icon}</span>
        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 md:group-hover:text-zinc-700 md:dark:group-hover:text-zinc-300 transition-colors">
          {label}
        </Label>
      </div>
      {children}
    </div>
  )
}

// Removing ControlSwitch from here since it will be moved to security-settings
