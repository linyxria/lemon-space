import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { assets, favorites } from "@/db/schema";
import { eq, desc, sql, inArray } from "drizzle-orm";
import ImageCard from "@/components/ImageCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FolderUp, Bookmark, Sparkles } from "lucide-react";
import Link from "next/link";
import MasonryGrid from "@/components/MasonryGrid";

export default async function ProfilePage() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const client = await clerkClient();
  const me = await client.users.getUser(userId);
  const myInfo = {
    imageUrl: me.imageUrl,
    fullName: me.username || me.firstName || "艺术家",
  };

  // 3. 基础查询：拉取原始数据
  const [myUploadsRaw, myFavoritesRaw] = await Promise.all([
    db.query.assets.findMany({
      where: eq(assets.userId, userId),
      orderBy: [desc(assets.createdAt)],
    }),
    db.query.favorites.findMany({
      where: eq(favorites.userId, userId),
      with: { asset: true },
    }),
  ]);

  // 创建一个 Set，存放当前用户真正收藏过的所有 Asset ID
  const myFavoriteIdSet = new Set(myFavoritesRaw.map((f) => f.assetId));

  // 4. 【核心优化】批量获取所有相关图片的收藏总数 (聚合查询)
  const allAssetIds = [
    ...myUploadsRaw.map((a) => a.id),
    ...myFavoritesRaw.map((f) => f.assetId),
  ];

  let favoriteCountsMap: Record<string, number> = {};

  if (allAssetIds.length > 0) {
    const counts = await db
      .select({
        assetId: favorites.assetId,
        count: sql<number>`count(*)`,
      })
      .from(favorites)
      .where(inArray(favorites.assetId, allAssetIds))
      .groupBy(favorites.assetId);

    favoriteCountsMap = Object.fromEntries(
      counts.map((c) => [c.assetId, Number(c.count)]),
    );
  }

  // 5. 内存中合并数据 (不再请求数据库)
  const myUploads = myUploadsRaw.map((asset) => ({
    ...asset,
    favoriteCount: favoriteCountsMap[asset.id] || 0,
    uploader: myInfo,
  }));

  const favoritedAssets = myFavoritesRaw.map((f) => ({
    ...f.asset,
    favoriteCount: favoriteCountsMap[f.asset.id] || 0,
    uploader: myInfo, // 收藏页也可以显示原作者，如果需要原作者信息，这里需要额外处理 userMap
  }));

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-zinc-900 tracking-tight">
          个人中心
        </h1>
        <p className="text-zinc-500 mt-2">管理你的灵感与上传资源</p>
      </div>

      <Tabs defaultValue="uploads" className="w-full">
        <TabsList className="bg-zinc-100 p-1 rounded-xl mb-4">
          <TabsTrigger
            value="uploads"
            className="flex items-center gap-2 rounded-lg px-6"
          >
            <FolderUp size={16} />
            我的上传 ({myUploads.length})
          </TabsTrigger>
          <TabsTrigger
            value="favorites"
            className="flex items-center gap-2 rounded-lg px-6"
          >
            <Bookmark size={16} />
            我的收藏 ({favoritedAssets.length})
          </TabsTrigger>
        </TabsList>

        {/* --- 我的上传 Tab --- */}
        <TabsContent value="uploads">
          {myUploads.length > 0 ? (
            <MasonryGrid
              items={myUploads}
              renderItem={(asset, index) => (
                <ImageCard
                  index={index}
                  asset={asset}
                  isStarredInitial={myFavoriteIdSet.has(asset.id)}
                />
              )}
            />
          ) : (
            <EmptyState
              title="尚未上传资源"
              description="分享你的第一个灵感给社区吧！"
            />
          )}
        </TabsContent>

        {/* --- 我的收藏 Tab --- */}
        <TabsContent value="favorites">
          {favoritedAssets.length > 0 ? (
            <MasonryGrid
              items={favoritedAssets}
              renderItem={(asset, index) => (
                <ImageCard
                  index={index}
                  asset={asset}
                  isStarredInitial={true} // 这里的收藏状态直接设为 true，因为这是收藏页，所有图片都是已收藏的
                />
              )}
            />
          ) : (
            <EmptyState
              title="暂无收藏"
              description="浏览首页并保存你喜欢的灵感。"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// 简单的内部空状态组件
function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-zinc-100 rounded-[2.5rem] bg-zinc-50/30">
      <div className="h-14 w-14 bg-white shadow-sm border border-zinc-100 rounded-2xl flex items-center justify-center text-lime-500 mb-6">
        <Sparkles size={28} strokeWidth={1.5} />
      </div>

      <h3 className="font-black text-xl text-zinc-900 tracking-tight">
        {title}
      </h3>
      <p className="text-sm text-zinc-400 mt-2 max-w-50 text-center leading-relaxed">
        {description}
      </p>

      <Link
        href="/"
        className="mt-8 group relative inline-flex items-center gap-2 text-sm font-black text-zinc-900 transition-all"
      >
        {/* 文字装饰：一个精致的青柠色下划线动画 */}
        <span className="relative">
          回到首页浏览
          <span className="absolute -bottom-1 left-0 h-0.75 w-0 bg-lime-400 transition-all duration-300 group-hover:w-full" />
        </span>
        <span className="transition-transform duration-300 group-hover:translate-x-1">
          →
        </span>
      </Link>
    </div>
  );
}
