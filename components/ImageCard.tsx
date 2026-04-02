"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, ExternalLink } from "lucide-react";

// 定义类型确保 TS 不再报错
interface Asset {
  id: string;
  title: string | null;
  url: string;
  r2Key: string;
  createdAt: Date;
}

export default function ImageCard({ asset }: { asset: Asset }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 列表中的卡片 */}
      <motion.div
        layoutId={`card-${asset.id}`} // 核心：唯一 ID
        onClick={() => setIsOpen(true)}
        className="group relative cursor-zoom-in overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 transition-all hover:shadow-xl"
      >
        <div className="relative aspect-auto">
          <Image
            src={asset.url}
            alt={asset.title ?? "Resource"}
            width={400}
            height={300}
            className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      </motion.div>

      {/* 弹窗：大图预览 */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10">
            {/* 背景遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-zinc-900/90 backdrop-blur-sm"
            />

            {/* 放大后的图片内容 */}
            <motion.div
              layoutId={`card-${asset.id}`}
              className="relative z-10 w-full max-w-4xl aspect-4/3 sm:aspect-video overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute right-4 top-4 z-30 rounded-full bg-black/20 p-2 text-white backdrop-blur-md hover:bg-black/40 transition-colors"
              >
                <X size={20} />
              </button>

              {/* 使用 fill 模式，配合 object-contain 保证长宽图都不变形 */}
              <div className="relative h-full w-full bg-zinc-900">
                <Image
                  src={asset.url}
                  alt={asset.title ?? "Preview"}
                  fill
                  priority // 大图预览，直接拉最高优先级加载
                  className="object-contain" // 保证图片完整显示在容器内
                  sizes="(max-width: 768px) 100vw, 80vw"
                />
              </div>

              {/* 文字说明区 */}
              <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md p-6 border-t border-zinc-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900">
                      {asset.title ?? "未命名资源"}
                    </h3>
                    <p className="text-xs text-zinc-500 font-mono mt-1">
                      {asset.r2Key}
                    </p>
                  </div>
                  <a
                    href={asset.url}
                    target="_blank"
                    className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    原图 <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
