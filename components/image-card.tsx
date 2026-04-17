'use client'

import { Heart } from 'lucide-react'
import type { RenderComponentProps } from 'masonic'
import { motion } from 'motion/react'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useOptimistic, useTransition } from 'react'

import { toggleLike } from '@/app/actions/like'
import { authClient } from '@/lib/auth-client'

import { useGallery } from './gallery-provider'
import UserAvatar from './user-avatar'

export interface AssetData {
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
}

const heartVariants = {
  liked: {
    scale: [1, 1.4, 0.9, 1.1, 1],
    transition: { duration: 0.45 },
  },
  unliked: { scale: 1 },
}

export default function ImageCard({
  data,
  index,
}: RenderComponentProps<AssetData>) {
  const { id, title, url, width, height, user, likeCount, likedByMe } = data
  const { data: session } = authClient.useSession()
  const router = useRouter()
  const pathname = usePathname()

  const [, startTransition] = useTransition()
  const [optimisticLike, setOptimisticLike] = useOptimistic(
    { isLiked: likedByMe, count: likeCount },
    (state, newLiked: boolean) => ({
      isLiked: newLiked,
      count: newLiked ? state.count + 1 : state.count - 1,
    }),
  )

  const gallery = useGallery()

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!session) {
      router.push(`/sign-in?callbackURL=${encodeURIComponent(pathname)}`)
      return
    }

    // 1. 立即触发 UI 变化（支持连续叠加）
    const nextIsLiked = !optimisticLike.isLiked

    // 记录点击时间戳

    startTransition(async () => {
      setOptimisticLike(nextIsLiked)
      try {
        await toggleLike(id)
      } catch (error) {
        console.error('Like failed', error)
      }
    })
  }

  return (
    <div className="group relative overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-zinc-200 transition-all hover:shadow-lg hover:ring-zinc-300">
      {/* 图片区域容器 */}
      <div
        className="relative cursor-zoom-in overflow-hidden bg-zinc-50"
        onClick={() => gallery.openAsset(data)}
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
            priority={index < 6}
            className="block h-auto w-full object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </div>

        <div className="absolute inset-0 z-10 hidden items-start justify-end p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:flex">
          <button
            onClick={handleLikeClick}
            className={`rounded-full bg-black/20 p-2 backdrop-blur-md transition-all active:scale-90 ${
              optimisticLike.isLiked
                ? 'text-primary'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <motion.div
              initial={false}
              animate={optimisticLike.isLiked ? 'liked' : 'unliked'}
              variants={heartVariants}
            >
              <Heart
                size={20}
                fill={optimisticLike.isLiked ? 'currentColor' : 'none'}
                strokeWidth={optimisticLike.isLiked ? 0 : 2}
              />
            </motion.div>
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
          onClick={handleLikeClick}
          className={`ml-auto flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-all active:scale-95 ${
            optimisticLike.isLiked
              ? 'bg-primary/10 text-primary'
              : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'
          } `}
        >
          <motion.div
            initial={false}
            animate={optimisticLike.isLiked ? 'liked' : 'unliked'}
            variants={heartVariants}
          >
            <Heart
              size={13}
              strokeWidth={optimisticLike.isLiked ? 0 : 2.5}
              fill={optimisticLike.isLiked ? 'currentColor' : 'none'}
            />
          </motion.div>
          <motion.span
            key={optimisticLike.count}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="font-mono text-[11px] font-bold tabular-nums"
          >
            {optimisticLike.count}
          </motion.span>
        </button>
      </div>
    </div>
  )
}
