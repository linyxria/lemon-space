'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { ImageIcon, UploadCloud } from 'lucide-react'
import Link from 'next/link'

import ImageCard from '@/components/image-card'
import { MasonryGrid } from '@/components/masonry-grid'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { useTRPC } from '@/trpc/client'

export function GalleryList({ tag }: { tag: string | undefined }) {
  const trpc = useTRPC()
  const { data } = useSuspenseQuery(trpc.asset.list.queryOptions({ tag }))

  if (!data)
    return (
      <div className="flex w-full max-w-xs flex-col gap-7">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-full" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>
    )

  if (data.length === 0) {
    if (tag)
      return (
        <div className="py-20 text-center">
          <p className="font-medium text-zinc-400">该分类下暂时没有资源</p>
          <Link
            href="/"
            className="text-primary mt-2 inline-block text-sm font-bold hover:underline"
          >
            返回画廊
          </Link>
        </div>
      )

    return (
      <Empty className="bg-muted/30 border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ImageIcon />
          </EmptyMedia>
          <EmptyTitle>灵感空空如也</EmptyTitle>
          <EmptyDescription>
            这里暂时还没有任何资源。
            <br />
            作为先驱者，来发布第一条灵感吧！
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button nativeButton={false} render={<Link href="/upload" />}>
            <UploadCloud />
            立即发布
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <MasonryGrid
      items={data}
      renderItem={(item, index) => <ImageCard {...item} priority={index < 6} />}
    />
  )
}
