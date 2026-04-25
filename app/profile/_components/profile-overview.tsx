'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { Heart, Images, Sparkles } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTRPC } from '@/trpc/client'

export function ProfileOverview() {
  const trpc = useTRPC()
  const t = useTranslations('ProfileOverview')
  const { data: info } = useSuspenseQuery(trpc.user.info.queryOptions())
  const { data: dashboard } = useSuspenseQuery(
    trpc.user.dashboard.queryOptions(),
  )

  return (
    <section className="mb-8 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="from-card via-card to-primary/10 rounded-[28px] border bg-linear-to-br p-5 shadow-sm sm:p-6">
        <div className="text-muted-foreground flex items-center gap-2 text-[11px] font-semibold tracking-[0.28em] uppercase">
          <Sparkles className="text-primary size-3.5" />
          {t('snapshotBadge')}
        </div>
        <div className="mt-4 flex items-center gap-4">
          {info.image ? (
            <Image
              src={info.image}
              alt={info.name}
              width={72}
              height={72}
              className="rounded-3xl object-cover shadow-[0_14px_36px_-24px_rgba(24,24,27,0.45)]"
            />
          ) : (
            <div className="bg-muted text-muted-foreground flex size-[72px] items-center justify-center rounded-3xl text-2xl font-black">
              {info.name.slice(0, 1)}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-foreground truncate text-2xl font-black tracking-tight">
              {info.name}
            </h2>
            <p className="text-muted-foreground truncate text-sm">
              {info.email}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="bg-hero text-hero-foreground rounded-2xl px-4 py-4">
            <p className="text-hero-muted text-[11px] tracking-[0.2em] uppercase">
              {t('uploadsLabel')}
            </p>
            <p className="mt-2 text-3xl font-black">{dashboard.myCount}</p>
          </div>
          <div className="bg-primary/15 text-primary rounded-2xl px-4 py-4">
            <p className="text-[11px] tracking-[0.2em] opacity-70 uppercase">
              {t('likesLabel')}
            </p>
            <p className="mt-2 text-3xl font-black">
              {dashboard.totalReceivedLikes}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-[28px] border p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.28em] uppercase">
              {t('recentBadge')}
            </p>
            <h3 className="text-foreground mt-2 text-2xl font-black tracking-tight">
              {t('recentTitle')}
            </h3>
          </div>
          <Button
            variant="secondary"
            nativeButton={false}
            render={<Link href="/upload" />}
          >
            <Images className="size-4" />
            {t('continueUpload')}
          </Button>
        </div>

        {dashboard.recentUploads.length > 0 ? (
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {dashboard.recentUploads.map((item) => (
              <Link key={item.id} href="/profile" className="group">
                <div className="bg-muted relative aspect-[4/5] overflow-hidden rounded-3xl">
                  <Image
                    src={item.url}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 40vw, 18vw"
                  />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <p className="text-foreground truncate text-sm font-bold">
                    {item.title}
                  </p>
                  <Badge
                    variant="outline"
                    className="rounded-full px-2 text-[10px]"
                  >
                    <Heart className="size-3" />
                    {t('newBadge')}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground mt-5 text-sm">
            {t('emptyRecent')}
          </p>
        )}
      </div>
    </section>
  )
}
