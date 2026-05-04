'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu'
import { cn } from '@/lib/utils'

type MainNavItem = {
  href: string
  label: string
}

const MAIN_NAV_ITEMS: MainNavItem[] = [
  { href: '/posts', label: '文章' },
  { href: '/gallery', label: '画廊' },
  { href: '/resources', label: '技术导航' },
]

function isNavItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function DesktopMainNav() {
  const pathname = usePathname()

  return (
    <NavigationMenu className="hidden flex-none justify-start md:flex">
      <NavigationMenuList className="justify-start gap-5">
        {MAIN_NAV_ITEMS.map((item) => {
          const isActive = isNavItemActive(pathname, item.href)

          return (
            <NavigationMenuItem key={item.href}>
              <NavigationMenuLink
                render={<Link href={item.href} />}
                data-active={isActive ? true : undefined}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex h-9 items-center rounded-none bg-transparent px-0 text-sm font-semibold text-muted-foreground transition-colors outline-none hover:bg-transparent hover:text-foreground focus:bg-transparent focus-visible:bg-transparent focus-visible:text-foreground focus-visible:ring-0 data-active:bg-transparent data-active:hover:bg-transparent data-active:focus:bg-transparent',
                  'after:bg-primary after:absolute after:right-0 after:bottom-0 after:left-0 after:h-0.5 after:origin-center after:scale-x-0 after:rounded-full after:transition-transform',
                  isActive && 'text-foreground after:scale-x-100',
                )}
              >
                {item.label}
              </NavigationMenuLink>
            </NavigationMenuItem>
          )
        })}
      </NavigationMenuList>
    </NavigationMenu>
  )
}

export function MobileMainNav() {
  const pathname = usePathname()

  return (
    <nav className="mx-auto flex max-w-7xl gap-5 overflow-x-auto px-4 pb-2 md:hidden">
      {MAIN_NAV_ITEMS.map((item) => {
        const isActive = isNavItemActive(pathname, item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'relative py-1.5 text-sm font-semibold whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground',
              'after:bg-primary after:absolute after:right-0 after:bottom-0 after:left-0 after:h-0.5 after:origin-center after:scale-x-0 after:rounded-full after:transition-transform',
              isActive && 'text-foreground after:scale-x-100',
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
