'use client'

import { useRouter } from '@bprogress/next/app'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import { motion } from 'motion/react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

import { authClient } from '@/lib/auth-client'
import { useOptimisticLike } from '@/lib/use-optimistic-like'
import { useTRPC } from '@/trpc/client'

import UserAvatar from './user-avatar'

const heartVariants = {
  liked: {
    scale: [1, 1.4, 0.9, 1.1, 1],
    transition: { duration: 0.45 },
  },
  unliked: { scale: 1 },
}

function easeOutCubic(progress: number) {
  return 1 - (1 - progress) ** 3
}

function useAnimatedCount(value: number, duration = 180) {
  const [displayValue, setDisplayValue] = useState(value)
  const previousValueRef = useRef(value)
  const frameRef = useRef<number | null>(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      previousValueRef.current = value
      setDisplayValue(value)
      return
    }

    const from = previousValueRef.current
    const to = value

    if (from === to) return

    const startedAt = performance.now()

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
    }

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1)
      const eased = easeOutCubic(progress)
      const nextValue = Math.round(from + (to - from) * eased)

      setDisplayValue(nextValue)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        previousValueRef.current = to
        frameRef.current = null
      }
    }

    frameRef.current = requestAnimationFrame(tick)

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [duration, value])

  return displayValue
}

export default function ImageCard({
  priority,
  id,
  title,
  url,
  width,
  height,
  user,
  likeCount,
  likedByMe,
}: {
  priority: boolean
  id: string
  title: string
  url: string
  width: number
  height: number
  user?: {
    name: string
    image: string | null
  }
  likeCount: number
  likedByMe?: boolean
}) {
  const { data: session } = authClient.useSession()
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const initialLikeState = useMemo(
    () => ({
      isLiked: likedByMe ?? false,
      count: likeCount,
    }),
    [likeCount, likedByMe],
  )
  const { optimisticLike, optimisticToggle, commit, rollback } =
    useOptimisticLike(initialLikeState)
  const animatedLikeCount = useAnimatedCount(optimisticLike.count)

  const likeMutation = useMutation(
    trpc.asset.toggleLike.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: trpc.asset.list.queryKey() }),
          queryClient.invalidateQueries({
            queryKey: trpc.asset.listByMe.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.asset.listByMeLike.queryKey(),
          }),
        ])
      },
    }),
  )

  const router = useRouter()
  const pathname = usePathname()

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!session) {
      router.push(`/sign-in?callbackURL=${encodeURIComponent(pathname)}`)
      return
    }

    if (likeMutation.isPending) return

    const { previous, next } = optimisticToggle()

    likeMutation.mutate(
      { assetId: id },
      {
        onSuccess: () => {
          commit(next)
        },
        onError: () => {
          rollback(previous)
        },
      },
    )
  }

  const likeButtonClassName = `ml-auto flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-all active:scale-95 ${
    optimisticLike.isLiked
      ? 'bg-primary/10 text-primary'
      : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'
  } `

  const iconButtonClassName = `rounded-full bg-black/20 p-2 backdrop-blur-md transition-all active:scale-90 ${
    optimisticLike.isLiked ? 'text-primary' : 'text-white/80 hover:text-white'
  }`

  const likeLabel = optimisticLike.isLiked ? '取消点赞' : '点赞'

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
    <div className="group relative overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-zinc-200 transition-all hover:shadow-lg hover:ring-zinc-300">
      {/* 图片区域容器 */}
      <div
        className="relative cursor-zoom-in overflow-hidden bg-zinc-50"
        // onClick={() => gallery.openAsset({ id, title, url })}
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
            priority={priority}
            className="block h-auto w-full object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </div>

        <div className="absolute inset-0 z-10 hidden items-start justify-end p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:flex">
          <button
            type="button"
            onClick={handleLikeClick}
            disabled={likeMutation.isPending}
            aria-label={likeLabel}
            className={iconButtonClassName}
          >
            {renderHeart(20, 2)}
          </button>
        </div>
      </div>
      {/* 2. 底部作者栏 */}
      <div className="flex items-center border-t border-zinc-100/50 bg-white px-3.5 py-2.5">
        {user ? (
          <div className="flex items-center gap-2 overflow-hidden">
            <UserAvatar size="sm" name={user.name} image={user.image} />
            <span className="truncate text-[12px] font-bold text-zinc-900">
              {user.name}
            </span>
          </div>
        ) : null}

        {/* 交互小胶囊 */}
        <button
          type="button"
          onClick={handleLikeClick}
          disabled={likeMutation.isPending}
          aria-label={likeLabel}
          className={likeButtonClassName}
        >
          {renderHeart(13, 2.5)}
          <span className="font-mono text-[11px] font-bold tabular-nums">
            {animatedLikeCount}
          </span>
        </button>
      </div>
    </div>
  )
}
