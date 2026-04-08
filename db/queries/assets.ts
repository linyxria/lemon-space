import { clerkClient } from '@clerk/nextjs/server'
import { desc, eq, inArray, sql } from 'drizzle-orm'

import { assets, assetTags, likes, tags } from '@/db/schema'
import { formatAssetUrl } from '@/lib/utils'

import { db } from '..'

export async function getAssets(
  activeTagSlug: string | undefined,
  currentUserId: string | null,
) {
  // 1. 构造基础过滤器
  const assetFilter = activeTagSlug
    ? sql`exists (
      select 1 from ${assetTags} at 
      join ${tags} t on at.tag_id = t.id 
      where at.asset_id = ${assets.id} and t.slug = ${activeTagSlug}
    )`
    : undefined

  // 2. 基础查询
  const assetsData = await db.query.assets.findMany({
    where: assetFilter,
    orderBy: [desc(assets.createdAt)],
    with: {
      tags: { with: { tag: true } },
      // 【优化点】：如果没登录，直接不查 likedBy，减少 JOIN 或子查询负担
      ...(currentUserId
        ? { likedBy: { where: eq(likes.userId, currentUserId) } }
        : {}),
    },
  })

  // 【优化点 1】：如果第一步就没数据，直接返回空，不再往下执行耗时操作
  if (assetsData.length === 0) return []

  const assetIds = assetsData.map((a) => a.id)
  const userIds = [...new Set(assetsData.map((a) => a.userId))]

  // 3. 并行执行收藏统计和用户信息查询
  const client = await clerkClient()

  const [allLikeCounts, usersList] = await Promise.all([
    db
      .select({ assetId: likes.assetId, count: sql<number>`count(*)` })
      .from(likes)
      .where(inArray(likes.assetId, assetIds))
      .groupBy(likes.assetId),
    // Clerk 这里的查询建议加上兜底，防止 userIds 为空（虽然 assetsData 有数据理论上 userId 不为空）
    userIds.length > 0
      ? client.users.getUserList({ userId: userIds, limit: userIds.length })
      : Promise.resolve({ data: [] }),
  ])

  // 4. 组装数据映射
  const likeCountMap = new Map(
    allLikeCounts.map((c) => [c.assetId, Number(c.count)]),
  )
  const userMap = new Map(usersList.data.map((u) => [u.id, u]))

  // 5. 格式化返回
  return assetsData.map((asset) => {
    const uploader = userMap.get(asset.userId)
    return {
      ...asset,
      url: formatAssetUrl(asset.objectKey),
      tags: asset.tags.map((t) => t.tag.name),
      likeCount: likeCountMap.get(asset.id) || 0,
      uploader: {
        imageUrl: uploader?.imageUrl || '',
        fullName: uploader?.username || uploader?.firstName || '匿名艺术家',
      },
    }
  })
}
