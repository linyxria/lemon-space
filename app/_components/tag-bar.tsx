'use client'

import { useRouter } from '@bprogress/next/app'
import { useSuspenseQuery } from '@tanstack/react-query'
import { ArrowUpWideNarrow, Search, Sparkles, X } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useTRPC } from '@/trpc/client'

function buildGalleryHref({
  tag,
  q,
  sort,
}: {
  tag?: string
  q?: string
  sort?: 'latest' | 'popular'
}) {
  const params = new URLSearchParams()

  if (tag) params.set('tag', tag)
  if (q) params.set('q', q)
  if (sort && sort !== 'latest') params.set('sort', sort)

  const query = params.toString()
  return query ? `/?${query}` : '/'
}

export function TagBar({
  selected,
  keyword,
  sort,
}: {
  selected: string | undefined
  keyword: string | undefined
  sort: 'latest' | 'popular'
}) {
  const trpc = useTRPC()
  const t = useTranslations('TagBar')
  const tCommon = useTranslations('Common')
  const { data } = useSuspenseQuery(trpc.asset.tags.queryOptions())
  const [inputValue, setInputValue] = useState(keyword ?? '')
  const router = useRouter()
  const sortOptions = [
    { value: 'latest', label: tCommon('latest') },
    { value: 'popular', label: tCommon('popular') },
  ] as const

  const hasFilters = Boolean(selected || keyword || sort !== 'latest')

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextKeyword = inputValue.trim()

    router.push(
      buildGalleryHref({
        tag: selected,
        q: nextKeyword || undefined,
        sort,
      }),
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-[28px] border border-zinc-200/70 bg-linear-to-br from-white via-zinc-50 to-lime-50/60 p-4 shadow-[0_18px_40px_-26px_rgba(24,24,27,0.2)] sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <form onSubmit={handleSearchSubmit} className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder={t('searchPlaceholder')}
                className="h-10 rounded-2xl border-zinc-200 bg-white pr-9 pl-9"
              />
              {inputValue ? (
                <button
                  type="button"
                  onClick={() => setInputValue('')}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-zinc-400 transition hover:text-zinc-700"
                  aria-label={t('clearSearch')}
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>
            <Button type="submit" className="h-10 rounded-2xl px-4">
              {t('search')}
            </Button>
          </form>

          <div className="flex items-center gap-2">
            <ArrowUpWideNarrow className="size-4 text-zinc-400" />
            <div className="flex flex-wrap items-center gap-2">
              {sortOptions.map((option) => (
                <Badge
                  key={option.value}
                  variant={sort === option.value ? 'default' : 'outline'}
                  render={
                    <Link
                      href={buildGalleryHref({
                        tag: selected,
                        q: keyword,
                        sort: option.value,
                      })}
                    />
                  }
                  className="h-8 rounded-full px-3 text-xs font-semibold"
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {hasFilters ? (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full px-3">
              <Sparkles className="size-3.5" />
              {t('filtersEnabled')}
            </Badge>
            {selected ? (
              <Badge variant="outline" className="rounded-full px-3">
                {t('tag')}: {selected}
              </Badge>
            ) : null}
            {keyword ? (
              <Badge variant="outline" className="rounded-full px-3">
                {t('keyword')}: {keyword}
              </Badge>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href="/" />}
            >
              {t('clear')}
            </Button>
          </div>
        ) : null}
      </div>

      {data.length > 0 ? (
        <ScrollArea>
          <div className="flex w-max items-center gap-1 pb-2 md:gap-2">
            <Link
              href={buildGalleryHref({ q: keyword, sort })}
              className={cn(
                'rounded-full px-4 py-1.5 text-xs font-bold whitespace-nowrap transition-all duration-300 md:px-5 md:py-2 md:text-sm',
                !selected
                  ? 'bg-primary/10 text-primary'
                  : 'bg-transparent text-zinc-400 hover:bg-zinc-100/50 hover:text-zinc-600',
              )}
            >
              {t('allCategories')}
            </Link>
            {data.map((tag) => {
              const isActive = selected === tag.slug
              return (
                <Link
                  key={tag.id}
                  href={buildGalleryHref({ tag: tag.slug, q: keyword, sort })}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-xs font-bold whitespace-nowrap transition-all duration-300 md:px-5 md:py-2 md:text-sm',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'bg-transparent text-zinc-400 hover:bg-zinc-100/50 hover:text-zinc-600',
                  )}
                >
                  {tag.name}
                </Link>
              )
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ) : null}
    </div>
  )
}
