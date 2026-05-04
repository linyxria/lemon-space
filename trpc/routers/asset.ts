import { TRPCError } from '@trpc/server'
import { and, desc, eq, exists, ilike, inArray, or, sql } from 'drizzle-orm'
import z from 'zod'

import type { db } from '@/db'
import { asset, assetLike, assetTag, assetTagLink, user } from '@/db/schema'
import { chineseSlugify } from '@/lib/utils'

import { procedure, protectedProcedure, router } from '../init'
import {
  createDistinctLikeUserCountExpr,
  createTagNamesAggExpr,
  mapObjectKeyToUrl,
  mapUserImageToUrl,
} from './shared'

const tagListSchema = z.array(z.string().trim().min(1))

const assetCreateSchema = z.object({
  title: z.string().trim().min(1),
  objectKey: z.string().trim().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  tags: tagListSchema,
})

const assetBatchItemSchema = assetCreateSchema.omit({ tags: true })

function normalizeTags(tags: string[]) {
  return Array.from(new Set(tags))
}

function normalizeAssetsByObjectKey(
  items: Array<z.infer<typeof assetBatchItemSchema>>,
) {
  const byObjectKey = new Map<string, z.infer<typeof assetBatchItemSchema>>()

  for (const item of items) {
    byObjectKey.set(item.objectKey, item)
  }

  return Array.from(byObjectKey.values())
}

async function saveAssets(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  userId: string,
  items: Array<z.infer<typeof assetBatchItemSchema>>,
  rawTags: string[],
) {
  const tags = normalizeTags(rawTags)
  const assets = normalizeAssetsByObjectKey(items)

  const savedAssets = await tx
    .insert(asset)
    .values(
      assets.map((item) => ({
        ...item,
        userId,
      })),
    )
    .onConflictDoUpdate({
      target: [asset.userId, asset.objectKey],
      set: {
        title: sql`excluded.title`,
        width: sql`excluded.width`,
        height: sql`excluded.height`,
      },
    })
    .returning()

  if (savedAssets.length === 0) return savedAssets

  await tx.delete(assetTagLink).where(
    inArray(
      assetTagLink.assetId,
      savedAssets.map(({ id }) => id),
    ),
  )

  if (tags.length === 0) return savedAssets

  const insertedTags = await tx
    .insert(assetTag)
    .values(
      tags.map((name) => ({
        name,
        slug: chineseSlugify(name),
        creatorId: userId,
      })),
    )
    .onConflictDoUpdate({
      target: assetTag.slug,
      set: { slug: assetTag.slug },
    })
    .returning()

  const tagIds = insertedTags.map(({ id }) => id)

  if (tagIds.length > 0) {
    await tx.insert(assetTagLink).values(
      savedAssets.flatMap(({ id: assetId }) =>
        tagIds.map((tagId) => ({
          assetId,
          tagId,
        })),
      ),
    )
  }

  return savedAssets
}

export const assetRouter = router({
  list: procedure
    .input(
      z.object({
        tag: z.string().trim().min(1).optional(),
        q: z.string().trim().min(1).optional(),
        sort: z.enum(['latest', 'popular']).default('latest'),
        limit: z.number().int().min(1).max(48).default(24),
        cursor: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const likeCountExpr = createDistinctLikeUserCountExpr()

      const assets = await ctx.db
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
          likeCount: likeCountExpr,

          // 3. 标签数组 (将关联查询结果聚合成 JSON 数组)
          tags: createTagNamesAggExpr(),

          // 4. 当前用户是否点赞
          ...(ctx.session
            ? {
                likedByMe: sql<boolean>`exists(
              select 1 from ${assetLike} 
              where ${assetLike.assetId} = ${asset.id} 
              and ${assetLike.userId} = ${ctx.session.user.id}
            )`,
              }
            : {}),
        })
        .from(asset)
        // 关联用户
        .innerJoin(user, eq(asset.userId, user.id))
        // 关联点赞 (用于 count)
        .leftJoin(assetLike, eq(asset.id, assetLike.assetId))
        // 关联标签 (两层 join 拿到标签名)
        .leftJoin(assetTagLink, eq(asset.id, assetTagLink.assetId))
        .leftJoin(assetTag, eq(assetTagLink.tagId, assetTag.id))
        // 过滤逻辑
        .where(
          and(
            input.tag
              ? exists(
                  ctx.db
                    .select()
                    .from(assetTagLink)
                    .innerJoin(assetTag, eq(assetTagLink.tagId, assetTag.id))
                    .where(
                      and(
                        eq(assetTagLink.assetId, asset.id),
                        eq(assetTag.slug, input.tag),
                      ),
                    ),
                )
              : undefined,
            input.q
              ? or(
                  ilike(asset.title, `%${input.q}%`),
                  exists(
                    ctx.db
                      .select()
                      .from(assetTagLink)
                      .innerJoin(assetTag, eq(assetTagLink.tagId, assetTag.id))
                      .where(
                        and(
                          eq(assetTagLink.assetId, asset.id),
                          ilike(assetTag.name, `%${input.q}%`),
                        ),
                      ),
                  ),
                )
              : undefined,
          ),
        )
        // 分组：必须包含所有非聚合字段
        .groupBy(asset.id, user.id)
        .orderBy(
          input.sort === 'popular'
            ? desc(likeCountExpr)
            : desc(asset.createdAt),
          desc(asset.createdAt),
          desc(asset.id),
        )
        .offset(input.cursor)
        .limit(input.limit + 1)

      const hasMore = assets.length > input.limit
      const slice = hasMore ? assets.slice(0, input.limit) : assets

      return {
        items: slice.map((item) => ({
          ...mapObjectKeyToUrl(item),
          user: mapUserImageToUrl(item.user),
        })),
        nextCursor: hasMore ? input.cursor + input.limit : undefined,
      }
    }),
  related: procedure
    .input(
      z.object({
        assetId: z.string().trim().min(1),
        limit: z.number().int().min(1).max(12).default(6),
      }),
    )
    .query(async ({ ctx, input }) => {
      const relatedTagIds = await ctx.db
        .select({ tagId: assetTagLink.tagId })
        .from(assetTagLink)
        .where(eq(assetTagLink.assetId, input.assetId))

      const tagIds = relatedTagIds.map(({ tagId }) => tagId)
      const likeCountExpr = createDistinctLikeUserCountExpr()

      const relatedAssets = await ctx.db
        .select({
          id: asset.id,
          title: asset.title,
          objectKey: asset.objectKey,
          width: asset.width,
          height: asset.height,
          createdAt: asset.createdAt,
          likeCount: likeCountExpr,
          tags: createTagNamesAggExpr(),
        })
        .from(asset)
        .leftJoin(assetLike, eq(asset.id, assetLike.assetId))
        .leftJoin(assetTagLink, eq(asset.id, assetTagLink.assetId))
        .leftJoin(assetTag, eq(assetTagLink.tagId, assetTag.id))
        .where(
          tagIds.length > 0
            ? and(
                sql`${asset.id} <> ${input.assetId}`,
                exists(
                  ctx.db
                    .select()
                    .from(assetTagLink)
                    .where(
                      and(
                        eq(assetTagLink.assetId, asset.id),
                        inArray(assetTagLink.tagId, tagIds),
                      ),
                    ),
                ),
              )
            : sql`${asset.id} <> ${input.assetId}`,
        )
        .groupBy(asset.id)
        .orderBy(desc(likeCountExpr), desc(asset.createdAt))
        .limit(input.limit)

      return relatedAssets.map((item) => mapObjectKeyToUrl(item))
    }),
  tags: procedure.query(async ({ ctx }) => {
    return await ctx.db
      .select({
        id: assetTag.id,
        name: assetTag.name,
        slug: assetTag.slug,
        assetCount: sql<number>`count(${assetTagLink.assetId})`.mapWith(Number),
      })
      .from(assetTag)
      .innerJoin(assetTagLink, eq(assetTagLink.tagId, assetTag.id))
      .groupBy(assetTag.id)
      .orderBy(desc(sql`count(${assetTagLink.assetId})`), assetTag.name)
  }),
  featured: procedure.query(async ({ ctx }) => {
    const likeCountExpr = createDistinctLikeUserCountExpr()

    const featuredAssets = await ctx.db
      .select({
        id: asset.id,
        title: asset.title,
        objectKey: asset.objectKey,
        width: asset.width,
        height: asset.height,
        likeCount: likeCountExpr,
      })
      .from(asset)
      .leftJoin(assetLike, eq(asset.id, assetLike.assetId))
      .groupBy(asset.id)
      .orderBy(desc(likeCountExpr), desc(asset.createdAt))
      .limit(4)

    const hotTags = await ctx.db
      .select({
        id: assetTag.id,
        name: assetTag.name,
        slug: assetTag.slug,
        assetCount: sql<number>`count(${assetTagLink.assetId})`.mapWith(Number),
      })
      .from(assetTag)
      .innerJoin(assetTagLink, eq(assetTagLink.tagId, assetTag.id))
      .groupBy(assetTag.id)
      .orderBy(desc(sql`count(${assetTagLink.assetId})`), assetTag.name)
      .limit(8)

    return {
      featuredAssets: featuredAssets.map((item) => mapObjectKeyToUrl(item)),
      hotTags,
    }
  }),
  create: protectedProcedure
    .input(assetCreateSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await ctx.db.transaction(async (tx) => {
          const [savedAsset] = await saveAssets(
            tx,
            ctx.user.id,
            [
              {
                title: input.title,
                objectKey: input.objectKey,
                width: input.width,
                height: input.height,
              },
            ],
            input.tags,
          )

          return savedAsset
        })

        return result
      } catch (error) {
        if (error instanceof TRPCError) throw error

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to save asset',
        })
      }
    }),
  createBatch: protectedProcedure
    .input(
      z.object({
        assets: z.array(assetBatchItemSchema).min(1),
        tags: tagListSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.db.transaction(async (tx) =>
          saveAssets(tx, ctx.user.id, input.assets, input.tags),
        )
      } catch (error) {
        console.error('asset.createBatch failed', error)

        if (error instanceof TRPCError) throw error

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to save assets',
        })
      }
    }),
  listByMe: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id
    const assets = await ctx.db
      .select({
        // 基础字段
        id: asset.id,
        title: asset.title,
        objectKey: asset.objectKey,
        width: asset.width,
        height: asset.height,
        createdAt: asset.createdAt,
        tags: createTagNamesAggExpr(),
        likeCount: sql<number>`(
        select count(*) from ${assetLike} 
        where ${assetLike.assetId} = ${asset.id}
      )`.mapWith(Number),
        likedByMe: sql<boolean>`exists(
        select 1 from ${assetLike} 
        where ${assetLike.assetId} = ${asset.id} 
        and ${assetLike.userId} = ${userId}
      )`,
      })
      .from(asset)
      .leftJoin(assetTagLink, eq(asset.id, assetTagLink.assetId))
      .leftJoin(assetTag, eq(assetTagLink.tagId, assetTag.id))
      .where(eq(asset.userId, userId))
      .groupBy(asset.id)
      .orderBy(desc(asset.createdAt))

    return assets.map((item) => mapObjectKeyToUrl(item))
  }),
  listByMeLike: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id
    const assets = await ctx.db
      .select({
        // 基础字段
        id: asset.id,
        title: asset.title,
        objectKey: asset.objectKey,
        width: asset.width,
        height: asset.height,
        createdAt: asset.createdAt,
        tags: createTagNamesAggExpr(),

        // 发布该资产的用户信息（如果需要）
        user: {
          id: user.id,
          name: user.name,
          image: user.image,
        },

        // 统计该资产的总点赞数
        likeCount: sql<number>`(
            select count(*) from ${assetLike} 
            where ${assetLike.assetId} = ${asset.id}
          )`.mapWith(Number),
      })
      .from(assetLike)
      // 1. 联表获取资产详情
      .innerJoin(asset, eq(assetLike.assetId, asset.id))
      .leftJoin(assetTagLink, eq(asset.id, assetTagLink.assetId))
      .leftJoin(assetTag, eq(assetTagLink.tagId, assetTag.id))
      // 2. 联表获取原作者信息（可选）
      .innerJoin(user, eq(asset.userId, user.id))
      // 3. 核心过滤：谁点的赞？
      .where(eq(assetLike.userId, userId))
      .groupBy(asset.id, user.id, assetLike.createdAt)
      // 4. 按点赞时间排序
      .orderBy(desc(assetLike.createdAt))

    return assets.map((item) => ({
      ...mapObjectKeyToUrl(item),
      likedByMe: true,
    }))
  }),
  toggleLike: protectedProcedure
    .input(
      z.object({
        assetId: z.string().trim().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db, user } = ctx

      const existing = await db
        .select({ userId: assetLike.userId })
        .from(assetLike)
        .where(
          and(eq(assetLike.userId, user.id), eq(assetLike.assetId, input.assetId)),
        )
        .limit(1)

      if (existing.length > 0) {
        await db
          .delete(assetLike)
          .where(
            and(
              eq(assetLike.userId, user.id),
              eq(assetLike.assetId, input.assetId),
            ),
          )
      } else {
        await db
          .insert(assetLike)
          .values({ userId: user.id, assetId: input.assetId })
          .onConflictDoNothing()
      }
    }),
})
