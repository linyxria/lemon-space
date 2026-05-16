import type { Metadata } from "next"
import { Suspense } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { HydrateClient, prefetch, trpc } from "@/trpc/server"

import { CollectionsBoard } from "./_components/collections-board"

export const metadata: Metadata = {
  title: "Collections",
  description: "Organize saved posts and gallery images into collections.",
}

export default function CollectionsPage() {
  prefetch(trpc.collection.list.queryOptions())

  return (
    <div className="mx-auto w-full max-w-7xl">
      <HydrateClient>
        <Suspense
          fallback={<Skeleton className="h-120 w-full rounded-[28px]" />}
        >
          <CollectionsBoard />
        </Suspense>
      </HydrateClient>
    </div>
  )
}
