'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { Flame, Sparkles, TrendingUp, UploadCloud } from 'lucide-react'
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
      <div className="bg-linear-to-br from-hero via-hero to-primary/35 text-hero-foreground overflow-hidden rounded-[28px] border p-5 shadow-[0_24px_60px_-30px_rgba(24,24,27,0.65)] sm:p-6">
        <div className="text-primary flex items-center gap-2 text-[11px] font-semibold tracking-[0.28em] uppercase">
          <Sparkles size={16} />
          {t('featured')}
        </div>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row">
          <div className="space-y-3 lg:max-w-sm">
            <h2 className="text-hero-foreground text-3xl font-black tracking-tighter sm:text-4xl">
              {t('featuredTitle')}
            </h2>
            <p className="text-hero-muted text-sm leading-6">
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
              <TrendingUp />
              {t('featuredHint')}
            </Badge>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                nativeButton={false}
                render={<Link href="/?sort=popular" />}
              >
                <TrendingUp />
                {t('viewTrending')}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                nativeButton={false}
                render={<Link href="/upload" />}
              >
                <UploadCloud />
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
                  <span className="text-primary shrink-0 text-xs font-semibold">
                    {item.likeCount} {t('likesSuffix')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-[28px] border p-5 shadow-sm sm:p-6">
        <div className="text-muted-foreground flex items-center gap-2 text-[11px] font-semibold tracking-[0.28em] uppercase">
          <Flame className="text-primary size-3.5" />
          {t('hotTags')}
        </div>
        <div className="mt-4 space-y-3">
          {data.hotTags.map((tag, index) => (
            <Link
              key={tag.id}
              href={`/?tag=${tag.slug}`}
              className="hover:border-primary/30 hover:bg-primary/10 flex items-center justify-between rounded-2xl border px-4 py-3 transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground font-mono text-xs font-bold">
                  {(index + 1).toString().padStart(2, '0')}
                </span>
                <div>
                  <p className="text-card-foreground text-sm font-bold">
                    {tag.name}
                  </p>
                  <p className="text-muted-foreground text-xs">
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
