import { Citrus } from 'lucide-react'
import { headers } from 'next/headers'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { auth } from '@/lib/auth'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'

import UserNav from './user-nav'

export default async function Header() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (session) {
    prefetch(trpc.user.info.queryOptions())
  }

  return (
    <header className="sticky top-0 z-20 w-full border-b border-zinc-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* 左侧：Logo - 确保不缩水 */}
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-1.5 text-lg font-black tracking-tighter text-zinc-900 sm:gap-2 sm:text-xl"
        >
          <div className="group-hover:bg-primary rounded-xl bg-zinc-900 p-1.5 text-white shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 group-hover:text-zinc-900">
            <Citrus size={18} className="sm:h-5 sm:w-5" strokeWidth={2.5} />
          </div>
          <span className="flex items-baseline gap-0.5 select-none sm:gap-1">
            LEMON
            <span className="text-primary font-extrabold tracking-widest italic">
              GALLERY
            </span>
          </span>
        </Link>
        {session ? (
          <HydrateClient>
            <UserNav />
          </HydrateClient>
        ) : (
          <Button nativeButton={false} render={<Link href="/sign-in" />}>
            登录
          </Button>
        )}
      </div>
    </header>
  )
}
