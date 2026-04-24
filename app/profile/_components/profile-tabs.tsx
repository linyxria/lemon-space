'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { ArrowRightToLine, FolderUp, Heart, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTRPC } from '@/trpc/client'
import { MasonryGrid } from '@/components/masonry-grid'
import ImageCard from '@/components/image-card'

function TabEmpty({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <Empty className="bg-muted/30 h-full">
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          className="text-primary border-border flex h-14 w-14 items-center justify-center rounded-2xl border bg-white shadow-sm"
        >
          <Sparkles size={28} strokeWidth={1.5} />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription className="max-w-xs text-pretty">
          {description}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Link
          href="/"
          className="text-muted-foreground decoration-primary hover:text-primary flex items-center gap-2 underline decoration-2 underline-offset-8 transition-colors duration-300"
        >
          回到首页浏览
          <ArrowRightToLine size={18} />
        </Link>
      </EmptyContent>
    </Empty>
  )
}

function Fallback({ text }: { text: string }) {
  return <div className="py-20 text-center text-zinc-400">{text}</div>
}

function Upload() {
  const trpc = useTRPC()
  const { data } = useSuspenseQuery(trpc.asset.listByMe.queryOptions())

  if (data.length === 0) {
    return (
      <TabEmpty
        title="尚未上传资源"
        description="分享你的第一个灵感给社区吧！"
      />
    )
  }

  return (
    <MasonryGrid
      items={data}
      renderItem={(item, index) => <ImageCard {...item} priority={index < 6} />}
    />
  )
}

function Liked() {
  const trpc = useTRPC()
  const { data } = useSuspenseQuery(trpc.asset.listByMeLike.queryOptions())

  if (data.length === 0) {
    return (
      <TabEmpty
        title="暂无喜爱的资源"
        description="浏览首页并保存你喜欢的灵感。"
      />
    )
  }

  return (
    <MasonryGrid
      items={data}
      renderItem={(item, index) => <ImageCard {...item} priority={index < 6} />}
    />
  )
}

export function ProfileTabs() {
  const trpc = useTRPC()
  const { data } = useSuspenseQuery(trpc.user.stats.queryOptions())

  return (
    <Tabs defaultValue="my" className="w-full">
      <TabsList className="mb-4 rounded-xl bg-zinc-100 p-1">
        <TabsTrigger
          value="my"
          className="flex items-center gap-2 rounded-lg px-6"
        >
          <FolderUp size={16} />
          我的上传 ({data?.myCount})
        </TabsTrigger>
        <TabsTrigger
          value="likes"
          className="flex items-center gap-2 rounded-lg px-6"
        >
          <Heart size={16} />
          我喜爱的 ({data?.likeCount})
        </TabsTrigger>
      </TabsList>
      <TabsContent value="my">
        <Suspense fallback={<Fallback text="正在整理你的作品..." />}>
          <Upload />
        </Suspense>
      </TabsContent>
      <TabsContent value="likes">
        <Suspense fallback={<Fallback text="正在加载你的喜爱列表..." />}>
          <Liked />
        </Suspense>
      </TabsContent>
    </Tabs>
  )
}
