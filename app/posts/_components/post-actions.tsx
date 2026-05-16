"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Bookmark, BookMarked, Eye, Heart } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useReducer } from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useTRPC } from "@/trpc/client"

type PostActionState = {
  liked: boolean
  bookmarked: boolean
  likeCount: number
  bookmarkCount: number
  viewCount: number
}

type PostActionStatePatch = Partial<PostActionState>

function postActionReducer(
  state: PostActionState,
  patch: PostActionStatePatch,
) {
  return { ...state, ...patch }
}

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
  const { push } = useRouter()
  const [{ liked, bookmarked, likeCount, bookmarkCount, viewCount }, setState] =
    useReducer(postActionReducer, {
      liked: initialLiked,
      bookmarked: initialBookmarked,
      likeCount: initialLikeCount,
      bookmarkCount: initialBookmarkCount,
      viewCount: initialViewCount,
    })

  const likeMutation = useMutation(
    trpc.post.toggleLike.mutationOptions({
      onSuccess: (data) => {
        setState({ liked: data.likedByMe, likeCount: data.likeCount })
      },
    }),
  )
  const bookmarkMutation = useMutation(
    trpc.post.toggleBookmark.mutationOptions({
      onSuccess: (data) => {
        setState({
          bookmarked: data.bookmarkedByMe,
          bookmarkCount: data.bookmarkCount,
        })
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
        if (typeof data.viewCount === "number") {
          setState({ viewCount: data.viewCount })
        }
      },
    }),
  )

  useEffect(() => {
    if (!published) return

    const key = `post-viewed:${postId}`
    if (window.sessionStorage.getItem(key)) return

    window.sessionStorage.setItem(key, "1")
    viewMutation.mutate({ postId })
  }, [postId, published, viewMutation])

  const requireSignIn = () => {
    if (canInteract) return true
    const pathname = window.location.pathname
    push(`/sign-in?callbackURL=${encodeURIComponent(pathname)}`)
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
        variant={liked ? "secondary" : "outline"}
        onClick={() => {
          if (requireSignIn()) likeMutation.mutate({ postId })
        }}
        disabled={likeMutation.isPending}
        className={cn(liked && "text-primary")}
      >
        <Heart className={cn("size-4", liked && "fill-current")} />
        {likeCount}
      </Button>
      <Button
        type="button"
        variant={bookmarked ? "secondary" : "outline"}
        onClick={() => {
          if (requireSignIn()) bookmarkMutation.mutate({ postId })
        }}
        disabled={bookmarkMutation.isPending}
        className={cn(bookmarked && "text-primary")}
      >
        <Bookmark className={cn("size-4", bookmarked && "fill-current")} />
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
