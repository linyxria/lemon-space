import { TRPCError } from "@trpc/server"
import { and, desc, eq, inArray, sql } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { z } from "zod"

import type * as schema from "@/db/schema"
import {
  asset,
  assetLike,
  assetTag,
  assetTagLink,
  collection,
  collectionAsset,
  collectionPost,
  post,
  postBookmark,
  postLike,
  postTag,
  postTagLink,
  user,
} from "@/db/schema"

import { protectedProcedure, router } from "../init"
import {
  createDistinctLikeUserCountExpr,
  createTagNamesAggExpr,
  mapObjectKeyToUrl,
  mapUserImageToUrl,
} from "./shared"

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
      code: "NOT_FOUND",
      message: "Collection not found",
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
        assetCount:
          sql<number>`count(distinct ${collectionAsset.assetId})`.mapWith(
            Number,
          ),
        postCount:
          sql<number>`count(distinct ${collectionPost.postId})`.mapWith(Number),
      })
      .from(collection)
      .leftJoin(
        collectionAsset,
        eq(collection.id, collectionAsset.collectionId),
      )
      .leftJoin(collectionPost, eq(collection.id, collectionPost.collectionId))
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
          code: "NOT_FOUND",
          message: "Collection not found",
        })
      }

      const likeCountExpr = createDistinctLikeUserCountExpr()

      const assets = await ctx.db
        .select({
          id: asset.id,
          title: asset.title,
          objectKey: asset.objectKey,
          width: asset.width,
          height: asset.height,
          createdAt: asset.createdAt,
          addedAt: collectionAsset.addedAt,
          user: {
            id: user.id,
            name: user.name,
            image: user.image,
          },
          likeCount: likeCountExpr,
          tags: createTagNamesAggExpr(),
          likedByMe: sql<boolean>`exists(
            select 1 from ${assetLike}
            where ${assetLike.assetId} = ${asset.id}
            and ${assetLike.userId} = ${ctx.user.id}
          )`,
        })
        .from(collectionAsset)
        .innerJoin(asset, eq(collectionAsset.assetId, asset.id))
        .innerJoin(user, eq(asset.userId, user.id))
        .leftJoin(assetLike, eq(asset.id, assetLike.assetId))
        .leftJoin(assetTagLink, eq(asset.id, assetTagLink.assetId))
        .leftJoin(assetTag, eq(assetTagLink.tagId, assetTag.id))
        .where(eq(collectionAsset.collectionId, input.collectionId))
        .groupBy(asset.id, user.id, collectionAsset.addedAt)
        .orderBy(desc(collectionAsset.addedAt))

      const posts = await ctx.db
        .select({
          id: post.id,
          title: post.title,
          excerpt: post.excerpt,
          coverImageUrl: post.coverImageUrl,
          readingTime: post.readingTime,
          viewCount: post.viewCount,
          publishedAt: post.publishedAt,
          addedAt: collectionPost.addedAt,
          likeCount: sql<number>`(
            select count(*) from ${postLike}
            where ${postLike.postId} = ${post.id}
          )`.mapWith(Number),
          bookmarkCount: sql<number>`(
            select count(*) from ${postBookmark}
            where ${postBookmark.postId} = ${post.id}
          )`.mapWith(Number),
        })
        .from(collectionPost)
        .innerJoin(post, eq(collectionPost.postId, post.id))
        .where(eq(collectionPost.collectionId, input.collectionId))
        .orderBy(desc(collectionPost.addedAt))

      const postTags =
        posts.length > 0
          ? await ctx.db
              .select({
                postId: postTagLink.postId,
                id: postTag.id,
                name: postTag.name,
                slug: postTag.slug,
              })
              .from(postTagLink)
              .innerJoin(postTag, eq(postTagLink.tagId, postTag.id))
              .where(
                inArray(
                  postTagLink.postId,
                  posts.map((item) => item.id),
                ),
              )
          : []

      const tagsByPost = new Map<
        string,
        Array<{ id: string; name: string; slug: string }>
      >()

      for (const tag of postTags) {
        const tags = tagsByPost.get(tag.postId) ?? []
        tags.push({ id: tag.id, name: tag.name, slug: tag.slug })
        tagsByPost.set(tag.postId, tags)
      }

      return {
        ...collectionInfo,
        assets: assets.map((item) => ({
          ...mapObjectKeyToUrl(item),
          user: mapUserImageToUrl(item.user),
        })),
        posts: posts.map((item) => ({
          ...item,
          tags: tagsByPost.get(item.id) ?? [],
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
            message: "At least one field must be updated",
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
          code: "NOT_FOUND",
          message: "Collection not found",
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
          code: "NOT_FOUND",
          message: "Collection not found",
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
        .select({ assetId: collectionAsset.assetId })
        .from(collectionAsset)
        .where(
          and(
            eq(collectionAsset.collectionId, input.collectionId),
            eq(collectionAsset.assetId, input.assetId),
          ),
        )
        .limit(1)

      const included = existingItem.length === 0

      if (included) {
        await ctx.db.insert(collectionAsset).values({
          collectionId: input.collectionId,
          assetId: input.assetId,
        })
      } else {
        await ctx.db
          .delete(collectionAsset)
          .where(
            and(
              eq(collectionAsset.collectionId, input.collectionId),
              eq(collectionAsset.assetId, input.assetId),
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
  togglePost: protectedProcedure
    .input(
      z.object({
        collectionId: z.string().trim().min(1),
        postId: z.string().trim().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertCollectionOwner({
        db: ctx.db,
        userId: ctx.user.id,
        collectionId: input.collectionId,
      })

      const existingPost = await ctx.db
        .select({ postId: collectionPost.postId })
        .from(collectionPost)
        .where(
          and(
            eq(collectionPost.collectionId, input.collectionId),
            eq(collectionPost.postId, input.postId),
          ),
        )
        .limit(1)

      const included = existingPost.length === 0

      if (included) {
        await ctx.db.insert(collectionPost).values({
          collectionId: input.collectionId,
          postId: input.postId,
        })
      } else {
        await ctx.db
          .delete(collectionPost)
          .where(
            and(
              eq(collectionPost.collectionId, input.collectionId),
              eq(collectionPost.postId, input.postId),
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
            select count(*) from ${collectionAsset}
            where ${collectionAsset.collectionId} = ${collection.id}
          )`.mapWith(Number),
          included: sql<boolean>`exists(
            select 1 from ${collectionAsset}
            where ${collectionAsset.collectionId} = ${collection.id}
            and ${collectionAsset.assetId} = ${input.assetId}
          )`,
        })
        .from(collection)
        .where(eq(collection.userId, ctx.user.id))
        .orderBy(desc(collection.updatedAt), desc(collection.createdAt))
    }),
  listForPost: protectedProcedure
    .input(
      z.object({
        postId: z.string().trim().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db
        .select({
          id: collection.id,
          name: collection.name,
          description: collection.description,
          updatedAt: collection.updatedAt,
          postCount: sql<number>`(
            select count(*) from ${collectionPost}
            where ${collectionPost.collectionId} = ${collection.id}
          )`.mapWith(Number),
          included: sql<boolean>`exists(
            select 1 from ${collectionPost}
            where ${collectionPost.collectionId} = ${collection.id}
            and ${collectionPost.postId} = ${input.postId}
          )`,
        })
        .from(collection)
        .where(eq(collection.userId, ctx.user.id))
        .orderBy(desc(collection.updatedAt), desc(collection.createdAt))
    }),
})
