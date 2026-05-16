import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { Suspense } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { auth } from "@/lib/auth"
import { HydrateClient, prefetch, trpc } from "@/trpc/server"

import {
  MyGalleryGrid,
  MyGalleryHeading,
} from "../_components/gallery-asset-grids"

export const metadata: Metadata = {
  title: "My Gallery",
  description: "Manage your uploaded Lemon Space gallery images.",
}

export default async function MyGalleryPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect("/sign-in")

  prefetch(trpc.asset.listByMe.queryOptions())

  return (
    <div className="space-y-5">
      <MyGalleryHeading
        title="我的画廊"
        description="查看和管理你上传到画廊的所有图片。"
      />
      <HydrateClient>
        <Suspense fallback={<Skeleton className="h-80 w-full rounded-lg" />}>
          <MyGalleryGrid />
        </Suspense>
      </HydrateClient>
    </div>
  )
}
