'use client'

import { useClerk, useUser } from '@clerk/nextjs'
import { Heart } from 'lucide-react'
import type { RenderComponentProps } from 'masonic'
import { motion, type Variants } from 'motion/react'
import Image from 'next/image'
import { useRef, useState, useTransition } from 'react'

import { toggleLike } from '@/app/actions/like'

import { useGallery } from './GalleryProvider'

export interface AssetData {
  id: string
  title: string
  url: string
  user: {
    imageUrl: string
    username: string
  }
  likeCount: number
  isLikedByMe: boolean
}

const cardVariants: Variants = {
  // 初始隐藏状态
  hidden: {
    opacity: 0,
    scale: 0.92, // 初始缩小 8%
  },
  // 目标可见状态
  visible: (index: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 80,
      damping: 20,
      // 利用 custom 传进来的 index 实现错峰入场
      delay: Math.min(index * 0.06, 0.4),
    },
  }),
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
  const { id, title, url, user, likeCount, isLikedByMe } = data

  const { isSignedIn } = useUser()
  const { openSignIn } = useClerk()

  const [isPending, startTransition] = useTransition()
  const [isLiked, setIsLiked] = useState(isLikedByMe)
  const [displayCount, setDisplayCount] = useState(likeCount)

  const lastClickTime = useRef(0)

  const gallery = useGallery()

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!isSignedIn) {
      openSignIn({ fallbackRedirectUrl: window.location.pathname })
      return
    }

    // 立即进行乐观更新 (UI 响应)
    const newLiked = !isLiked
    setIsLiked(newLiked)
    setDisplayCount((prev) => (newLiked ? prev + 1 : prev - 1))

    // 记录点击时间戳
    const now = Date.now()
    lastClickTime.current = now

    startTransition(async () => {
      try {
        await toggleLike(id)
        // 请求成功后，不需要做任何事，UI 已经更新过了
      } catch {
        // 只有当这是最后一次操作时，才回滚（防止多次点击的回滚冲突）
        if (now === lastClickTime.current) {
          setIsLiked(!newLiked)
          setDisplayCount(likeCount)
        }
      }
    })
  }

  return (
    <motion.div
      variants={cardVariants}
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }} // 视口内 50px 触发
      className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 transition-all hover:shadow-xl hover:ring-zinc-300"
    >
      {/* 图片区域容器 */}
      <div
        className="relative cursor-zoom-in overflow-hidden bg-zinc-50"
        onClick={() => gallery.openAsset(data)}
      >
        {/* 优雅核心：使用原生 CSS transition。
             这里的 duration 和 timing-function 调教得与 Framer Motion 一致。
             只有在 hover 图片容器时，内部 div 才缩放。
          */}
        <div className="w-full h-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105">
          <Image
            src={url}
            alt={title}
            width={400}
            height={600}
            priority={index < 6}
            className="h-auto w-full object-cover block"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        {/* PC端悬浮收藏按钮：绝对定位，不随图片缩放 */}
        <div className="absolute inset-0 z-10 p-3 hidden md:flex items-start justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleLikeClick}
            disabled={isPending}
            className={`p-2 rounded-full backdrop-blur-md bg-black/20 transition-all active:scale-90 ${
              isLiked ? 'text-lime-400' : 'text-white/80 hover:text-white'
            }`}
          >
            <motion.div
              initial={false}
              animate={isLiked ? 'liked' : 'unliked'}
              variants={heartVariants}
            >
              <Heart
                size={20}
                fill={isLiked ? 'currentColor' : 'none'}
                strokeWidth={isLiked ? 0 : 2}
              />
            </motion.div>
          </button>
        </div>
      </div>

      {/* 2. 底部作者栏 */}
      <div className="flex items-center justify-between px-3.5 py-3 bg-white border-t border-zinc-100/50">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full ring-1 ring-zinc-100">
            <Image
              src={user.imageUrl}
              alt={user.username || 'Artist'}
              fill
              className="object-cover"
              sizes="24px"
            />
          </div>
          <span className="text-[12px] font-bold text-zinc-900 truncate">
            {user.username}
          </span>
        </div>

        {/* 交互小胶囊 */}
        <button
          onClick={handleLikeClick}
          disabled={isPending}
          className={`
              flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all active:scale-95 shrink-0
              ${
                isLiked
                  ? 'bg-lime-400/10 text-lime-600'
                  : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'
              }
            `}
        >
          <motion.div
            initial={false}
            animate={isLiked ? 'liked' : 'unliked'}
            variants={heartVariants}
          >
            <Heart
              size={13}
              strokeWidth={isLiked ? 0 : 2.5}
              fill={isLiked ? 'currentColor' : 'none'}
            />
          </motion.div>
          <motion.span
            key={displayCount}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-[11px] font-mono font-bold tabular-nums"
          >
            {displayCount}
          </motion.span>
        </button>
      </div>
    </motion.div>
  )
}
