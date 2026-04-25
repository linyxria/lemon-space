'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'

type ThemeContextValue = {
  theme: ThemePreference
  setTheme: (theme: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function resolveTheme(theme: ThemePreference, enableSystem: boolean) {
  if (theme !== 'system' || !enableSystem) return theme

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function applyTheme(theme: ThemePreference, enableSystem: boolean) {
  const resolvedTheme = resolveTheme(theme, enableSystem)

  document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
  document.documentElement.style.colorScheme = resolvedTheme
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  enableSystem = true,
}: {
  children: React.ReactNode
  attribute?: 'class'
  defaultTheme?: ThemePreference
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}) {
  const [theme, setTheme] = useState<ThemePreference>(defaultTheme)

  useEffect(() => {
    applyTheme(theme, enableSystem)
  }, [enableSystem, theme])

  useEffect(() => {
    if (theme !== 'system' || !enableSystem) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => applyTheme('system', true)

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [enableSystem, theme])

  const handleThemeChange = useCallback((nextTheme: ThemePreference) => {
    setTheme(nextTheme)
    applyTheme(nextTheme, true)
  }, [])

  const value = useMemo(
    () => ({
      theme,
      setTheme: handleThemeChange,
    }),
    [handleThemeChange, theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
