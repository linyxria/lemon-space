export const LOCALE_COOKIE_KEY = 'lemon-space-locale'

export const SUPPORTED_LOCALES = ['zh-CN', 'en-US'] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: AppLocale = 'zh-CN'

export function hasLocale(locale: string): locale is AppLocale {
  return SUPPORTED_LOCALES.includes(locale as AppLocale)
}

export function resolveLocale(locale?: string | null): AppLocale {
  if (!locale) return DEFAULT_LOCALE
  return hasLocale(locale) ? locale : DEFAULT_LOCALE
}
