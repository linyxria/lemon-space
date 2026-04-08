import { auth } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'
import Link from 'next/link'

import Empty from '@/components/Empty'
import ImageCard from '@/components/ImageCard'
import MasonryGrid from '@/components/MasonryGrid'
import TagBar from '@/components/TagBar'
import { db } from '@/db'
import { getAssets } from '@/db/queries/assets'
import { assetTags } from '@/db/schema'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>
}) {
  const { tag: activeTagSlug } = await searchParams

  // 1. 【核心：第一步】获取 Asset 数据
  // 先不管鉴权，先看有没有我们要展示的内容
  const { userId } = await auth()
  const data = await getAssets(activeTagSlug, userId)

  // 2. 【分流处理】
  // 如果当前“既没有选标签”且“结果还是空的”，那说明画廊是真的彻底空了
  if (data.length === 0 && !activeTagSlug) {
    return <Empty />
  }

  // 3. 【延迟加载】
  // 走到这里，说明要么有数据，要么是在筛选某个标签。
  // 此时我们再去查标签列表，用于渲染顶部的筛选条。
  const allTags = await db.query.tags.findMany({
    where: (t, { exists }) =>
      exists(db.select().from(assetTags).where(eq(assetTags.tagId, t.id))),
  })

  return (
    <div className="space-y-3 md:space-y-6">
      {/* 顶部标签筛选区 */}
      {allTags.length > 0 && (
        <TagBar tags={allTags} activeTagSlug={activeTagSlug} />
      )}

      {/* 图片瀑布流 */}
      {data.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-zinc-400 font-medium">该分类下暂时没有资源</p>
          <Link
            href="/"
            className="mt-2 inline-block text-lime-600 text-sm font-bold hover:underline"
          >
            返回画廊
          </Link>
        </div>
      ) : (
        <MasonryGrid
          items={data}
          renderItem={(asset, index) => (
            <ImageCard
              asset={asset}
              index={index}
              isLikedInitial={!!userId && asset.likedBy.length > 0}
            />
          )}
        />
      )}
    </div>
  )
}
