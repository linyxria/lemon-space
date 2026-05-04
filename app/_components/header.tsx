import { Citrus } from 'lucide-react'
import { headers } from 'next/headers'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { auth } from '@/lib/auth'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'

import { DesktopMainNav, MobileMainNav } from './main-nav'
import UserNav from './user-nav'

export default async function Header() {
  const t = await getTranslations('Header')
  const session = await auth.api.getSession({ headers: await headers() })

  if (session) {
    prefetch(trpc.user.info.queryOptions())
    prefetch(trpc.user.stats.queryOptions())
  }

  return (
    <header className="bg-background/80 sticky top-0 z-20 w-full border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-6">
          <Link
            href="/"
            className="text-foreground group flex shrink-0 items-center gap-1.5 text-lg font-black tracking-tighter sm:gap-2 sm:text-xl"
          >
            <div className="bg-foreground text-background group-hover:bg-primary group-hover:text-primary-foreground rounded-xl p-1.5 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
              <Citrus size={18} className="sm:h-5 sm:w-5" strokeWidth={2.5} />
            </div>
            <span className="flex items-baseline gap-0.5 select-none sm:gap-1">
              LEMON
              <span className="text-primary font-extrabold tracking-widest italic">
                SPACE
              </span>
            </span>
          </Link>
          <DesktopMainNav />
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle label={t('themeToggle')} />
          {session ? (
            <HydrateClient>
              <UserNav />
            </HydrateClient>
          ) : (
            <Button nativeButton={false} render={<Link href="/sign-in" />}>
              {t('signIn')}
            </Button>
          )}
        </div>
      </div>
      <MobileMainNav />
    </header>
  )
}
