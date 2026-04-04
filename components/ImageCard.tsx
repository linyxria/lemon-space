"use client";

import { useState, useTransition } from "react";
import { motion } from "motion/react";
import Image from "next/image";
import { Loader2, Star } from "lucide-react";
import { toggleFavorite } from "@/app/actions/favorite";
import { useClerk, useUser } from "@clerk/nextjs";
import ImageModal from "./ImageModal";

interface Asset {
  id: string;
  title: string | null;
  url: string;
  r2Key: string;
  uploader: {
    imageUrl: string;
    fullName: string;
  };
  favoriteCount: number;
  createdAt: Date;
}

export default function ImageCard({
  asset,
  index,
  isStarredInitial,
}: {
  asset: Asset;
  index: number;
  isStarredInitial: boolean;
}) {
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();

  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isStarred, setIsStarred] = useState(isStarredInitial);
  const [displayCount, setDisplayCount] = useState(asset.favoriteCount);

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isSignedIn) {
      openSignIn({ fallbackRedirectUrl: window.location.pathname });
      return;
    }

    const newStarred = !isStarred;
    setIsStarred(newStarred);
    setDisplayCount((prev) => (newStarred ? prev + 1 : prev - 1));

    startTransition(async () => {
      try {
        await toggleFavorite(asset.id);
      } catch (err) {
        setIsStarred(!newStarred);
        setDisplayCount(asset.favoriteCount);
        console.error("Star failed", err);
      }
    });
  };

  return (
    <>
      {/* 1. 列表卡片：layoutId 负责布局投影 */}
      <motion.div
        layoutId={`card-${asset.id}`}
        className="group relative break-inside-avoid mb-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 transition-all hover:shadow-xl hover:ring-zinc-300"
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
              alt={asset.title ?? "Inspiration"}
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
              onClick={handleStarClick}
              disabled={isPending}
              className={`p-2 rounded-full backdrop-blur-md bg-black/20 transition-all active:scale-90 ${
                isStarred ? "text-lime-400" : "text-white/80 hover:text-white"
              }`}
            >
              {isPending ? (
                <Loader2 size={20} className="animate-spin text-white" />
              ) : (
                <Star
                  size={20}
                  fill={isStarred ? "currentColor" : "none"}
                  strokeWidth={isStarred ? 0 : 2}
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
                src={asset.uploader.imageUrl}
                alt={asset.uploader.fullName}
                fill
                className="object-cover"
                sizes="24px"
              />
            </div>
            <span className="text-[12px] font-bold text-zinc-900 truncate">
              {asset.uploader.fullName}
            </span>
          </div>

          {/* 交互小胶囊 */}
          <button
            onClick={handleStarClick}
            disabled={isPending}
            className={`
              flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all active:scale-95 shrink-0
              ${
                isStarred
                  ? "bg-lime-400/10 text-lime-600"
                  : "bg-zinc-50 text-zinc-400 hover:bg-zinc-100"
              }
            `}
          >
            {isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Star
                size={13}
                strokeWidth={isStarred ? 0 : 2.5}
                fill={isStarred ? "currentColor" : "none"}
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
  );
}
