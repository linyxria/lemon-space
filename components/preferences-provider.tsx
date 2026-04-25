'use client'

import { useRouter } from '@bprogress/next/app'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { createContext, useContext, useEffect, useRef, useState } from 'react'

import { authClient } from '@/lib/auth-client'
import { type AppLocale, LOCALE_COOKIE_KEY } from '@/lib/i18n'
import { useTRPC } from '@/trpc/client'

type SortPreference = 'latest' | 'popular'

type PreferencesState = {
  showCardTags: boolean
  defaultSort: SortPreference
}

type PreferencesContextValue = PreferencesState & {
  locale: AppLocale
  setShowCardTags: (value: boolean) => void
  setDefaultSort: (value: SortPreference) => void
  setLocale: (value: AppLocale) => void
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

const STORAGE_KEY = 'lemon-gallery-preferences'

const DEFAULT_PREFERENCES: PreferencesState = {
  showCardTags: true,
  defaultSort: 'latest',
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
      showCardTags:
        typeof parsed.showCardTags === 'boolean'
          ? parsed.showCardTags
          : DEFAULT_PREFERENCES.showCardTags,
      defaultSort:
        parsed.defaultSort === 'popular'
          ? 'popular'
          : DEFAULT_PREFERENCES.defaultSort,
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
      onSuccess: (data) => {
        const nextSort: SortPreference =
          data.defaultSort === 'popular' ? 'popular' : 'latest'

        setPreferences({
          showCardTags: data.showCardTags,
          defaultSort: nextSort,
        })
      },
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
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  }, [preferences])

  const updatePreferences = (patch: Partial<PreferencesState>) => {
    setPreferences((current) => {
      const next = {
        ...current,
        ...patch,
      }

      if (session?.user) {
        const payload: {
          showCardTags?: boolean
          defaultSort?: SortPreference
        } = {}

        if (patch.showCardTags !== undefined)
          payload.showCardTags = patch.showCardTags
        if (patch.defaultSort !== undefined)
          payload.defaultSort = patch.defaultSort

        if (Object.keys(payload).length > 0) {
          savePreferencesMutation.mutate(payload)
        }
      }

      return next
    })
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
        ...preferences,
        locale,
        setShowCardTags: (value) => updatePreferences({ showCardTags: value }),
        setDefaultSort: (value) => updatePreferences({ defaultSort: value }),
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
