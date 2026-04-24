import { TRPCError } from '@trpc/server'
import { and, desc, eq, exists, sql } from 'drizzle-orm'
import z from 'zod'

import { asset, assetTag, like, tag, user } from '@/db/schema'
import { chineseSlugify, objectKey2Url } from '@/lib/utils'

import { procedure, protectedProcedure, router } from '../init'

export const assetRouter = router({
  list: procedure
    .input(z.object({ tag: z.string().trim().min(1).optional() }))
    .query(async ({ ctx, input }) => {
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
          ...(ctx.session
            ? {
                likedByMe: sql<boolean>`exists(
              select 1 from ${like} 
              where ${like.assetId} = ${asset.id} 
              and ${like.userId} = ${ctx.session.user.id}
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
          input.tag
            ? exists(
                ctx.db
                  .select()
                  .from(assetTag)
                  .innerJoin(tag, eq(assetTag.tagId, tag.id))
                  .where(
                    and(
                      eq(assetTag.assetId, asset.id),
                      eq(tag.slug, input.tag),
                    ),
                  ),
              )
            : undefined,
        )
        // 分组：必须包含所有非聚合字段
        .groupBy(asset.id, user.id)
        .orderBy(desc(asset.createdAt))

      return assets.map(({ objectKey, user, ...asset }) => ({
        ...asset,
        url: objectKey2Url(objectKey),
        user: {
          ...user,
          image: user.image ? objectKey2Url(user.image) : null,
        },
      }))
    }),
  tags: procedure.query(async ({ ctx }) => {
    return await ctx.db.query.tag.findMany({
      where: (t, { exists }) =>
        exists(ctx.db.select().from(assetTag).where(eq(assetTag.tagId, t.id))),
    })
  }),
  // TODO 后续优化为批量创建
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().trim().min(1),
        objectKey: z.string().trim().min(1),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
        tags: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // const { objectKey, width, height, title, tags } = input

      try {
        // 使用数据库事务 (Transaction)，保证要么全成功，要么全失败
        const result = await ctx.db.transaction(async (tx) => {
          // 插入资产并获取 ID
          const [newAsset] = await tx
            .insert(asset)
            .values({
              title: input.title,
              objectKey: input.objectKey,
              width: input.width,
              height: input.height,
              userId: ctx.user.id,
            })
            .onConflictDoUpdate({
              target: [asset.userId, asset.objectKey],
              set: {
                title: input.title,
                width: input.width,
                height: input.height,
              },
            })
            .returning()

          // 如果是更新旧资产，建议先清理掉旧的标签关联，再重新插入
          // 这样可以保证标签始终以最后一次上传为准
          await tx.delete(assetTag).where(eq(assetTag.assetId, newAsset.id))

          // 处理标签
          if (input.tags.length > 0) {
            // 准备所有待插入的数据
            const tagsToInsert = input.tags.map((name) => ({
              name,
              slug: chineseSlugify(name),
              creatorId: ctx.user.id,
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

        return result
      } catch (error) {
        if (error instanceof TRPCError) throw error

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to save asset',
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

    return assets.map(({ objectKey, ...asset }) => ({
      ...asset,
      url: objectKey2Url(objectKey),
    }))
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

    return assets.map(({ objectKey, ...asset }) => ({
      ...asset,
      url: objectKey2Url(objectKey),
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
        .select({ userId: like.userId })
        .from(like)
        .where(and(eq(like.userId, user.id), eq(like.assetId, input.assetId)))
        .limit(1)

      if (existing.length > 0) {
        await db
          .delete(like)
          .where(and(eq(like.userId, user.id), eq(like.assetId, input.assetId)))
      } else {
        await db
          .insert(like)
          .values({ userId: user.id, assetId: input.assetId })
      }
    }),
})
