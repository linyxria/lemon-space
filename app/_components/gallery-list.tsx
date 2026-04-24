'use client'

import { useSuspenseInfiniteQuery } from '@tanstack/react-query'
import { ImageIcon, LoaderCircle, UploadCloud } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef } from 'react'

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
import { useTRPC } from '@/trpc/client'

export function GalleryList({
  tag,
  q,
  sort,
}: {
  tag: string | undefined
  q: string | undefined
  sort: 'latest' | 'popular'
}) {
  const trpc = useTRPC()
  const t = useTranslations('Gallery')
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery(
      trpc.asset.list.infiniteQueryOptions(
        { tag, q, sort, limit: 24 },
        {
          getNextPageParam: (lastPage) => lastPage.nextCursor,
        },
      ),
    )

  const items = useMemo(() => {
    const seen = new Set<string>()

    return data.pages
      .flatMap((page) => page.items)
      .filter((item) => {
        if (seen.has(item.id)) return false
        seen.add(item.id)
        return true
      })
  }, [data.pages])

  useEffect(() => {
    const node = loadMoreRef.current
    if (!node || !hasNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          void fetchNextPage()
        }
      },
      { rootMargin: '600px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  if (items.length === 0) {
    if (tag || q)
      return (
        <div className="py-20 text-center">
          <p className="font-medium text-zinc-400">{t('noResult')}</p>
          <Link
            href="/"
            className="text-primary mt-2 inline-block text-sm font-bold hover:underline"
          >
            {t('backToGallery')}
          </Link>
        </div>
      )

    return (
      <Empty className="bg-muted/30 border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ImageIcon />
          </EmptyMedia>
          <EmptyTitle>{t('emptyTitle')}</EmptyTitle>
          <EmptyDescription>{t('emptyDescription')}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button nativeButton={false} render={<Link href="/upload" />}>
            <UploadCloud />
            {t('uploadNow')}
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <div className="space-y-6">
      <MasonryGrid
        items={items}
        renderItem={(item, index) => (
          <ImageCard {...item} priority={index < 6} />
        )}
      />

      <div ref={loadMoreRef} className="flex justify-center py-4">
        {isFetchingNextPage ? (
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
            <LoaderCircle className="size-4 animate-spin" />
            {t('loadingMore')}
          </div>
        ) : hasNextPage ? (
          <Button variant="secondary" onClick={() => void fetchNextPage()}>
            {t('loadMore')}
          </Button>
        ) : (
          <p className="text-sm font-medium text-zinc-400">{t('noMore')}</p>
        )}
      </div>
    </div>
  )
}
