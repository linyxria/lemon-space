'use client'

import { useRouter } from '@bprogress/next/app'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import { motion } from 'motion/react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useOptimistic, useState, useTransition } from 'react'

import { Badge } from '@/components/ui/badge'
import { authClient } from '@/lib/auth-client'
import { useTRPC } from '@/trpc/client'

import { useGallery } from './gallery-provider'
import UserAvatar from './user-avatar'

const heartVariants = {
  liked: {
    scale: [1, 1.4, 0.9, 1.1, 1],
    transition: { duration: 0.45 },
  },
  unliked: { scale: 1 },
}

type LikeState = {
  isLiked: boolean
  count: number
}

function getNextLikeState(state: LikeState): LikeState {
  return {
    isLiked: !state.isLiked,
    count: Math.max(0, state.count + (state.isLiked ? -1 : 1)),
  }
}

export default function ImageCard({
  loading = 'lazy',
  id,
  title,
  url,
  width,
  height,
  user,
  tags,
  likeCount,
  likedByMe,
}: {
  loading?: 'eager' | 'lazy'
  id: string
  title: string
  url: string
  width: number
  height: number
  user?: {
    name: string
    image: string | null
  }
  tags?: string[]
  likeCount: number
  likedByMe?: boolean
}) {
  const { data: session } = authClient.useSession()
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [confirmedLike, setConfirmedLike] = useState<LikeState>(() => ({
    isLiked: likedByMe ?? false,
    count: likeCount,
  }))
  const [isLikeTransitionPending, startLikeTransition] = useTransition()
  const [optimisticLike, setOptimisticLike] = useOptimistic<
    LikeState,
    LikeState
  >(confirmedLike, (_current, nextLike) => nextLike)

  const likeMutation = useMutation(
    trpc.asset.toggleLike.mutationOptions({
      onSettled: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.asset.list.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.asset.listByMe.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.asset.listByMeLike.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.collection.detail.queryKey(),
          }),
        ])
      },
    }),
  )

  const router = useRouter()
  const pathname = usePathname()
  const gallery = useGallery()
  const t = useTranslations('ImageCard')

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!session) {
      router.push(`/sign-in?callbackURL=${encodeURIComponent(pathname)}`)
      return
    }

    if (likeMutation.isPending || isLikeTransitionPending) return

    const optimisticNextLike = getNextLikeState(optimisticLike)

    startLikeTransition(async () => {
      setOptimisticLike(optimisticNextLike)

      try {
        const nextLike = await likeMutation.mutateAsync({ assetId: id })

        startLikeTransition(() => {
          setConfirmedLike({
            isLiked: nextLike.likedByMe,
            count: nextLike.likeCount,
          })
        })
      } catch {
        startLikeTransition(() => {
          setConfirmedLike(confirmedLike)
        })
      }
    })
  }

  const likeButtonClassName = `ml-auto flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-all active:scale-95 ${
    optimisticLike.isLiked
      ? 'bg-primary/10 text-primary'
      : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
  } `

  const iconButtonClassName = `rounded-full bg-black/20 p-2 backdrop-blur-md transition-all active:scale-90 ${
    optimisticLike.isLiked ? 'text-primary' : 'text-white/80 hover:text-white'
  }`

  const likeLabel = optimisticLike.isLiked ? t('unlike') : t('like')

  const renderHeart = (size: number, strokeWidth: number) => (
    <motion.div
      initial={false}
      animate={optimisticLike.isLiked ? 'liked' : 'unliked'}
      variants={heartVariants}
    >
      <Heart
        size={size}
        fill={optimisticLike.isLiked ? 'currentColor' : 'none'}
        strokeWidth={optimisticLike.isLiked ? 0 : strokeWidth}
      />
    </motion.div>
  )

  return (
    <div className="bg-card group ring-border hover:ring-ring/40 relative overflow-hidden rounded-lg shadow-sm ring-1 transition-all hover:shadow-lg">
      {/* 图片区域容器 */}
      <div
        className="bg-muted relative cursor-zoom-in overflow-hidden"
        onClick={() =>
          gallery.openAsset({ id, title, url, width, height, tags })
        }
      >
        {/* 优雅核心：使用原生 CSS transition。
             这里的 duration 和 timing-function 调教得与 Framer Motion 一致。
             只有在 hover 图片容器时，内部 div 才缩放。
          */}
        <div className="h-full w-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105">
          <Image
            src={url}
            alt={title}
            width={width}
            height={height}
            loading={loading}
            fetchPriority={loading === 'eager' ? 'high' : undefined}
            className="block h-auto w-full object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </div>

        <div className="absolute inset-0 z-10 hidden items-start justify-end p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:flex">
          <button
            type="button"
            onClick={handleLikeClick}
            disabled={likeMutation.isPending || isLikeTransitionPending}
            aria-label={likeLabel}
            className={iconButtonClassName}
          >
            {renderHeart(20, 2)}
          </button>
        </div>
      </div>
      {/* 2. 底部作者栏 */}
      <div className="bg-card border-t px-3.5 py-2.5">
        {tags && tags.length > 0 ? (
          <div className="mb-2 flex min-w-0 items-center gap-1.5 overflow-hidden">
            {tags.slice(0, 4).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="min-w-0 shrink truncate rounded-full px-2 text-[10px]"
              >
                {tag}
              </Badge>
            ))}
            {tags.length > 4 ? (
              <Badge
                variant="ghost"
                className="shrink-0 rounded-full px-2 text-[10px]"
              >
                +{tags.length - 4}
              </Badge>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-center">
          {user ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <UserAvatar size="sm" name={user.name} image={user.image} />
              <span className="text-card-foreground truncate text-[12px] font-bold">
                {user.name}
              </span>
            </div>
          ) : null}

          {/* 交互小胶囊 */}
          <button
            type="button"
            onClick={handleLikeClick}
            disabled={likeMutation.isPending || isLikeTransitionPending}
            aria-label={likeLabel}
            className={likeButtonClassName}
          >
            {renderHeart(13, 2.5)}
            <span className="font-mono text-[11px] font-bold tabular-nums">
              {optimisticLike.count}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
