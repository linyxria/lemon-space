import type { Metadata } from "next"
import { headers } from "next/headers"
import { Suspense } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { auth } from "@/lib/auth"
import {
  TECH_RESOURCE_CATEGORIES,
  type TechResourceCategory,
} from "@/lib/tech-resources"
import { HydrateClient, prefetch, trpc } from "@/trpc/server"

import { ResourceExplorer } from "./_components/resource-explorer"

export const metadata: Metadata = {
  title: "Resources",
  description: "Browse curated developer resources backed by live data.",
}

function resolveCategory(category: string | undefined) {
  if (
    category &&
    TECH_RESOURCE_CATEGORIES.some((item) => item.id === category)
  ) {
    return category as TechResourceCategory
  }

  return undefined
}

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string
    tag?: string
    q?: string
    view?: "saved"
  }>
}) {
  const [{ category, tag, q, view }, session] = await Promise.all([
    searchParams,
    auth.api.getSession({ headers: await headers() }),
  ])
  const resolvedCategory = resolveCategory(category)
  const filter = view === "saved" ? "saved" : (resolvedCategory ?? "all")
  const signedIn = Boolean(session)

  prefetch(trpc.resource.categories.queryOptions())
  prefetch(trpc.resource.tags.queryOptions())
  prefetch(trpc.resource.featured.queryOptions())

  if (filter === "saved" && signedIn) {
    prefetch(
      trpc.resource.bookmarked.infiniteQueryOptions(
        { limit: 24 },
        {
          getNextPageParam: (lastPage) => lastPage.nextCursor,
        },
      ),
    )
  } else {
    prefetch(
      trpc.resource.list.infiniteQueryOptions(
        {
          category: filter !== "all" && filter !== "saved" ? filter : undefined,
          tag,
          q,
          limit: 24,
        },
        {
          getNextPageParam: (lastPage) => lastPage.nextCursor,
        },
      ),
    )
  }

  if (signedIn) {
    prefetch(trpc.resource.myList.queryOptions())
  }

  return (
    <HydrateClient>
      <Suspense fallback={<ResourcesSkeleton />}>
        <ResourceExplorer filter={filter} q={q} tag={tag} signedIn={signedIn} />
      </Suspense>
    </HydrateClient>
  )
}

function ResourcesSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-80 w-full rounded-xl" />
      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Skeleton className="h-120 rounded-xl" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
