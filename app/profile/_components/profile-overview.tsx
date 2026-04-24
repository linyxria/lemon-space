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
      <div className="rounded-[28px] border border-zinc-200/80 bg-linear-to-br from-white via-white to-lime-50/70 p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.28em] text-zinc-500 uppercase">
          <Sparkles className="size-3.5 text-lime-600" />
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
            <div className="flex size-[72px] items-center justify-center rounded-3xl bg-zinc-100 text-2xl font-black text-zinc-500">
              {info.name.slice(0, 1)}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-black tracking-tight text-zinc-900">
              {info.name}
            </h2>
            <p className="truncate text-sm text-zinc-500">{info.email}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-zinc-950 px-4 py-4 text-white">
            <p className="text-[11px] tracking-[0.2em] text-zinc-400 uppercase">
              {t('uploadsLabel')}
            </p>
            <p className="mt-2 text-3xl font-black">{dashboard.myCount}</p>
          </div>
          <div className="rounded-2xl bg-lime-100 px-4 py-4 text-lime-950">
            <p className="text-[11px] tracking-[0.2em] text-lime-800/70 uppercase">
              {t('likesLabel')}
            </p>
            <p className="mt-2 text-3xl font-black">
              {dashboard.totalReceivedLikes}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.28em] text-zinc-500 uppercase">
              {t('recentBadge')}
            </p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-zinc-900">
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
                <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-zinc-100">
                  <Image
                    src={item.url}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 40vw, 18vw"
                  />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <p className="truncate text-sm font-bold text-zinc-800">
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
          <p className="mt-5 text-sm text-zinc-500">{t('emptyRecent')}</p>
        )}
      </div>
    </section>
  )
}
