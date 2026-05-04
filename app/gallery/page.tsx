import { Suspense } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { HydrateClient, prefetch, trpc } from "@/trpc/server"

import { GalleryList } from "./_components/gallery-list"
import { HomeShowcase } from "./_components/home-showcase"
import { TagBar } from "./_components/tag-bar"

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{
    tag?: string
    q?: string
    sort?: "latest" | "popular"
  }>
}) {
  const { tag, q, sort } = await searchParams
  const resolvedSort: "latest" | "popular" = sort ?? "latest"

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
            <div className="flex w-full max-w-3xl flex-col gap-4">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/5" />
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
