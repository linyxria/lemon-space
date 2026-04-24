'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { Flame, Sparkles, TrendingUp } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTRPC } from '@/trpc/client'

export function HomeShowcase() {
  const trpc = useTRPC()
  const t = useTranslations('Home')
  const { data } = useSuspenseQuery(trpc.asset.featured.queryOptions())

  if (data.featuredAssets.length === 0) return null

  return (
    <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
      <div className="overflow-hidden rounded-[28px] border border-zinc-200/80 bg-linear-to-br from-zinc-950 via-zinc-900 to-lime-950/90 p-5 text-white shadow-[0_24px_60px_-30px_rgba(24,24,27,0.65)] sm:p-6">
        <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.28em] text-lime-200/80 uppercase">
          <Sparkles className="size-3.5" />
          {t('featured')}
        </div>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row">
          <div className="space-y-3 lg:max-w-sm">
            <h2 className="text-3xl font-black tracking-tighter text-white sm:text-4xl">
              {t('featuredTitle')}
            </h2>
            <p className="text-sm leading-6 text-zinc-300">
              {t('featuredDesc')}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full px-3">
                {t('statFeatured', { count: data.featuredAssets.length })}
              </Badge>
              <Badge variant="secondary" className="rounded-full px-3">
                {t('statTags', { count: data.hotTags.length })}
              </Badge>
            </div>
            <Badge variant="secondary" className="rounded-full px-3">
              <TrendingUp className="size-3.5" />
              {t('featuredHint')}
            </Badge>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                nativeButton={false}
                render={<Link href="/?sort=popular" />}
              >
                {t('viewTrending')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                nativeButton={false}
                render={<Link href="/upload" />}
              >
                {t('uploadCallout')}
              </Button>
            </div>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-3">
            {data.featuredAssets.map((item) => (
              <Link
                key={item.id}
                href="/?sort=popular"
                className="group overflow-hidden rounded-3xl bg-white/8 p-2 backdrop-blur-sm transition hover:bg-white/12"
              >
                <div className="relative aspect-4/5 overflow-hidden rounded-2xl">
                  <Image
                    src={item.url}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 1024px) 44vw, 20vw"
                    priority
                  />
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 px-1">
                  <p className="truncate text-sm font-bold text-white">
                    {item.title}
                  </p>
                  <span className="shrink-0 text-xs font-semibold text-lime-200">
                    {item.likeCount} {t('likesSuffix')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.28em] text-zinc-500 uppercase">
          <Flame className="size-3.5 text-orange-500" />
          {t('hotTags')}
        </div>
        <div className="mt-4 space-y-3">
          {data.hotTags.map((tag, index) => (
            <Link
              key={tag.id}
              href={`/?tag=${tag.slug}`}
              className="flex items-center justify-between rounded-2xl border border-zinc-100 px-4 py-3 transition hover:border-lime-200 hover:bg-lime-50/70"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-zinc-400">
                  {(index + 1).toString().padStart(2, '0')}
                </span>
                <div>
                  <p className="text-sm font-bold text-zinc-900">{tag.name}</p>
                  <p className="text-xs text-zinc-500">
                    {tag.assetCount} {t('pieces')}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="rounded-full px-2.5">
                #{tag.slug}
              </Badge>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
