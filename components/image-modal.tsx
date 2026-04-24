'use client'

import { ExternalLink, X } from 'lucide-react'
import { motion } from 'motion/react'
import Image from 'next/image'

import { Button } from './ui/button'

export interface ModalAssetData {
  id: string
  title: string
  url: string
}

interface ImageModalProps {
  asset: ModalAssetData | null
  onClose: () => void
}

export default function ImageModal({ asset, onClose }: ImageModalProps) {
  if (!asset) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-120 flex items-center justify-center p-0 pt-0 md:p-10 md:pt-20"
    >
      {/* 1. 背景 */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-white/70 antialiased backdrop-blur-3xl"
      />

      {/* 2. 弹窗主体 */}
      <div className="relative z-10 flex h-full w-full flex-col overflow-hidden bg-white shadow-[0_32px_64px_-24px_rgba(0,0,0,0.3)] sm:rounded-t-3xl md:h-auto md:max-h-[85vh] md:max-w-5xl md:rounded-3xl">
        {/* 3. 关闭按钮 */}
        <button
          onClick={onClose}
          className="fixed top-6 right-6 z-80 rounded-full bg-black/40 p-3 text-white shadow-lg backdrop-blur-md transition-all hover:bg-black/60 active:scale-90 sm:absolute"
        >
          <X size={22} strokeWidth={2.5} />
        </button>

        {/* 4. 图片展示区：修复后的弹性逻辑 */}
        <div
          className="relative flex min-h-75 w-full flex-1 cursor-zoom-out items-center justify-center overflow-hidden bg-zinc-950 sm:min-h-112.5 md:aspect-video md:min-h-0"
          onClick={onClose}
        >
          {/* 底层氛围模糊图 */}
          <Image
            src={asset.url}
            alt="blur-bg"
            fill
            className="scale-125 object-cover opacity-40 blur-3xl"
            aria-hidden="true"
            sizes="(max-width: 1024px) 100vw, 1024px"
          />

          {/* 主图：使用 fill 配合 object-contain */}
          <div className="relative h-full w-full p-4 md:p-8">
            <Image
              src={asset.url}
              alt={asset.title}
              fill
              priority
              className="z-10 block object-contain"
              sizes="(max-width: 768px) 95vw, (max-width: 1200px) 70vw, 1000px"
            />
          </div>
        </div>

        {/* 5. 底部信息栏 */}
        <div className="relative z-10 shrink-0 border-t border-zinc-100 bg-white p-4 pb-20 md:p-6 md:pb-8">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div className="space-y-1.5">
              <h3 className="max-w-70 truncate text-xl leading-tight font-black tracking-tight text-zinc-900 sm:max-w-md md:text-2xl">
                {asset.title}
              </h3>
              <div className="flex items-center gap-2 font-mono text-[9px] font-bold tracking-widest text-zinc-400 uppercase">
                <span>ID: {asset.id.slice(-8)}</span>
              </div>
            </div>
            <Button
              nativeButton={false}
              render={
                <a href={asset.url} target="_blank" rel="noopener noreferrer">
                  查看原图
                  <ExternalLink size={20} />
                </a>
              }
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
