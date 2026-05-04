import { Citrus } from 'lucide-react'
import { headers } from 'next/headers'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { auth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'

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
          <NavigationMenu className="hidden flex-none justify-start md:flex">
            <NavigationMenuList className="justify-start">
              <NavigationMenuItem>
                <NavigationMenuLink
                  render={<Link href="/posts" />}
                  className={cn(navigationMenuTriggerStyle(), 'px-3')}
                >
                  文章
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  render={<Link href="/gallery" />}
                  className={cn(navigationMenuTriggerStyle(), 'px-3')}
                >
                  画廊
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  render={<Link href="/resources" />}
                  className={cn(navigationMenuTriggerStyle(), 'px-3')}
                >
                  技术导航
                </NavigationMenuLink>
              </NavigationMenuItem>
              {session ? (
                <NavigationMenuItem>
                  <NavigationMenuLink
                    render={<Link href="/collections" />}
                    className={cn(navigationMenuTriggerStyle(), 'px-3')}
                  >
                    收藏夹
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ) : null}
            </NavigationMenuList>
          </NavigationMenu>
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
      <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2 md:hidden">
        <Link
          href="/posts"
          className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg px-3 py-1.5 text-sm font-semibold whitespace-nowrap"
        >
          文章
        </Link>
        <Link
          href="/gallery"
          className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg px-3 py-1.5 text-sm font-semibold whitespace-nowrap"
        >
          画廊
        </Link>
        <Link
          href="/resources"
          className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg px-3 py-1.5 text-sm font-semibold whitespace-nowrap"
        >
          技术导航
        </Link>
        {session ? (
          <Link
            href="/collections"
            className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg px-3 py-1.5 text-sm font-semibold whitespace-nowrap"
          >
            收藏夹
          </Link>
        ) : null}
      </nav>
    </header>
  )
}
