'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { BookOpenText, Heart, ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

import ImageCard from '@/components/image-card'
import { MasonryGrid } from '@/components/masonry-grid'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTRPC } from '@/trpc/client'

import { PostCard } from '../../posts/_components/post-card'

function EmptyLike({
  description,
  cta,
  href,
  icon,
  title,
}: {
  description: string
  cta: string
  href: string
  icon: 'post' | 'asset'
  title: string
}) {
  return (
    <Empty className="bg-muted/30 border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          {icon === 'post' ? <BookOpenText /> : <ImageIcon />}
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>
          {description}
          <Link
            href={href}
            className="text-primary ml-1 font-semibold hover:underline"
          >
            {cta}
          </Link>
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export function LikesBoard() {
  const trpc = useTRPC()
  const t = useTranslations('Likes')
  const { data: posts } = useSuspenseQuery(trpc.post.likedList.queryOptions())
  const { data: assets } = useSuspenseQuery(
    trpc.asset.listByMeLike.queryOptions(),
  )

  return (
    <Tabs defaultValue="posts" className="space-y-4">
      <TabsList>
        <TabsTrigger value="posts">
          <BookOpenText className="size-4" />
          {t('posts')} ({posts.length})
        </TabsTrigger>
        <TabsTrigger value="assets">
          <Heart className="size-4" />
          {t('assets')} ({assets.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="posts">
        {posts.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <EmptyLike
            icon="post"
            title={t('emptyPostsTitle')}
            description={t('emptyPostsDescription')}
            cta={t('browse')}
            href="/posts"
          />
        )}
      </TabsContent>

      <TabsContent value="assets">
        {assets.length > 0 ? (
          <MasonryGrid
            items={assets}
            renderItem={(item, index) => (
              <ImageCard {...item} loading={index < 8 ? 'eager' : 'lazy'} />
            )}
          />
        ) : (
          <EmptyLike
            icon="asset"
            title={t('emptyAssetsTitle')}
            description={t('emptyAssetsDescription')}
            cta={t('browse')}
            href="/gallery"
          />
        )}
      </TabsContent>
    </Tabs>
  )
}
