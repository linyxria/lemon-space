import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'

import AvatarUploadCard from './_components/avatar-upload-card'
import { PreferencesPanel } from './_components/preferences-panel'
import { ProfileOverview } from './_components/profile-overview'

export default async function ProfilePage() {
  const t = await getTranslations('Profile')
  prefetch(trpc.user.info.queryOptions())
  prefetch(trpc.user.stats.queryOptions())
  prefetch(trpc.user.preferences.queryOptions())

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col">
      <div className="from-hero via-hero to-primary/35 text-hero-foreground mb-8 rounded-[28px] bg-linear-to-r px-5 py-5 shadow-[0_20px_50px_-28px_rgba(24,24,27,0.6)] sm:px-6 sm:py-6">
        <p className="text-primary text-[11px] font-semibold tracking-[0.28em] uppercase">
          {t('badge')}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
          {t('title')}
        </h1>
        <p className="text-hero-muted mt-2 max-w-3xl text-sm leading-6 sm:text-[15px]">
          {t('description')}
        </p>
      </div>
      <HydrateClient>
        <Suspense
          fallback={
            <div className="flex w-fit items-center gap-4">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="grid gap-2">
                <Skeleton className="h-4 w-37.5" />
                <Skeleton className="h-4 w-25" />
              </div>
            </div>
          }
        >
          <AvatarUploadCard />
        </Suspense>
        <Suspense
          fallback={<Skeleton className="mb-8 h-72 w-full rounded-[28px]" />}
        >
          <ProfileOverview />
        </Suspense>
        <Suspense
          fallback={<Skeleton className="h-96 w-full rounded-[28px]" />}
        >
          <PreferencesPanel />
        </Suspense>
      </HydrateClient>
    </div>
  )
}
