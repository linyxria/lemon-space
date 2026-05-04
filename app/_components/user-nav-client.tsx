"use client"

import { useRouter } from "@bprogress/next/app"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  BookMarked,
  BookOpenText,
  Heart,
  Languages,
  LayoutGrid,
  Library,
  LogOut,
  Moon,
  PenLine,
  SlidersHorizontal,
  Sun,
  UploadCloud,
  UserRound,
} from "lucide-react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"

import { usePreferences } from "@/components/preferences-provider"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import UserAvatar from "@/components/user-avatar"
import { authClient } from "@/lib/auth-client"
import { useTRPC } from "@/trpc/client"

import UserNavSkeleton from "./user-nav-skeleton"

export default function UserNavClient() {
  const [isSigningOut, setIsSigningOut] = useState(false)
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const shouldFetchProtected = Boolean(session) && !isSigningOut

  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { data } = useQuery({
    ...trpc.user.info.queryOptions(),
    enabled: shouldFetchProtected,
    retry: false,
    refetchOnWindowFocus: false,
  })
  const { data: stats } = useQuery({
    ...trpc.user.stats.queryOptions(),
    enabled: shouldFetchProtected,
    retry: false,
    refetchOnWindowFocus: false,
  })
  const router = useRouter()
  const t = useTranslations("UserNav")
  const tCommon = useTranslations("Common")
  const locale = useLocale()
  const { setLocale, setTheme, theme } = usePreferences()

  const handleSignOut = async () => {
    setIsSigningOut(true)
    queryClient.cancelQueries({ queryKey: trpc.user.info.queryKey() })
    queryClient.cancelQueries({ queryKey: trpc.user.stats.queryKey() })
    queryClient.removeQueries({ queryKey: trpc.user.info.queryKey() })
    queryClient.removeQueries({ queryKey: trpc.user.stats.queryKey() })

    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.refresh()
        },
      },
    })
  }

  if (sessionPending || !shouldFetchProtected || !data)
    return <UserNavSkeleton />

  return (
    <div className="flex items-center gap-2 sm:gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2">
          <span className="hidden font-medium sm:block">{data.name}</span>
          <UserAvatar name={data.name} image={data.image} />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              <p className="text-sm font-medium">{data.name}</p>
              <p className="text-muted-foreground text-xs font-normal">
                {data.email}
              </p>
              <div className="text-muted-foreground mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] font-semibold">
                <span>
                  {stats?.postCount ?? 0} {t("postItems")}
                </span>
                <span>
                  {stats?.assetCount ?? stats?.myCount ?? 0} {t("galleryItems")}
                </span>
                <span>
                  {stats?.collectionCount ?? 0} {t("collectionsShort")}
                </span>
                <span>
                  {stats?.likeCount ?? 0} {t("likedItems")}
                </span>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex items-center gap-2">
              <PenLine className="size-4" />
              {t("createGroup")}
            </DropdownMenuLabel>
            <DropdownMenuItem>
              <Link
                href="/posts/new"
                className="flex w-full items-center gap-2"
              >
                <BookOpenText />
                {t("newPost")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link
                href="/gallery/upload"
                className="flex w-full items-center gap-2"
              >
                <UploadCloud />
                {t("upload")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-2">
              <Library className="size-4" />
              {t("libraryGroup")}
            </DropdownMenuLabel>
            <DropdownMenuItem>
              <Link href="/posts/me" className="flex w-full items-center gap-2">
                <BookOpenText />
                {t("myPosts")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link
                href="/gallery/me"
                className="flex w-full items-center gap-2"
              >
                <LayoutGrid />
                {t("myGallery")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/likes" className="flex w-full items-center gap-2">
                <Heart />
                {t("myLikes")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link
                href="/collections"
                className="flex w-full items-center gap-2"
              >
                <BookMarked />
                {t("collections")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-2">
              <SlidersHorizontal className="size-4" />
              {t("settingsGroup")}
            </DropdownMenuLabel>
            <DropdownMenuItem>
              <Link href="/profile" className="flex w-full items-center gap-2">
                <UserRound />
                {t("profile")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-2">
              {theme === "dark" ? (
                <Moon className="size-4" />
              ) : (
                <Sun className="size-4" />
              )}
              {t("appearance")}
            </DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={theme === "system"}
              onCheckedChange={() => setTheme("system")}
            >
              {tCommon("themeSystem")}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={theme === "light"}
              onCheckedChange={() => setTheme("light")}
            >
              {tCommon("themeLight")}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={theme === "dark"}
              onCheckedChange={() => setTheme("dark")}
            >
              {tCommon("themeDark")}
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-2">
              <Languages className="size-4" />
              {t("language")}
            </DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={locale === "zh-CN"}
              onCheckedChange={() => setLocale("zh-CN")}
            >
              {tCommon("localeZh")}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={locale === "en-US"}
              onCheckedChange={() => setLocale("en-US")}
            >
              {tCommon("localeEn")}
            </DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
            <LogOut />
            <span>{t("signOut")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
