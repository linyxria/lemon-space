import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { db } from '@/db'
import { assets, assetTags, tags } from '@/db/schema'
import { chineseSlugify } from '@/lib/utils'

export async function POST(request: Request) {
  const { userId } = await auth()

  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  const {
    title,
    objectKey,
    width,
    height,
    tags: tagNames = [],
  } = await request.json()

  try {
    // 使用数据库事务 (Transaction)，保证要么全成功，要么全失败
    const result = await db.transaction(async (tx) => {
      // 1. 插入资产并获取 ID
      const [newAsset] = await tx
        .insert(assets)
        .values({
          userId,
          title,
          objectKey,
          width,
          height,
        })
        .returning()

      if (tagNames.length > 0) {
        const tagIds: string[] = []

        for (const name of tagNames) {
          // 2. 插入或忽略现有标签 (Upsert 逻辑)
          // onConflictDoUpdate 可以保证即使标签存在，也会返回该行数据
          const [tag] = await tx
            .insert(tags)
            .values({ name, slug: chineseSlugify(name) })
            .onConflictDoUpdate({
              target: tags.slug,
              set: { name }, // 如果冲突了，更新一下名字也没关系
            })
            .returning()

          tagIds.push(tag.id)
        }

        // 3. 批量插入中间表关联关系
        if (tagIds.length > 0) {
          await tx.insert(assetTags).values(
            tagIds.map((tagId) => ({
              assetId: newAsset.id,
              tagId: tagId,
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
