"use client"

import { useSuspenseQuery } from "@tanstack/react-query"
import { ArrowRightToLine, ImageIcon, Sparkles } from "lucide-react"
import Link from "next/link"

import ImageCard from "@/components/image-card"
import { MasonryGrid } from "@/components/masonry-grid"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { useTRPC } from "@/trpc/client"

function EmptyGallery({
  description,
  href,
  title,
}: {
  description: string
  href: string
  title: string
}) {
  return (
    <Empty className="bg-muted/30 border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Sparkles />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Link
          href={href}
          className="text-muted-foreground decoration-primary hover:text-primary inline-flex items-center gap-2 underline decoration-2 underline-offset-8 transition-colors"
        >
          去看看
          <ArrowRightToLine className="size-4" />
        </Link>
      </EmptyContent>
    </Empty>
  )
}

export function MyGalleryGrid() {
  const trpc = useTRPC()
  const { data } = useSuspenseQuery(trpc.asset.listByMe.queryOptions())

  if (data.length === 0) {
    return (
      <EmptyGallery
        title="还没有上传图片"
        description="上传一些图片后，这里会成为你的个人画廊。"
        href="/gallery/upload"
      />
    )
  }

  return (
    <MasonryGrid
      items={data}
      renderItem={(item, index) => (
        <ImageCard {...item} loading={index < 8 ? "eager" : "lazy"} />
      )}
    />
  )
}

export function MyGalleryHeading({
  description,
  title,
}: {
  description: string
  title: string
}) {
  return (
    <section className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-primary flex items-center gap-1.5 text-xs font-bold tracking-[0.24em] uppercase">
          <ImageIcon className="size-3.5" />
          Gallery
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
          {description}
        </p>
      </div>
    </section>
  )
}
