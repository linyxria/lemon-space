import { cookies } from "next/headers"
import { getRequestConfig } from "next-intl/server"

import { DEFAULT_LOCALE, LOCALE_COOKIE_KEY, resolveLocale } from "@/lib/i18n"

const messageLoaders = {
  "en-US": () => import("../messages/en-US.json"),
  "zh-CN": () => import("../messages/zh-CN.json"),
} as const

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value)
  const resolvedLocale = locale || DEFAULT_LOCALE

  return {
    locale: resolvedLocale,
    messages: (await messageLoaders[resolvedLocale]()).default,
  }
})
