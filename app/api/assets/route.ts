import { auth } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/db'
import { assets, assetTags, tags } from '@/db/schema'
import { chineseSlugify } from '@/lib/utils'

interface CreateAssetRequest {
  title: string
  objectKey: string
  width: number
  height: number
  tags?: string[]
}

export async function POST(request: Request) {
  const { userId } = await auth()

  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  const {
    title,
    objectKey,
    width,
    height,
    tags: tagNames = [],
  }: CreateAssetRequest = await request.json()

  try {
    // 使用数据库事务 (Transaction)，保证要么全成功，要么全失败
    const result = await db.transaction(async (tx) => {
      // 插入资产并获取 ID
      const [newAsset] = await tx
        .insert(assets)
        .values({
          userId,
          objectKey,
          title,
          width,
          height,
        })
        .onConflictDoUpdate({
          target: [assets.userId, assets.objectKey],
          set: {
            title,
            width,
            height,
          },
        })
        .returning()

      // 如果是更新旧资产，建议先清理掉旧的标签关联，再重新插入
      // 这样可以保证标签始终以最后一次上传为准
      await tx.delete(assetTags).where(eq(assetTags.assetId, newAsset.id))

      // 处理标签
      if (tagNames.length > 0) {
        // 准备所有待插入的数据
        const tagsToInsert = tagNames.map((name) => ({
          name,
          slug: chineseSlugify(name),
          creatorId: userId,
        }))

        const insertedTags = await tx
          .insert(tags)
          .values(tagsToInsert)
          .onConflictDoUpdate({
            target: tags.slug,
            set: { slug: tags.slug }, // 关键：保持 slug 不变，触发 upsert 行为但不修改数据
          })
          .returning()

        const insertedTagIds = insertedTags.map((t) => t.id)

        // 批量插入中间表关联关系
        if (insertedTagIds.length > 0) {
          await tx.insert(assetTags).values(
            insertedTagIds.map((tagId) => ({
              assetId: newAsset.id,
              tagId,
            })),
          )
        }
      }

      return newAsset
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to save asset:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
