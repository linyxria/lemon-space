import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { auth } from "@/lib/auth"
import { HydrateClient, prefetch, trpc } from "@/trpc/server"

import { LikesBoard } from "./_components/likes-board"

export const metadata: Metadata = {
  title: "Likes",
  description: "Review posts and gallery images you liked.",
}

export default async function LikesPage() {
  const requestHeaders = await headers()
  const [t, session] = await Promise.all([
    getTranslations("Likes"),
    auth.api.getSession({ headers: requestHeaders }),
  ])

  if (!session) redirect("/sign-in")

  prefetch(trpc.post.likedList.queryOptions())
  prefetch(trpc.asset.listByMeLike.queryOptions())

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-primary text-xs font-bold tracking-[0.24em] uppercase">
            Likes
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
            {t("description")}
          </p>
        </div>
      </section>

      <HydrateClient>
        <Suspense fallback={<Skeleton className="h-80 w-full rounded-lg" />}>
          <LikesBoard />
        </Suspense>
      </HydrateClient>
    </div>
  )
}
