import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { Suspense } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { db } from '@/db'
import { userPreference } from '@/db/schema'
import { auth } from '@/lib/auth'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'

import { GalleryList } from './_components/gallery-list'
import { HomeShowcase } from './_components/home-showcase'
import { TagBar } from './_components/tag-bar'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    tag?: string
    q?: string
    sort?: 'latest' | 'popular'
  }>
}) {
  const { tag, q, sort } = await searchParams
  let resolvedSort: 'latest' | 'popular' = sort ?? 'latest'

  if (!sort) {
    const session = await auth.api.getSession({ headers: await headers() })
    if (session?.user) {
      const [preferences] = await db
        .select({ defaultSort: userPreference.defaultSort })
        .from(userPreference)
        .where(eq(userPreference.userId, session.user.id))
        .limit(1)

      if (preferences?.defaultSort === 'popular') {
        resolvedSort = 'popular'
      }
    }
  }

  prefetch(
    trpc.asset.list.infiniteQueryOptions(
      { tag, q, sort: resolvedSort, limit: 24 },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    ),
  )
  prefetch(trpc.asset.tags.queryOptions())
  prefetch(trpc.asset.featured.queryOptions())

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
          <HomeShowcase />
          <TagBar selected={tag} keyword={q} sort={resolvedSort} />
          <GalleryList tag={tag} q={q} sort={resolvedSort} />
        </Suspense>
      </HydrateClient>
    </div>
  )
}
