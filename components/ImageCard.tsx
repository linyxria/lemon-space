'use client'

import { useClerk, useUser } from '@clerk/nextjs'
import { Heart, Loader2 } from 'lucide-react'
import { motion } from 'motion/react'
import Image from 'next/image'
import { useState, useTransition } from 'react'

import { toggleLike } from '@/app/actions/like'

import ImageModal from './ImageModal'

interface Asset {
  id: string
  title: string
  url: string
  user: {
    imageUrl: string
    username: string
  }
  likeCount: number
  createdAt: Date
}

export default function ImageCard({
  asset,
  index,
  isLikedInitial,
}: {
  asset: Asset
  index: number
  isLikedInitial: boolean
}) {
  const { isSignedIn } = useUser()
  const { openSignIn } = useClerk()

  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isLiked, setIsLiked] = useState(isLikedInitial)
  const [displayCount, setDisplayCount] = useState(asset.likeCount)

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!isSignedIn) {
      openSignIn({ fallbackRedirectUrl: window.location.pathname })
      return
    }

    const newLiked = !isLiked
    setIsLiked(newLiked)
    setDisplayCount((prev) => (newLiked ? prev + 1 : prev - 1))

    startTransition(async () => {
      try {
        await toggleLike(asset.id)
      } catch (err) {
        setIsLiked(!newLiked)
        setDisplayCount(asset.likeCount)
        console.error('Like failed', err)
      }
    })
  }

  return (
    <>
      {/* 1. 列表卡片：layoutId 负责布局投影 */}
      <motion.div
        layoutId={`card-${asset.id}`}
        className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 transition-all hover:shadow-xl hover:ring-zinc-300"
      >
        {/* 图片区域容器 */}
        <div
          className="relative cursor-zoom-in overflow-hidden bg-zinc-50"
          onClick={() => setIsOpen(true)}
        >
          {/* 优雅核心：使用原生 CSS transition。
             这里的 duration 和 timing-function 调教得与 Framer Motion 一致。
             只有在 hover 图片容器时，内部 div 才缩放。
          */}
          <div className="w-full h-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105">
            <Image
              src={asset.url}
              alt={asset.title ?? 'Inspiration'}
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
              {isPending ? (
                <Loader2 size={20} className="animate-spin text-white" />
              ) : (
                <Heart
                  size={20}
                  fill={isLiked ? 'currentColor' : 'none'}
                  strokeWidth={isLiked ? 0 : 2}
                />
              )}
            </button>
          </div>
        </div>

        {/* 2. 底部作者栏 */}
        <div className="flex items-center justify-between px-3.5 py-3 bg-white border-t border-zinc-100/50">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full ring-1 ring-zinc-100">
              <Image
                src={asset.user.imageUrl}
                alt={asset.user.username || 'Artist'}
                fill
                className="object-cover"
                sizes="24px"
              />
            </div>
            <span className="text-[12px] font-bold text-zinc-900 truncate">
              {asset.user.username}
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
            {isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Heart
                size={13}
                strokeWidth={isLiked ? 0 : 2.5}
                fill={isLiked ? 'currentColor' : 'none'}
              />
            )}
            <span className="text-[11px] font-mono font-bold tabular-nums">
              {displayCount ?? 0}
            </span>
          </button>
        </div>
      </motion.div>

      {/* 3. 大图预览弹窗 */}
      <ImageModal
        asset={asset}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  )
}
