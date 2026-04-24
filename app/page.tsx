import { HydrateClient, prefetch, trpc } from '@/trpc/server'

import { GalleryList } from './_components/gallery-list'
import { TagBar } from './_components/tag-bar'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>
}) {
  const { tag } = await searchParams

  prefetch(trpc.asset.list.queryOptions({ tag }))
  prefetch(trpc.asset.tags.queryOptions())

  return (
    <div className="space-y-4">
      <HydrateClient>
        <Suspense
          fallback={
            <div className="flex w-full max-w-xs flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          }
        >
          <TagBar selected={tag} />
          <GalleryList tag={tag} />
        </Suspense>
      </HydrateClient>
    </div>
  )
}
