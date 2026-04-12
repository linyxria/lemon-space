import type { User } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'
import type { BuildQueryResult, ExtractTablesWithRelations } from 'drizzle-orm'
import { and, eq, inArray, sql } from 'drizzle-orm'

import type * as schema from '@/db/schema'
import { likes } from '@/db/schema'
import { formatAssetUrl } from '@/lib/utils'

import { db } from '..'

// 1. 获取所有表及其关系
type TSchema = ExtractTablesWithRelations<typeof schema>

// 2. 构造包含 tags 关联的 Assets 类型
export type RawAssetWithRelations = BuildQueryResult<
  TSchema,
  TSchema['assets'], // 指定资产表
  {
    with: {
      tags: { with: { tag: true } } // 必须和你在 getAssets 里写的 with 结构完全一致
    }
  }
>

// 3. 定义补全后的类型 (供 UI 使用)
export type HydratedAsset = Omit<RawAssetWithRelations, 'tags'> & {
  url: string
  likeCount: number
  isLikedByMe: boolean
  user: {
    id: string
    username: string
    imageUrl: string
  }
  tags: string[] // 补全后我们将复杂的 tags 对象数组拍平为 string[]
}

function clerkUserToProfile(user: User | undefined) {
  if (!user) return { id: '', username: '未知用户', imageUrl: '' }

  return {
    id: user.id,
    username: user.username || user.firstName || '艺术家',
    imageUrl: user.imageUrl,
  }
}

export async function hydrateAssets(
  rawAssets: RawAssetWithRelations[],
  currentUserId: string | null,
  forceLiked = false,
): Promise<HydratedAsset[]> {
  if (rawAssets.length === 0) return []

  const assetIds = rawAssets.map((a) => a.id)
  const userIds = [...new Set(rawAssets.map((a) => a.userId))]

  const client = await clerkClient()

  const [allLikeCounts, userList, currentUserLikes] = await Promise.all([
    // 1. 查所有人的点赞总数
    db
      .select({ assetId: likes.assetId, count: sql<number>`count(*)` })
      .from(likes)
      .where(inArray(likes.assetId, assetIds))
      .groupBy(likes.assetId),

    // 2. 查上传者信息
    userIds.length > 0
      ? client.users.getUserList({ userId: userIds, limit: userIds.length })
      : Promise.resolve({ data: [] }),

    // 3. 【核心回归】：查当前用户是否点赞过这些图
    currentUserId && !forceLiked
      ? db
          .select({ assetId: likes.assetId })
          .from(likes)
          .where(
            and(
              eq(likes.userId, currentUserId),
              inArray(likes.assetId, assetIds),
            ),
          )
      : Promise.resolve([]),
  ])

  const likeCountMap = new Map(
    allLikeCounts.map((c) => [c.assetId, Number(c.count)]),
  )
  const userMap = new Map(userList.data.map((u) => [u.id, u]))
  // 将当前用户点赞过的 ID 存入 Set，方便 O(1) 查询
  const likedByMeSet = new Set(currentUserLikes.map((l) => l.assetId))

  return rawAssets.map((asset) => {
    const user = userMap.get(asset.userId)
    return {
      ...asset,
      url: formatAssetUrl(asset.objectKey),
      tags: asset.tags.map((t) => t.tag.name),
      likeCount: likeCountMap.get(asset.id) || 0,
      isLikedByMe: forceLiked || likedByMeSet.has(asset.id), // 👈 给前端用的标记
      user: clerkUserToProfile(user),
    }
  })
}
