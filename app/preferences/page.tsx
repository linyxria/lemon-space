import { Suspense } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'

import { PreferencesPanel } from './_components/preferences-panel'

export default function PreferencesPage() {
  prefetch(trpc.user.preferences.queryOptions())

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <HydrateClient>
        <Suspense
          fallback={<Skeleton className="h-96 w-full rounded-[28px]" />}
        >
          <PreferencesPanel />
        </Suspense>
      </HydrateClient>
    </div>
  )
}
