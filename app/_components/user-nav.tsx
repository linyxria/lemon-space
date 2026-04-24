'use client'

import { useRouter } from '@bprogress/next/app'
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { LayoutGrid, LogOut, Settings, UploadCloud } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
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
  const router = useRouter()

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
          <span className="hidden sm:inline">发布灵感</span>
        </Button>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2">
          <span className="hidden font-medium sm:block">{data.name}</span>
          <UserAvatar name={data.name} image={data.image} />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48" align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              <p className="text-sm font-medium">{data.name}</p>
              <p className="text-muted-foreground text-xs font-normal">
                {data.email}
              </p>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <Link href="/profile" className="flex w-full items-center gap-2">
                <LayoutGrid />
                我的画廊
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/settings" className="flex w-full items-center gap-2">
                <Settings />
                账号设置
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
            <LogOut />
            <span>退出登录</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
