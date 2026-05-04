import { cookies } from "next/headers"
import { getRequestConfig } from "next-intl/server"

import { DEFAULT_LOCALE, LOCALE_COOKIE_KEY, resolveLocale } from "@/lib/i18n"

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value)

  return {
    locale: locale || DEFAULT_LOCALE,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
