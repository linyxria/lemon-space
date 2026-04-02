"use client";
import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, ExternalLink, Loader2, Star } from "lucide-react";
import { toggleFavorite } from "@/app/actions/favorite"; // 导入 Server Action
import { useClerk, useUser } from "@clerk/nextjs";

// 定义资产类型
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
  isStarredInitial: boolean; // 这是一个高级细节：后端渲染时传来的初始状态
}) {
  const { isSignedIn } = useUser(); // 获取登录状态
  const { openSignIn } = useClerk(); // 获取打开登录框的方法
  // 1. 状态：大图预览开关
  const [isOpen, setIsOpen] = useState(false);

  // 2. 状态：收藏逻辑（乐观更新）
  const [isPending, startTransition] = useTransition();
  const [isStarred, setIsStarred] = useState(isStarredInitial);
  const [displayCount, setDisplayCount] = useState(asset.favoriteCount);

  // 处理收藏点击（不触发大图预览）
  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 关键：阻止冒泡

    // 关键拦截：如果没登录，直接弹窗，不执行后续逻辑
    if (!isSignedIn) {
      openSignIn({
        fallbackRedirectUrl: window.location.pathname,
      });
      return;
    }

    // 乐观更新：星星变色，数字同步变化
    const newStarred = !isStarred;
    setIsStarred(newStarred);
    setDisplayCount((prev) => (newStarred ? prev + 1 : prev - 1));

    startTransition(async () => {
      try {
        await toggleFavorite(asset.id);
      } catch (err) {
        // 后端报错，状态回滚
        setIsStarred(isStarred);
        console.error("Star failed", err);
      }
    });
  };

  return (
    <>
      {/* 1. 列表中的卡片 (Framer Motion + Tailwind Columns) */}
      <motion.div
        layoutId={`card-${asset.id}`} // 核心：共享元素唯一 ID
        onClick={() => setIsOpen(true)} // 点击非按钮区域打开大图
        className="group relative cursor-zoom-in break-inside-avoid mb-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 transition-all hover:shadow-xl hover:ring-zinc-300"
      >
        <div className="relative aspect-auto">
          <Image
            src={asset.url}
            alt={asset.title ?? "Resource"}
            width={400} // 提供基础尺寸，object-cover 会处理
            height={300}
            priority={index < 10}
            className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-105"
            // 手机端 (max-width: 768px) 占 100vw (1列)
            // 平板端 (max-width: 1200px) 占 50vw (2列)
            // 电脑端 占 33vw (3列)
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        {/* 2. 新增：底部精致作者栏 */}
        <div className="flex items-center justify-between px-3 py-2.5 bg-white border-t border-zinc-50/50">
          {/* 左侧：作者信息 */}
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full ring-1 ring-zinc-100">
              <Image
                src={asset.uploader.imageUrl}
                alt={asset.uploader.fullName}
                fill
                className="object-cover"
                sizes="20px"
              />
            </div>
            <span className="text-[11px] font-bold text-zinc-900 truncate">
              {asset.uploader.fullName}
            </span>
          </div>

          {/* 右侧：黑灰色五角星 + 收藏数 */}
          <div className="flex items-center gap-1.5">
            <Star
              size={11}
              // 关键：去掉所有边框逻辑
              strokeWidth={0}
              // 使用纯色填充：zinc-600 是深灰黑，zinc-800 接近纯黑
              className="fill-zinc-500"
            />
            <span className="text-[10px] font-mono font-bold text-zinc-600 tabular-nums">
              {displayCount ?? 0}
            </span>
          </div>
        </div>

        {/* 收藏按钮：悬浮显示 */}
        <div className="absolute inset-0 z-10 p-2.5 flex items-start justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <motion.button
            whileHover={{ scale: 1.2, rotate: 15 }} // Hover 时放大并轻微旋转
            whileTap={{ scale: 0.9 }}
            onClick={handleStarClick}
            disabled={isPending}
            className={`p-2 transition-all duration-300 ${
              isStarred
                ? "text-lime-400 drop-shadow-[0_0_10px_rgba(163,230,53,0.8)]" // 已收藏：青柠霓虹发光
                : "text-zinc-300 hover:text-white drop-shadow-md" // 未收藏：灰色描边
            }`}
          >
            {isPending ? (
              <Loader2 size={22} className="animate-spin text-zinc-400" />
            ) : (
              // 使用 fill 控制实心/描边，strokeWidth 增加描边质感
              <Star
                size={22}
                fill={isStarred ? "currentColor" : "none"}
                strokeWidth={isStarred ? 0 : 2}
              />
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* 2. 弹窗：大图预览 (AnimatePresence + layoutId) */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-200 flex items-center justify-center p-4 sm:p-10">
            {/* 背景遮罩 (磨桑玻璃效果) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)} // 点击背景关闭
              className="absolute inset-0 bg-zinc-900/90 backdrop-blur-sm"
            />

            {/* 放大后的图片内容 Container */}
            <motion.div
              layoutId={`card-${asset.id}`} // 这里的 layoutId 必须和卡片一致
              className="relative z-10 w-full max-w-4xl aspect-4/3 sm:aspect-video overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              {/* 关闭按钮 */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute right-4 top-4 z-30 rounded-full bg-black/20 p-2 text-white backdrop-blur-md hover:bg-black/40 transition-colors"
              >
                <X size={20} />
              </button>

              {/* 使用 fill 模式，配合 object-contain 保证图片完整显示且不变形 */}
              <div className="relative h-full w-full bg-zinc-950">
                <Image
                  src={asset.url}
                  alt={asset.title ?? "Preview"}
                  fill
                  priority // 大图预览，最优先级加载
                  className="object-contain" // 关键：图片完整居中在容器内
                  sizes="(max-width: 768px) 100vw, 80vw"
                />
              </div>

              {/* 文字说明区 (固定在底部) */}
              <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md p-6 border-t border-zinc-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900">
                      {asset.title ?? "未命名资源"}
                    </h3>
                    <p className="text-xs text-zinc-500 font-mono mt-1">
                      R2 Key: {asset.r2Key}
                    </p>
                  </div>
                  <a
                    href={asset.url}
                    target="_blank"
                    className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    查看原图 <ExternalLink size={14} />
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
