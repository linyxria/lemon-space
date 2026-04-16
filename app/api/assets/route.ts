import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/db'
import { asset, assetTag, tag } from '@/db/schema'
import { getSession } from '@/lib/auth'
import { chineseSlugify } from '@/lib/utils'

interface CreateAssetRequest {
  title: string
  objectKey: string
  width: number
  height: number
  tags?: string[]
}

export async function POST(request: Request) {
  const session = await getSession()

  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const userId = session.user.id

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
        .insert(asset)
        .values({
          userId,
          objectKey,
          title,
          width,
          height,
        })
        .onConflictDoUpdate({
          target: [asset.userId, asset.objectKey],
          set: {
            title,
            width,
            height,
          },
        })
        .returning()

      // 如果是更新旧资产，建议先清理掉旧的标签关联，再重新插入
      // 这样可以保证标签始终以最后一次上传为准
      await tx.delete(assetTag).where(eq(assetTag.assetId, newAsset.id))

      // 处理标签
      if (tagNames.length > 0) {
        // 准备所有待插入的数据
        const tagsToInsert = tagNames.map((name) => ({
          name,
          slug: chineseSlugify(name),
          creatorId: userId,
        }))

        const insertedTags = await tx
          .insert(tag)
          .values(tagsToInsert)
          .onConflictDoUpdate({
            target: tag.slug,
            set: { slug: tag.slug }, // 关键：保持 slug 不变，触发 upsert 行为但不修改数据
          })
          .returning()

        const insertedTagIds = insertedTags.map((t) => t.id)

        // 批量插入中间表关联关系
        if (insertedTagIds.length > 0) {
          await tx.insert(assetTag).values(
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
