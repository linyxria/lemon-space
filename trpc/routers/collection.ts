import { TRPCError } from '@trpc/server'
import { and, desc, eq, sql } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { z } from 'zod'

import type * as schema from '@/db/schema'
import {
  asset,
  assetTag,
  collection,
  collectionItem,
  like,
  tag,
  user,
} from '@/db/schema'
import { objectKey2Url } from '@/lib/utils'

import { protectedProcedure, router } from '../init'

const collectionIdSchema = z.object({
  collectionId: z.string().trim().min(1),
})

async function assertCollectionOwner({
  db,
  userId,
  collectionId,
}: {
  db: PostgresJsDatabase<typeof schema>
  userId: string
  collectionId: string
}) {
  const ownedCollection = await db
    .select({ id: collection.id })
    .from(collection)
    .where(and(eq(collection.id, collectionId), eq(collection.userId, userId)))
    .limit(1)

  if (ownedCollection.length === 0) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Collection not found',
    })
  }
}

export const collectionRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const collections = await ctx.db
      .select({
        id: collection.id,
        name: collection.name,
        description: collection.description,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
        assetCount: sql<number>`count(${collectionItem.assetId})`.mapWith(
          Number,
        ),
      })
      .from(collection)
      .leftJoin(collectionItem, eq(collection.id, collectionItem.collectionId))
      .where(eq(collection.userId, ctx.user.id))
      .groupBy(collection.id)
      .orderBy(desc(collection.updatedAt), desc(collection.createdAt))

    return collections
  }),
  detail: protectedProcedure
    .input(collectionIdSchema)
    .query(async ({ ctx, input }) => {
      const [collectionInfo] = await ctx.db
        .select({
          id: collection.id,
          name: collection.name,
          description: collection.description,
          createdAt: collection.createdAt,
          updatedAt: collection.updatedAt,
        })
        .from(collection)
        .where(
          and(
            eq(collection.id, input.collectionId),
            eq(collection.userId, ctx.user.id),
          ),
        )
        .limit(1)

      if (!collectionInfo) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Collection not found',
        })
      }

      const likeCountExpr =
        sql<number>`count(distinct ${like.userId} || ${like.assetId})`.mapWith(
          Number,
        )

      const assets = await ctx.db
        .select({
          id: asset.id,
          title: asset.title,
          objectKey: asset.objectKey,
          width: asset.width,
          height: asset.height,
          createdAt: asset.createdAt,
          addedAt: collectionItem.addedAt,
          user: {
            id: user.id,
            name: user.name,
            image: user.image,
          },
          likeCount: likeCountExpr,
          tags: sql<string[]>`coalesce(
            json_agg(distinct ${tag.name}) filter (where ${tag.name} is not null),
            '[]'
          )`.as('tags'),
          likedByMe: sql<boolean>`exists(
            select 1 from ${like}
            where ${like.assetId} = ${asset.id}
            and ${like.userId} = ${ctx.user.id}
          )`,
        })
        .from(collectionItem)
        .innerJoin(asset, eq(collectionItem.assetId, asset.id))
        .innerJoin(user, eq(asset.userId, user.id))
        .leftJoin(like, eq(asset.id, like.assetId))
        .leftJoin(assetTag, eq(asset.id, assetTag.assetId))
        .leftJoin(tag, eq(assetTag.tagId, tag.id))
        .where(eq(collectionItem.collectionId, input.collectionId))
        .groupBy(asset.id, user.id, collectionItem.addedAt)
        .orderBy(desc(collectionItem.addedAt))

      return {
        ...collectionInfo,
        assets: assets.map(({ objectKey, user, ...item }) => ({
          ...item,
          url: objectKey2Url(objectKey),
          user: {
            ...user,
            image: user.image ? objectKey2Url(user.image) : null,
          },
        })),
      }
    }),
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(60),
        description: z.string().trim().max(240).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [createdCollection] = await ctx.db
        .insert(collection)
        .values({
          userId: ctx.user.id,
          name: input.name,
          description: input.description || null,
        })
        .returning({
          id: collection.id,
          name: collection.name,
          description: collection.description,
          createdAt: collection.createdAt,
          updatedAt: collection.updatedAt,
        })

      return createdCollection
    }),
  update: protectedProcedure
    .input(
      z
        .object({
          collectionId: z.string().trim().min(1),
          name: z.string().trim().min(1).max(60).optional(),
          description: z.string().trim().max(240).optional(),
        })
        .refine(
          (value) => Boolean(value.name || value.description !== undefined),
          {
            message: 'At least one field must be updated',
          },
        ),
    )
    .mutation(async ({ ctx, input }) => {
      const [updatedCollection] = await ctx.db
        .update(collection)
        .set({
          ...(input.name ? { name: input.name } : {}),
          ...(input.description !== undefined
            ? { description: input.description || null }
            : {}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(collection.id, input.collectionId),
            eq(collection.userId, ctx.user.id),
          ),
        )
        .returning({
          id: collection.id,
          name: collection.name,
          description: collection.description,
          createdAt: collection.createdAt,
          updatedAt: collection.updatedAt,
        })

      if (!updatedCollection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Collection not found',
        })
      }

      return updatedCollection
    }),
  delete: protectedProcedure
    .input(collectionIdSchema)
    .mutation(async ({ ctx, input }) => {
      const [deletedCollection] = await ctx.db
        .delete(collection)
        .where(
          and(
            eq(collection.id, input.collectionId),
            eq(collection.userId, ctx.user.id),
          ),
        )
        .returning({ id: collection.id })

      if (!deletedCollection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Collection not found',
        })
      }

      return {
        success: true,
      }
    }),
  toggleAsset: protectedProcedure
    .input(
      z.object({
        collectionId: z.string().trim().min(1),
        assetId: z.string().trim().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertCollectionOwner({
        db: ctx.db,
        userId: ctx.user.id,
        collectionId: input.collectionId,
      })

      const existingItem = await ctx.db
        .select({ assetId: collectionItem.assetId })
        .from(collectionItem)
        .where(
          and(
            eq(collectionItem.collectionId, input.collectionId),
            eq(collectionItem.assetId, input.assetId),
          ),
        )
        .limit(1)

      const included = existingItem.length === 0

      if (included) {
        await ctx.db.insert(collectionItem).values({
          collectionId: input.collectionId,
          assetId: input.assetId,
        })
      } else {
        await ctx.db
          .delete(collectionItem)
          .where(
            and(
              eq(collectionItem.collectionId, input.collectionId),
              eq(collectionItem.assetId, input.assetId),
            ),
          )
      }

      await ctx.db
        .update(collection)
        .set({ updatedAt: new Date() })
        .where(eq(collection.id, input.collectionId))

      return {
        included,
      }
    }),
  listForAsset: protectedProcedure
    .input(
      z.object({
        assetId: z.string().trim().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db
        .select({
          id: collection.id,
          name: collection.name,
          description: collection.description,
          updatedAt: collection.updatedAt,
          assetCount: sql<number>`(
            select count(*) from ${collectionItem}
            where ${collectionItem.collectionId} = ${collection.id}
          )`.mapWith(Number),
          included: sql<boolean>`exists(
            select 1 from ${collectionItem}
            where ${collectionItem.collectionId} = ${collection.id}
            and ${collectionItem.assetId} = ${input.assetId}
          )`,
        })
        .from(collection)
        .where(eq(collection.userId, ctx.user.id))
        .orderBy(desc(collection.updatedAt), desc(collection.createdAt))
    }),
})
