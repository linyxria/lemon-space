import { db } from "@/db";
import { assets, favorites } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import ImageCard from "@/components/ImageCard";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { ImageIcon, Plus } from "lucide-react";
import PublishButton from "@/components/PublishButton";
import MasonryGrid from "@/components/MasonryGrid";

export default async function HomePage() {
  const { userId } = await auth();

  // 1. 基础查询：获取图片列表及当前用户的收藏状态
  const assetsData = await db.query.assets.findMany({
    orderBy: [desc(assets.createdAt)],
    with: {
      favoritedBy: {
        // 修正之前的逻辑：未登录时不查任何人的收藏
        where: userId
          ? eq(favorites.userId, userId)
          : eq(favorites.userId, "NO_USER"),
      },
    },
  });

  // 2. 批量提取并查询上传者信息 (保持你之前的优化逻辑)
  const userIds = [...new Set(assetsData.map((a) => a.userId))];
  const client = await clerkClient();
  const usersList = await client.users.getUserList({
    userId: userIds,
    limit: userIds.length,
  });
  const userMap = new Map(usersList.data.map((u) => [u.id, u]));

  // 3. 合并数据：同时补全“上传者信息”和“总收藏数”
  const data = await Promise.all(
    assetsData.map(async (asset) => {
      const uploader = userMap.get(asset.userId);

      // 核心新增：统计这张图片在数据库里被收藏了多少次
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(favorites)
        .where(eq(favorites.assetId, asset.id));

      return {
        ...asset,
        favoriteCount: Number(countResult?.count || 0), // 确保是数字类型
        uploader: {
          imageUrl: uploader?.imageUrl || "",
          fullName: uploader?.username || uploader?.firstName || "匿名艺术家",
        },
      };
    }),
  );

  if (data.length === 0) {
    return (
      <div className="relative group max-w-md w-full mx-auto">
        {/* 背景装饰：改为青柠色渐变晕染 */}
        <div className="absolute -inset-4 bg-linear-to-r from-lime-400/10 to-emerald-400/5 rounded-[40px] blur-2xl transition-all group-hover:from-lime-400/20 group-hover:to-emerald-400/10" />

        <div className="relative flex flex-col items-center bg-white border border-zinc-100 rounded-[32px] p-12 text-center shadow-sm">
          {/* 图标组合 */}
          <div className="relative mb-6">
            <div className="h-20 w-20 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-300">
              <ImageIcon size={40} strokeWidth={1.5} />
            </div>
            {/* 这里的蓝色背景改为 lime-400，文字改为深色以保持对比 */}
            <div className="absolute -right-2 -top-2 h-8 w-8 rounded-full bg-lime-400 flex items-center justify-center text-lime-950 shadow-lg shadow-lime-200 animate-bounce">
              <Plus size={16} strokeWidth={3} />
            </div>
          </div>

          {/* 文字描述 */}
          <h3 className="text-xl font-black text-zinc-900 tracking-tight">
            灵感库空空如也
          </h3>
          <p className="mt-2 mb-8 text-zinc-500 text-sm leading-relaxed px-4">
            这里暂时还没有任何资源。
            <br />
            作为先驱者，来发布第一条灵感吧！
          </p>

          <PublishButton />
        </div>
      </div>
    );
  }

  return (
    <MasonryGrid
      items={data}
      renderItem={(asset, index) => (
        <ImageCard
          asset={asset}
          index={index}
          isStarredInitial={!!userId && asset.favoritedBy.length > 0}
        />
      )}
    />
  );
}
