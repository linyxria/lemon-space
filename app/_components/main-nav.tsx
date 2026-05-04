"use client"

import { Menu } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

type MainNavItem = {
  href: string
  label: string
}

const MAIN_NAV_ITEMS: MainNavItem[] = [
  { href: "/posts", label: "文章" },
  { href: "/gallery", label: "画廊" },
  { href: "/resources", label: "技术导航" },
]

function isNavItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function DesktopMainNav() {
  const pathname = usePathname()

  return (
    <nav className="hidden flex-none items-center gap-5 md:flex">
      {MAIN_NAV_ITEMS.map((item) => {
        const isActive = isNavItemActive(pathname, item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "text-muted-foreground hover:text-foreground focus-visible:text-foreground relative flex h-9 items-center text-sm font-semibold transition-colors outline-none focus-visible:ring-0",
              "after:bg-primary after:absolute after:right-0 after:bottom-0 after:left-0 after:h-0.5 after:origin-center after:scale-x-0 after:rounded-full after:transition-transform",
              isActive &&
                "text-primary hover:text-primary focus-visible:text-primary after:scale-x-100",
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function MobileMainNav() {
  const pathname = usePathname()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full md:hidden"
            aria-label="打开导航菜单"
          />
        }
      >
        <Menu />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 md:hidden">
        <DropdownMenuGroup>
          {MAIN_NAV_ITEMS.map((item) => {
            const isActive = isNavItemActive(pathname, item.href)

            return (
              <DropdownMenuItem
                key={item.href}
                render={<Link href={item.href}>{item.label}</Link>}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "focus:text-foreground px-2 py-1.5 font-medium focus:bg-transparent",
                  isActive &&
                    "text-primary focus:text-primary focus:bg-transparent",
                )}
              />
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
