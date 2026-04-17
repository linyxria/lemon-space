import { and, desc, eq, exists, sql } from 'drizzle-orm'
import Link from 'next/link'

import MasonryLayout from '@/components/masonry-layout'
import { db } from '@/db'
import { asset, assetTag, like, tag, user } from '@/db/schema'
import { getSession } from '@/lib/auth'
import { objectKey2Url } from '@/lib/utils'

import GalleryEmpty from './_components/gallery-empty'
import TagBar from './_components/tag-bar'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>
}) {
  const { tag: tagSlug } = await searchParams

  const session = await getSession()

  const assetsData = await db
    .select({
      // 基础字段
      id: asset.id,
      title: asset.title,
      objectKey: asset.objectKey,
      width: asset.width,
      height: asset.height,
      createdAt: asset.createdAt,

      // 1. 用户对象 (直接在 SQL 里构造)
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
      },

      // 2. 点赞总数
      likeCount:
        sql<number>`count(distinct ${like.userId} || ${like.assetId})`.mapWith(
          Number,
        ),

      // 3. 标签数组 (将关联查询结果聚合成 JSON 数组)
      tags: sql<string[]>`coalesce(
        json_agg(distinct ${tag.name}) filter (where ${tag.name} is not null), 
        '[]'
      )`.as('tags'),

      // 4. 当前用户是否点赞
      ...(session
        ? {
            likedByMe: sql<boolean>`exists(
              select 1 from ${like} 
              where ${like.assetId} = ${asset.id} 
              and ${like.userId} = ${session.user.id}
            )`,
          }
        : {}),
    })
    .from(asset)
    // 关联用户
    .innerJoin(user, eq(asset.userId, user.id))
    // 关联点赞 (用于 count)
    .leftJoin(like, eq(asset.id, like.assetId))
    // 关联标签 (两层 join 拿到标签名)
    .leftJoin(assetTag, eq(asset.id, assetTag.assetId))
    .leftJoin(tag, eq(assetTag.tagId, tag.id))
    // 过滤逻辑
    .where(
      tagSlug
        ? exists(
            db
              .select()
              .from(assetTag)
              .innerJoin(tag, eq(assetTag.tagId, tag.id))
              .where(
                and(eq(assetTag.assetId, asset.id), eq(tag.slug, tagSlug)),
              ),
          )
        : undefined,
    )
    // 分组：必须包含所有非聚合字段
    .groupBy(asset.id, user.id)
    .orderBy(desc(asset.createdAt))

  // 2. 【分流处理】
  // 如果当前“既没有选标签”且“结果还是空的”，那说明画廊是真的彻底空了
  if (assetsData.length === 0 && !tagSlug) {
    return <GalleryEmpty />
  }

  // 3. 【延迟加载】
  // 走到这里，说明要么有数据，要么是在筛选某个标签。
  // 此时我们再去查标签列表，用于渲染顶部的筛选条。
  const allTags = await db.query.tag.findMany({
    where: (t, { exists }) =>
      exists(db.select().from(assetTag).where(eq(assetTag.tagId, t.id))),
  })

  const items = assetsData.map(
    ({ objectKey, user: { image, ...user }, ...item }) => ({
      ...item,
      url: objectKey2Url(objectKey),
      user: {
        ...user,
        image: image ? objectKey2Url(image) : null,
      },
    }),
  )

  return (
    <div className="space-y-4">
      {/* 顶部标签筛选区 */}
      {allTags.length > 0 && <TagBar tags={allTags} selected={tagSlug} />}

      {/* 图片瀑布流 */}
      {items.length === 0 ? (
        <div className="py-20 text-center">
          <p className="font-medium text-zinc-400">该分类下暂时没有资源</p>
          <Link
            href="/"
            className="text-primary mt-2 inline-block text-sm font-bold hover:underline"
          >
            返回画廊
          </Link>
        </div>
      ) : (
        <MasonryLayout items={items} />
      )}
    </div>
  )
}
