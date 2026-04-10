"use client"

import { Globe } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLocale } from "@/components/locale-provider"
import type { Locale } from "@/lib/i18n"
import { getLocaleCopy } from "@/lib/locale-copy"

export function LanguageSwitcher({
  className = "",
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  const { locale, setLocale, localeOptions } = useLocale()
  const copy = getLocaleCopy(locale)

  return (
    <div className={className}>
      <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
        <SelectTrigger
          className={
            compact
              ? "h-9 min-w-[132px] rounded-xl border-zinc-200 bg-white/90 text-xs font-black"
              : "h-10 min-w-[172px] rounded-xl border-zinc-200 bg-white/90 text-xs font-black"
          }
          aria-label={copy.shared.selectLanguage}
        >
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-emerald-600" />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-2xl">
          {localeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value} className="text-xs font-semibold">
              {option.nativeLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
