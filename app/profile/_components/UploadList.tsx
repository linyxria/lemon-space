import { desc, eq, sql } from 'drizzle-orm'

import MasonryLayout from '@/components/MasonryLayout'
import { db } from '@/db'
import { asset, like } from '@/db/schema'
import { objectKey2Url } from '@/lib/utils'

import TabsEmpty from './TabsEmpty'

export default async function UploadList({ userId }: { userId: string }) {
  const assetsData = await db
    .select({
      // 基础字段
      id: asset.id,
      title: asset.title,
      objectKey: asset.objectKey,
      width: asset.width,
      height: asset.height,
      createdAt: asset.createdAt,
      likeCount: sql<number>`(
        select count(*) from ${like} 
        where ${like.assetId} = ${asset.id}
      )`.mapWith(Number),
      likedByMe: sql<boolean>`exists(
        select 1 from ${like} 
        where ${like.assetId} = ${asset.id} 
        and ${like.userId} = ${userId}
      )`,
    })
    .from(asset)
    .where(eq(asset.userId, userId))
    .orderBy(desc(asset.createdAt))

  if (assetsData.length === 0) {
    return (
      <TabsEmpty
        title="尚未上传资源"
        description="分享你的第一个灵感给社区吧！"
      />
    )
  }

  const items = assetsData.map(({ objectKey, ...item }) => ({
    ...item,
    url: objectKey2Url(objectKey),
  }))

  return <MasonryLayout items={items} />
}
