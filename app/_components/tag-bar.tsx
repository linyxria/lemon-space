'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import Link from 'next/link'

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { useTRPC } from '@/trpc/client'

export function TagBar({ selected }: { selected: string | undefined }) {
  const trpc = useTRPC()
  const { data } = useSuspenseQuery(trpc.asset.tags.queryOptions())

  if (data.length === 0) return null

  return (
    <ScrollArea>
      <div className="flex w-max items-center gap-1 pb-4 md:gap-2">
        {data.map((tag) => {
          const isActive = selected === tag.slug
          return (
            <Link
              key={tag.id}
              href={`/?tag=${tag.slug}`}
              className={`rounded-full px-4 py-1.5 text-xs font-bold whitespace-nowrap transition-all duration-300 md:px-5 md:py-2 md:text-sm ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'bg-transparent text-zinc-400 hover:bg-zinc-100/50 hover:text-zinc-600'
              } `}
            >
              {tag.name}
            </Link>
          )
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
