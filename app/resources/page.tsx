import type { Metadata } from "next"
import { headers } from "next/headers"
import { Suspense } from "react"

import { auth } from "@/lib/auth"
import {
  TECH_RESOURCE_CATEGORIES,
  type TechResourceCategory,
} from "@/lib/tech-resources"
import { HydrateClient, prefetch, trpc } from "@/trpc/server"

import { ResourceExplorer } from "./_components/resource-explorer"
import { ResourcesSkeleton } from "./_components/resources-skeleton"

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
