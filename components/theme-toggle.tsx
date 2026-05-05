"use client"

import { Moon, Sun } from "lucide-react"

import {
  type ThemePreference,
  usePreferences,
} from "@/components/preferences-provider"
import { Button } from "@/components/ui/button"
import { useHydrated } from "@/hooks/hydration"

type VisibleThemePreference = Exclude<ThemePreference, "system">

const THEME_SEQUENCE: VisibleThemePreference[] = ["light", "dark"]

function getVisibleTheme(theme: ThemePreference): VisibleThemePreference {
  return theme === "dark" ? "dark" : "light"
}

export function ThemeToggle({ label }: { label: string }) {
  const { setTheme, theme } = usePreferences()
  const isHydrated = useHydrated()
  const currentTheme = getVisibleTheme(isHydrated ? theme : "light")
  const Icon = currentTheme === "dark" ? Moon : Sun
  const nextTheme =
    THEME_SEQUENCE[
      (THEME_SEQUENCE.indexOf(currentTheme) + 1) % THEME_SEQUENCE.length
    ]

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="text-muted-foreground hover:text-foreground rounded-full"
      onClick={() => setTheme(nextTheme)}
      aria-label={label}
      title={label}
    >
      <Icon className="size-4" />
    </Button>
  )
}
