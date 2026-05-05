"use client"

import { useRouter } from "@bprogress/next/app"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useLocale } from "next-intl"
import { useTheme } from "next-themes"
import { createContext, useContext, useEffect, useRef } from "react"

import { useHydrated } from "@/hooks/hydration"
import { authClient } from "@/lib/auth-client"
import { type AppLocale, LOCALE_COOKIE_KEY } from "@/lib/i18n"
import { useTRPC } from "@/trpc/client"

export type ThemePreference = "light" | "dark" | "system"

type PreferencesState = {
  theme: ThemePreference
}

type PreferencesContextValue = PreferencesState & {
  locale: AppLocale
  setTheme: (value: ThemePreference) => void
  setLocale: (value: AppLocale) => void
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

const DEFAULT_PREFERENCES: PreferencesState = {
  theme: "system",
}

function normalizeTheme(value: unknown): ThemePreference {
  return value === "light" || value === "dark" || value === "system"
    ? value
    : DEFAULT_PREFERENCES.theme
}

export default function PreferencesProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const trpc = useTRPC()
  const router = useRouter()
  const locale = useLocale() as AppLocale
  const queryClient = useQueryClient()
  const { setTheme: setNextTheme, theme: nextTheme } = useTheme()
  const { data: session } = authClient.useSession()
  const isHydrated = useHydrated()
  const hasUserSwitchedLocaleRef = useRef(false)
  const hasAppliedRemoteLocaleRef = useRef(false)

  const preferencesQuery = useQuery(
    trpc.user.preferences.queryOptions(undefined, {
      enabled: Boolean(session?.user),
      staleTime: 60_000,
    }),
  )

  const savePreferencesMutation = useMutation(
    trpc.user.updatePreferences.mutationOptions({
      onSuccess: (nextPreferences) => {
        queryClient.setQueryData(
          trpc.user.preferences.queryKey(),
          nextPreferences,
        )
      },
    }),
  )

  const remoteTheme = preferencesQuery.data
    ? normalizeTheme(preferencesQuery.data.theme)
    : null
  const resolvedPreferences = {
    theme: normalizeTheme(
      isHydrated ? (nextTheme ?? remoteTheme) : remoteTheme,
    ),
  }

  useEffect(() => {
    const nextLocale = preferencesQuery.data?.locale
    if (!nextLocale) return
    if (hasUserSwitchedLocaleRef.current) return

    if (nextLocale === locale) {
      hasAppliedRemoteLocaleRef.current = true
      return
    }
    if (hasAppliedRemoteLocaleRef.current) return

    hasAppliedRemoteLocaleRef.current = true
    document.cookie = `${LOCALE_COOKIE_KEY}=${nextLocale}; path=/; max-age=31536000; samesite=lax`
    router.refresh()
  }, [locale, preferencesQuery.data?.locale, router])

  useEffect(() => {
    if (!remoteTheme) return
    if (remoteTheme === nextTheme) return

    setNextTheme(remoteTheme)
  }, [nextTheme, remoteTheme, setNextTheme])

  const updatePreferences = (patch: Partial<PreferencesState>) => {
    const next = {
      ...resolvedPreferences,
      ...patch,
    }

    if (patch.theme !== undefined) {
      setNextTheme(patch.theme)
    }

    if (session?.user) {
      const payload: {
        theme?: ThemePreference
      } = {}

      if (patch.theme !== undefined) payload.theme = patch.theme

      if (Object.keys(payload).length > 0) {
        queryClient.setQueryData(trpc.user.preferences.queryKey(), {
          locale,
          ...next,
        })
        savePreferencesMutation.mutate(payload)
      }
    }
  }

  const setLocale = (value: AppLocale) => {
    if (value === locale) return

    hasUserSwitchedLocaleRef.current = true
    document.cookie = `${LOCALE_COOKIE_KEY}=${value}; path=/; max-age=31536000; samesite=lax`

    if (session?.user) {
      savePreferencesMutation.mutate({
        locale: value,
      })
    }

    router.refresh()
  }

  return (
    <PreferencesContext.Provider
      value={{
        ...resolvedPreferences,
        locale,
        setTheme: (value) => updatePreferences({ theme: value }),
        setLocale,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (!context) {
    throw new Error("usePreferences must be used within PreferencesProvider")
  }
  return context
}
