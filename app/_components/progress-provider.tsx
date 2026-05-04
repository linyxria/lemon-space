"use client"

import { ProgressProvider as Provider } from "@bprogress/next/app"

export default function ProgressProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Provider color="#9ae600" options={{ showSpinner: false }}>
      {children}
    </Provider>
  )
}
