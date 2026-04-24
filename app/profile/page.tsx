import { Suspense } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'

import AvatarUploadCard from './_components/avatar-upload-card'
import { ProfileTabs } from './_components/profile-tabs'

export default async function ProfilePage() {
  prefetch(trpc.user.info.queryOptions())
  prefetch(trpc.user.stats.queryOptions())
  prefetch(trpc.asset.listByMe.queryOptions())
  prefetch(trpc.asset.listByMeLike.queryOptions())

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col">
      <div className="mb-8 rounded-[28px] bg-linear-to-r from-zinc-950 via-zinc-900 to-lime-950/90 px-5 py-5 text-white shadow-[0_20px_50px_-28px_rgba(24,24,27,0.6)] sm:px-6 sm:py-6">
        <p className="text-[11px] font-semibold tracking-[0.28em] text-lime-200/80 uppercase">
          Profile Space
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
          个人中心
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300 sm:text-[15px]">
          管理你的头像、上传作品和收藏内容，把这个页面变成你在 Lemon Gallery
          的个人名片。
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
          <ProfileTabs />
        </Suspense>
      </HydrateClient>
    </div>
  )
}
