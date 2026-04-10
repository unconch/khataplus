import type { Locale } from "@/lib/i18n"

const formatterLocales: Record<Locale, string> = {
  en: "en-IN",
  hi: "hi-IN",
  as: "as-IN",
  bn: "bn-IN",
}

export function getFormattingLocale(locale: Locale): string {
  return formatterLocales[locale] || formatterLocales.en
}

export function formatNumber(value: number, locale: Locale, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(getFormattingLocale(locale), options).format(value)
}

export function formatCurrency(value: number, locale: Locale, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(getFormattingLocale(locale), {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    ...options,
  }).format(value)
}

export function formatCompactCurrency(value: number, locale: Locale, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(getFormattingLocale(locale), {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
    ...options,
  }).format(value)
}

export function formatDate(value: Date | string | number, locale: Locale, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(getFormattingLocale(locale), options).format(new Date(value))
}

export function formatDateTime(value: Date | string | number, locale: Locale, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(getFormattingLocale(locale), options).format(new Date(value))
}

export function formatTime(value: Date | string | number, locale: Locale, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(getFormattingLocale(locale), options).format(new Date(value))
}
