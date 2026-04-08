import { auth, clerkClient } from "@clerk/nextjs/server";
import { desc, eq, inArray,sql } from "drizzle-orm";
import { FolderUp, Heart,Sparkles } from "lucide-react";
import Link from "next/link";

import ImageCard from "@/components/ImageCard";
import MasonryGrid from "@/components/MasonryGrid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/db";
import { assets, likes } from "@/db/schema";
import { formatAssetUrl } from "@/lib/utils";

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
  const [myUploadsRaw, myLikesRaw] = await Promise.all([
    db.query.assets.findMany({
      where: eq(assets.userId, userId),
      orderBy: [desc(assets.createdAt)],
    }),
    db.query.likes.findMany({
      where: eq(likes.userId, userId),
      with: { asset: true },
    }),
  ]);

  // 创建一个 Set，存放当前用户真正收藏过的所有 Asset ID
  const myLikeIdSet = new Set(myLikesRaw.map((f) => f.assetId));

  // 4. 【核心优化】批量获取所有相关图片的收藏总数 (聚合查询)
  const allAssetIds = [
    ...myUploadsRaw.map((a) => a.id),
    ...myLikesRaw.map((f) => f.assetId),
  ];

  let likeCountsMap: Record<string, number> = {};

  if (allAssetIds.length > 0) {
    const counts = await db
      .select({
        assetId: likes.assetId,
        count: sql<number>`count(*)`,
      })
      .from(likes)
      .where(inArray(likes.assetId, allAssetIds))
      .groupBy(likes.assetId);

    likeCountsMap = Object.fromEntries(
      counts.map((c) => [c.assetId, Number(c.count)]),
    );
  }

  // 5. 内存中合并数据 (不再请求数据库)
  const myUploads = myUploadsRaw.map((asset) => ({
    ...asset,
    url: formatAssetUrl(asset.objectKey),
    likeCount: likeCountsMap[asset.id] || 0,
    uploader: myInfo,
  }));

  const likedAssets = myLikesRaw.map((f) => ({
    ...f.asset,
    url: formatAssetUrl(f.asset.objectKey),
    likeCount: likeCountsMap[f.asset.id] || 0,
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
            value="likes"
            className="flex items-center gap-2 rounded-lg px-6"
          >
            <Heart size={16} />
            我喜爱的 ({likedAssets.length})
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
                  isLikedInitial={myLikeIdSet.has(asset.id)}
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
        <TabsContent value="likes">
          {likedAssets.length > 0 ? (
            <MasonryGrid
              items={likedAssets}
              renderItem={(asset, index) => (
                <ImageCard
                  index={index}
                  asset={asset}
                  isLikedInitial={true} // 这里的收藏状态直接设为 true，因为这是收藏页，所有图片都是已收藏的
                />
              )}
            />
          ) : (
            <EmptyState
              title="暂无喜爱的资源"
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
