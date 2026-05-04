'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bookmark, BookMarked, Eye, Heart } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useTRPC } from '@/trpc/client'

export function PostActions({
  postId,
  canInteract,
  initialLiked,
  initialBookmarked,
  initialLikeCount,
  initialBookmarkCount,
  initialViewCount,
  published,
}: {
  postId: string
  canInteract: boolean
  initialLiked: boolean
  initialBookmarked: boolean
  initialLikeCount: number
  initialBookmarkCount: number
  initialViewCount: number
  published: boolean
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const router = useRouter()
  const pathname = usePathname()
  const [liked, setLiked] = useState(initialLiked)
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [bookmarkCount, setBookmarkCount] = useState(initialBookmarkCount)
  const [viewCount, setViewCount] = useState(initialViewCount)

  const likeMutation = useMutation(
    trpc.post.toggleLike.mutationOptions({
      onSuccess: (data) => {
        setLiked(data.likedByMe)
        setLikeCount(data.likeCount)
      },
    }),
  )
  const bookmarkMutation = useMutation(
    trpc.post.toggleBookmark.mutationOptions({
      onSuccess: (data) => {
        setBookmarked(data.bookmarkedByMe)
        setBookmarkCount(data.bookmarkCount)
      },
    }),
  )
  const { data: collections } = useQuery({
    ...trpc.collection.listForPost.queryOptions({ postId }),
    enabled: canInteract,
  })
  const collectionMutation = useMutation(
    trpc.collection.togglePost.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.collection.listForPost.queryKey({ postId }),
        })
      },
    }),
  )
  const viewMutation = useMutation(
    trpc.post.recordView.mutationOptions({
      onSuccess: (data) => {
        if (typeof data.viewCount === 'number') {
          setViewCount(data.viewCount)
        }
      },
    }),
  )

  useEffect(() => {
    if (!published) return

    const key = `post-viewed:${postId}`
    if (window.sessionStorage.getItem(key)) return

    window.sessionStorage.setItem(key, '1')
    viewMutation.mutate({ postId })
  }, [postId, published, viewMutation])

  const requireSignIn = () => {
    if (canInteract) return true
    router.push(`/sign-in?callbackURL=${encodeURIComponent(pathname)}`)
    return false
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-sm">
        <Eye className="size-4" />
        {viewCount}
      </span>
      <Button
        type="button"
        variant={liked ? 'secondary' : 'outline'}
        onClick={() => {
          if (requireSignIn()) likeMutation.mutate({ postId })
        }}
        disabled={likeMutation.isPending}
        className={cn(liked && 'text-primary')}
      >
        <Heart className={cn('size-4', liked && 'fill-current')} />
        {likeCount}
      </Button>
      <Button
        type="button"
        variant={bookmarked ? 'secondary' : 'outline'}
        onClick={() => {
          if (requireSignIn()) bookmarkMutation.mutate({ postId })
        }}
        disabled={bookmarkMutation.isPending}
        className={cn(bookmarked && 'text-primary')}
      >
        <Bookmark className={cn('size-4', bookmarked && 'fill-current')} />
        {bookmarkCount}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button type="button" variant="outline" onClick={requireSignIn} />
          }
        >
          <BookMarked className="size-4" />
          收藏夹
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>加入收藏夹</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {collections && collections.length > 0 ? (
              collections.map((item) => (
                <DropdownMenuCheckboxItem
                  key={item.id}
                  checked={item.included}
                  disabled={collectionMutation.isPending}
                  onCheckedChange={() =>
                    collectionMutation.mutate({
                      collectionId: item.id,
                      postId,
                    })
                  }
                >
                  <span className="truncate">{item.name}</span>
                </DropdownMenuCheckboxItem>
              ))
            ) : (
              <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
                还没有收藏夹
              </DropdownMenuLabel>
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
