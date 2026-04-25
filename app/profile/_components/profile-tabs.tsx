'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { ArrowRightToLine, FolderUp, Heart, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Suspense } from 'react'

import ImageCard from '@/components/image-card'
import { MasonryGrid } from '@/components/masonry-grid'
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

function TabEmptyWithLink({
  title,
  description,
  linkText,
}: {
  title: string
  description: string
  linkText: string
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
          {linkText}
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
  const t = useTranslations('ProfileTabs')
  const { data } = useSuspenseQuery(trpc.asset.listByMe.queryOptions())

  if (data.length === 0) {
    return (
      <TabEmptyWithLink
        title={t('emptyUploadsTitle')}
        description={t('emptyUploadsDescription')}
        linkText={t('backHome')}
      />
    )
  }

  return (
    <MasonryGrid
      items={data}
      renderItem={(item, index) => (
        <ImageCard {...item} loading={index < 2 ? 'eager' : 'lazy'} />
      )}
    />
  )
}

function Liked() {
  const trpc = useTRPC()
  const t = useTranslations('ProfileTabs')
  const { data } = useSuspenseQuery(trpc.asset.listByMeLike.queryOptions())

  if (data.length === 0) {
    return (
      <TabEmptyWithLink
        title={t('emptyLikesTitle')}
        description={t('emptyLikesDescription')}
        linkText={t('backHome')}
      />
    )
  }

  return (
    <MasonryGrid
      items={data}
      renderItem={(item, index) => (
        <ImageCard {...item} loading={index < 2 ? 'eager' : 'lazy'} />
      )}
    />
  )
}

export function ProfileTabs({
  defaultTab = 'my',
}: {
  defaultTab?: 'my' | 'likes'
}) {
  const trpc = useTRPC()
  const t = useTranslations('ProfileTabs')
  const { data } = useSuspenseQuery(trpc.user.stats.queryOptions())

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="mb-4 rounded-xl bg-zinc-100 p-1">
        <TabsTrigger
          value="my"
          className="flex items-center gap-2 rounded-lg px-6"
        >
          <FolderUp size={16} />
          {t('myUploads', { count: data?.myCount ?? 0 })}
        </TabsTrigger>
        <TabsTrigger
          value="likes"
          className="flex items-center gap-2 rounded-lg px-6"
        >
          <Heart size={16} />
          {t('myLikes', { count: data?.likeCount ?? 0 })}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="my">
        <Suspense fallback={<Fallback text={t('loadingUploads')} />}>
          <Upload />
        </Suspense>
      </TabsContent>
      <TabsContent value="likes">
        <Suspense fallback={<Fallback text={t('loadingLikes')} />}>
          <Liked />
        </Suspense>
      </TabsContent>
    </Tabs>
  )
}
