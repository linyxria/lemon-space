"use client"

import { useSyncExternalStore } from "react"

const subscribeToHydration = () => () => {}

export function useHydrated() {
  return useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  )
}
