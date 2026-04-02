import { db } from "@/db";
import { assets } from "@/db/schema";
import { desc } from "drizzle-orm";
import ImageCard from "@/components/ImageCard"; // 别急，待会写这个组件

export default async function GalleryPage() {
  // 1. 服务端直接查库，按时间倒序
  const allAssets = await db.select().from(assets).orderBy(desc(assets.createdAt));

  return (
    <main className="min-h-screen bg-zinc-50 p-8">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl">
          Aether <span className="text-blue-600">Vault</span>
        </h1>
        <p className="mt-4 text-zinc-600">灵感与资源的聚合地</p>
      </header>

      {/* 瀑布流布局：利用 CSS Columns 实现，简单且丝滑 */}
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4 -mb-4">
        {allAssets.map((asset) => (
          <div key={asset.id} className="mb-4 break-inside-avoid">
            <ImageCard asset={asset} />
          </div>
        ))}
      </div>

      {allAssets.length === 0 && (
        <div className="text-center py-20 text-zinc-400">
          这里空空如也，去首页传一张吧！
        </div>
      )}
    </main>
  );
}