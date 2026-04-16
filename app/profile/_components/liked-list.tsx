import { desc, eq, sql } from 'drizzle-orm'

import MasonryLayout from '@/components/masonry-layout'
import { db } from '@/db'
import { asset, like, user } from '@/db/schema'
import { objectKey2Url } from '@/lib/utils'

import TabsEmpty from './tabs-empty'

export default async function LikedList({ userId }: { userId: string }) {
  const likedAssets = await db
    .select({
      // 基础字段
      id: asset.id,
      title: asset.title,
      objectKey: asset.objectKey,
      width: asset.width,
      height: asset.height,
      createdAt: asset.createdAt,

      // 发布该资产的用户信息（如果需要）
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
      },

      // 统计该资产的总点赞数
      likeCount: sql<number>`(
        select count(*) from ${like} 
        where ${like.assetId} = ${asset.id}
      )`.mapWith(Number),
    })
    .from(like)
    // 1. 联表获取资产详情
    .innerJoin(asset, eq(like.assetId, asset.id))
    // 2. 联表获取原作者信息（可选）
    .innerJoin(user, eq(asset.userId, user.id))
    // 3. 核心过滤：谁点的赞？
    .where(eq(like.userId, userId))
    // 4. 按点赞时间排序
    .orderBy(desc(like.createdAt))

  if (likedAssets.length === 0) {
    return (
      <TabsEmpty
        title="暂无喜爱的资源"
        description="浏览首页并保存你喜欢的灵感。"
      />
    )
  }

  const items = likedAssets.map(({ objectKey, ...item }) => ({
    ...item,
    url: objectKey2Url(objectKey),
    likedByMe: true,
  }))

  return <MasonryLayout items={items} />
}
