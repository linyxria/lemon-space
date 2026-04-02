import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { assets, favorites } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import ImageCard from "@/components/ImageCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FolderUp, Bookmark, Sparkles } from "lucide-react";
import Link from "next/link";

// 定义数据库查出来的原始 Asset 类型
type RawAsset = typeof assets.$inferSelect;

// 或者更直接一点，针对你这个页面
interface EnrichResult extends RawAsset {
  favoriteCount: number;
  uploader: {
    imageUrl: string;
    fullName: string;
  };
}

export default async function ProfilePage() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // 1. 获取当前用户信息（用于补全 uploader）
  const client = await clerkClient();
  const me = await client.users.getUser(userId);
  const myInfo = {
    imageUrl: me.imageUrl,
    fullName: me.username || me.firstName || "艺术家",
  };

  // 2. 并发查询：我的上传 & 我的收藏
  const [myUploadsRaw, myFavoritesRaw] = await Promise.all([
    db.query.assets.findMany({
      where: eq(assets.userId, userId),
      orderBy: [desc(assets.createdAt)],
    }),
    db.query.favorites.findMany({
      where: eq(favorites.userId, userId),
      with: {
        asset: true,
      },
    }),
  ]);

  // 3. 数据补全函数 (封装一下，避免重复代码)
  const enrichAsset = async (asset: RawAsset): Promise<EnrichResult> => {
    // 统计收藏数
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(favorites)
      .where(eq(favorites.assetId, asset.id));

    return {
      ...asset,
      favoriteCount: Number(countResult?.count || 0),
      uploader: myInfo, // 个人页的上传者和收藏展示，逻辑上都可以用“我”
    };
  };

  const myUploads = await Promise.all(myUploadsRaw.map(enrichAsset));
  const favoritedAssets = await Promise.all(
    myFavoritesRaw.map((f) => enrichAsset(f.asset)),
  );

  return (
    <div className="flex-1 flex flex-col p-8 max-w-7xl mx-auto w-full">
      <header className="mb-10">
        <h1 className="text-4xl font-black text-zinc-900 tracking-tight">
          个人中心
        </h1>
        <p className="text-zinc-500 mt-2">管理你的灵感与上传资源</p>
      </header>

      <Tabs defaultValue="uploads" className="w-full">
        <TabsList className="bg-zinc-100 p-1 rounded-xl mb-8">
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
            <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">
              {myUploads.map((asset, index) => (
                <div
                  key={`${asset.id}-${userId}`}
                  className="mb-5 break-inside-avoid"
                >
                  <ImageCard
                    index={index}
                    asset={asset}
                    isStarredInitial={true}
                  />
                </div>
              ))}
            </div>
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
            <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">
              {favoritedAssets.map((asset, index) => (
                <div
                  key={`${asset.id}-${userId}`}
                  className="mb-5 break-inside-avoid"
                >
                  <ImageCard
                    index={index}
                    asset={asset}
                    isStarredInitial={true}
                  />
                </div>
              ))}
            </div>
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
    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-zinc-100 rounded-3xl bg-zinc-50/50">
      <div className="h-12 w-12 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 mb-4">
        <Sparkles size={24} />
      </div>
      <h3 className="font-bold text-zinc-900">{title}</h3>
      <p className="text-sm text-zinc-500 mt-1">{description}</p>
      <Link
        href="/"
        className="mt-6 text-sm font-bold text-blue-600 hover:underline"
      >
        回到首页浏览 →
      </Link>
    </div>
  );
}
