import type { Metadata } from "next"
import { Suspense } from "react"

import { HydrateClient, prefetch, trpc } from "@/trpc/server"

import { GalleryList } from "./_components/gallery-list"
import { HomeShowcase } from "./_components/home-showcase"
import { TagBar } from "./_components/tag-bar"
import GalleryLoading from "./loading"

export const metadata: Metadata = {
  title: "Gallery",
  description: "Explore visual references and uploaded images.",
}

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
        <Suspense fallback={<GalleryLoading />}>
          <HomeShowcase />
          <TagBar selected={tag} keyword={q} sort={resolvedSort} />
          <GalleryList tag={tag} q={q} sort={resolvedSort} />
        </Suspense>
      </HydrateClient>
    </div>
  )
}
