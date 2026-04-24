import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'

import AvatarUploadCard from './_components/avatar-upload-card'
import { ProfileOverview } from './_components/profile-overview'
import { ProfileTabs } from './_components/profile-tabs'

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: 'my' | 'likes' }>
}) {
  const { tab } = await searchParams
  const t = await getTranslations('Profile')
  prefetch(trpc.user.info.queryOptions())
  prefetch(trpc.user.stats.queryOptions())
  prefetch(trpc.user.dashboard.queryOptions())
  prefetch(trpc.asset.listByMe.queryOptions())
  prefetch(trpc.asset.listByMeLike.queryOptions())

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col">
      <div className="mb-8 rounded-[28px] bg-linear-to-r from-zinc-950 via-zinc-900 to-lime-950/90 px-5 py-5 text-white shadow-[0_20px_50px_-28px_rgba(24,24,27,0.6)] sm:px-6 sm:py-6">
        <p className="text-[11px] font-semibold tracking-[0.28em] text-lime-200/80 uppercase">
          {t('badge')}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
          {t('title')}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300 sm:text-[15px]">
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
          fallback={
            <div className="flex w-full max-w-xs flex-col gap-7">
              <div className="flex flex-col gap-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-full" />
              </div>
              <div className="flex flex-col gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-full" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
          }
        >
          <ProfileTabs defaultTab={tab === 'likes' ? 'likes' : 'my'} />
        </Suspense>
      </HydrateClient>
    </div>
  )
}
