'use client'

import { useRouter } from '@bprogress/next/app'
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import {
  BookMarked,
  Flame,
  Heart,
  Languages,
  LayoutGrid,
  LogOut,
  SlidersHorizontal,
  UploadCloud,
} from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'

import { usePreferences } from '@/components/preferences-provider'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import UserAvatar from '@/components/user-avatar'
import { authClient } from '@/lib/auth-client'
import { useTRPC } from '@/trpc/client'

export default function UserNav() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { data } = useSuspenseQuery(trpc.user.info.queryOptions())
  const { data: stats } = useSuspenseQuery(trpc.user.stats.queryOptions())
  const router = useRouter()
  const t = useTranslations('UserNav')
  const tCommon = useTranslations('Common')
  const locale = useLocale()
  const { setLocale, showCardTags, setShowCardTags } = usePreferences()

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: trpc.user.info.queryKey() })
          router.refresh()
        },
      },
    })
  }

  if (!data)
    return (
      <div className="flex items-center gap-2 md:gap-4">
        <div className="grid gap-2 text-right">
          <Skeleton className="h-4 w-24 md:w-32" />
          <Skeleton className="ml-auto h-4 w-16 md:w-20" />
        </div>
        <Skeleton className="size-9 shrink-0 rounded-full" />
      </div>
    )

  return (
    <div className="flex items-center gap-2 sm:gap-4">
      <Link href="/upload">
        <Button variant="secondary" className="flex items-center gap-2">
          <UploadCloud size={18} />
          <span className="hidden sm:inline">{t('upload')}</span>
        </Button>
      </Link>

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
              <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-zinc-500">
                <span>
                  {stats.myCount} {t('uploads')}
                </span>
                <span>
                  {stats.likeCount} {t('likes')}
                </span>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <Link href="/profile" className="flex w-full items-center gap-2">
                <LayoutGrid />
                {t('myGallery')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link
                href="/profile?tab=likes"
                className="flex w-full items-center gap-2"
              >
                <Heart />
                {t('myLikes')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link
                href="/collections"
                className="flex w-full items-center gap-2"
              >
                <BookMarked />
                {t('collections')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link
                href="/preferences"
                className="flex w-full items-center gap-2"
              >
                <SlidersHorizontal />
                {t('preferences')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link
                href="/?sort=popular"
                className="flex w-full items-center gap-2"
              >
                <Flame />
                {t('hotIdeas')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuCheckboxItem
              checked={showCardTags}
              onCheckedChange={(checked) => setShowCardTags(Boolean(checked))}
            >
              {t('showCardTags')}
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-2">
              <Languages className="size-4" />
              {t('language')}
            </DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={locale === 'zh-CN'}
              onCheckedChange={() => setLocale('zh-CN')}
            >
              {tCommon('localeZh')}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={locale === 'en-US'}
              onCheckedChange={() => setLocale('en-US')}
            >
              {tCommon('localeEn')}
            </DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
            <LogOut />
            <span>{t('signOut')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
