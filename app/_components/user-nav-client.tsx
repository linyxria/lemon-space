'use client'

import { useRouter } from '@bprogress/next/app'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
import { useState } from 'react'

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
import UserAvatar from '@/components/user-avatar'
import { authClient } from '@/lib/auth-client'
import { useTRPC } from '@/trpc/client'

import UserNavSkeleton from './user-nav-skeleton'

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
  const t = useTranslations('UserNav')
  const tCommon = useTranslations('Common')
  const locale = useLocale()
  const { setLocale, showCardTags, setShowCardTags } = usePreferences()

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

  if (sessionPending || !shouldFetchProtected || !data) return <UserNavSkeleton />

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
                  {stats?.myCount ?? 0} {t('uploads')}
                </span>
                <span>
                  {stats?.likeCount ?? 0} {t('likes')}
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
