"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, type Locale, getDictionary, localeOptions, normalizeLocale } from "@/lib/i18n"
import { getFormattingLocale } from "@/lib/locale-format"

type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  dictionary: ReturnType<typeof getDictionary>
  localeOptions: typeof localeOptions
  formattingLocale: string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: React.ReactNode
  initialLocale?: Locale
}) {
  const router = useRouter()
  const [locale, setLocaleState] = useState<Locale>(normalizeLocale(initialLocale))

  useEffect(() => {
    document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=31536000; samesite=lax`
    document.documentElement.lang = getDictionary(locale).htmlLang
  }, [locale])

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale: (nextLocale) => {
        setLocaleState(normalizeLocale(nextLocale))
        router.refresh()
      },
      dictionary: getDictionary(locale),
      localeOptions,
      formattingLocale: getFormattingLocale(locale),
    }),
    [locale, router]
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error("useLocale must be used inside LocaleProvider")
  }
  return context
}
