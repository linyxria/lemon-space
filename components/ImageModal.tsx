"use client";

import { ExternalLink,X } from "lucide-react";
import { AnimatePresence,motion } from "motion/react";
import Image from "next/image";

import { Button } from "./ui/button";

interface ImageModalProps {
  asset: {
    id: string;
    url: string;
    title: string | null;
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageModal({
  asset,
  isOpen,
  onClose,
}: ImageModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-120 flex items-center justify-center p-0 md:p-10 pt-0 md:pt-20">
          {/* 1. 背景 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-white/70 backdrop-blur-3xl antialiased"
          />

          {/* 2. 弹窗主体 */}
          <motion.div
            layoutId={`card-${asset.id}`}
            className="relative z-10 w-full h-full md:h-auto md:max-w-5xl md:max-h-[85vh] 
                       overflow-hidden sm:rounded-t-3xl md:rounded-3xl 
                       bg-white shadow-[0_32px_64px_-24px_rgba(0,0,0,0.3)] 
                       flex flex-col"
          >
            {/* 3. 关闭按钮 */}
            <button
              onClick={onClose}
              className="fixed sm:absolute right-6 top-6 z-80 rounded-full bg-black/40 p-3 text-white backdrop-blur-md active:scale-90 hover:bg-black/60 transition-all shadow-lg"
            >
              <X size={22} strokeWidth={2.5} />
            </button>

            {/* 4. 图片展示区：修复后的弹性逻辑 */}
            <div
              className="relative w-full bg-zinc-950 md:aspect-video flex-1 min-h-75 sm:min-h-112.5 md:min-h-0 cursor-zoom-out overflow-hidden flex items-center justify-center"
              onClick={onClose}
            >
              {/* 底层氛围模糊图 */}
              <Image
                src={asset.url}
                alt="blur-bg"
                fill
                className="object-cover blur-3xl opacity-40 scale-125"
                aria-hidden="true"
                sizes="(max-width: 1024px) 100vw, 1024px"
              />

              {/* 主图：使用 fill 配合 object-contain */}
              <div className="relative w-full h-full p-4 md:p-8">
                <Image
                  src={asset.url}
                  alt={asset.title ?? "Preview"}
                  fill
                  priority
                  className="object-contain block z-10"
                  sizes="(max-width: 768px) 95vw, (max-width: 1200px) 70vw, 1000px"
                />
              </div>
            </div>

            {/* 5. 底部信息栏 */}
            <div className="bg-white p-4 md:p-6 border-t border-zinc-100 shrink-0 relative z-10 pb-20 md:pb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-1.5">
                  <h3 className="text-xl md:text-2xl font-black text-zinc-900 tracking-tight leading-tight truncate max-w-70 sm:max-w-md">
                    {asset.title ?? "未命名灵感"}
                  </h3>
                  <div className="flex items-center gap-2 text-zinc-400 font-mono text-[9px] font-bold uppercase tracking-widest">
                    <span>ID: {asset.id.slice(-8)}</span>
                  </div>
                </div>
                <Button
                  nativeButton={false}
                  render={
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      查看原图
                      <ExternalLink size={20} />
                    </a>
                  }
                />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
