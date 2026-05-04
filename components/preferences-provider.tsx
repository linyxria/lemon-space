'use client'

import { useRouter } from '@bprogress/next/app'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { createContext, useContext, useEffect, useRef, useState } from 'react'

import { authClient } from '@/lib/auth-client'
import { type AppLocale, LOCALE_COOKIE_KEY } from '@/lib/i18n'
import { useTRPC } from '@/trpc/client'

import { type ThemePreference, useTheme } from './theme-provider'

type PreferencesState = {
  theme: ThemePreference
}

type PreferencesContextValue = PreferencesState & {
  locale: AppLocale
  setTheme: (value: ThemePreference) => void
  setLocale: (value: AppLocale) => void
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

const STORAGE_KEY = 'lemon-space-preferences'

const DEFAULT_PREFERENCES: PreferencesState = {
  theme: 'system',
}

function normalizeTheme(value: unknown): ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system'
    ? value
    : DEFAULT_PREFERENCES.theme
}

function readStoredPreferences(): PreferencesState {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return DEFAULT_PREFERENCES

  try {
    const parsed = JSON.parse(raw) as Partial<PreferencesState>

    return {
      theme: normalizeTheme(parsed.theme),
    }
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return DEFAULT_PREFERENCES
  }
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
  const { setTheme: setNextTheme } = useTheme()
  const { data: session } = authClient.useSession()
  const hasUserSwitchedLocaleRef = useRef(false)
  const hasAppliedRemoteLocaleRef = useRef(false)
  const [preferences, setPreferences] = useState<PreferencesState>(
    readStoredPreferences,
  )

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

  const remotePreferences = preferencesQuery.data
    ? {
        theme: normalizeTheme(preferencesQuery.data.theme),
      }
    : null
  const resolvedPreferences = remotePreferences ?? preferences

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
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(resolvedPreferences),
    )
  }, [resolvedPreferences])

  useEffect(() => {
    setNextTheme(resolvedPreferences.theme)
  }, [resolvedPreferences.theme, setNextTheme])

  const updatePreferences = (patch: Partial<PreferencesState>) => {
    const next = {
      ...resolvedPreferences,
      ...patch,
    }

    setPreferences(next)

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
    throw new Error('usePreferences must be used within PreferencesProvider')
  }
  return context
}
