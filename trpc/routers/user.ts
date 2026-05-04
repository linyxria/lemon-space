import { TRPCError } from '@trpc/server'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'

import {
  asset,
  assetLike,
  collection,
  post,
  postLike,
  user,
  userPreference,
} from '@/db/schema'

import { protectedProcedure, router } from '../init'
import { mapObjectKeyToUrl, mapUserImageToUrl } from './shared'

const preferenceInputSchema = z.object({
  locale: z.enum(['zh-CN', 'en-US']).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
})

const defaultPreferences = {
  locale: 'zh-CN' as const,
  theme: 'system' as const,
}

export const userRouter = router({
  info: protectedProcedure.query(({ ctx }) => {
    return mapUserImageToUrl(ctx.user)
  }),
  avatarUpdate: protectedProcedure
    .input(
      z.object({
        objectKey: z.string().trim().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const [updatedUser] = await ctx.db
          .update(user)
          .set({ image: input.objectKey })
          .where(eq(user.id, ctx.user.id))
          .returning({
            image: user.image,
          })

        return updatedUser
      } catch (error) {
        if (error instanceof TRPCError) throw error

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update avatar',
        })
      }
    }),
  stats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id

    const [
      assetCount,
      assetLikeCount,
      postCount,
      postLikeCount,
      collectionCount,
      totalReceivedLikes,
    ] = await Promise.all([
      ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(asset)
        .where(eq(asset.userId, userId))
        .then((res) => Number(res[0].count)),

      ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(assetLike)
        .where(eq(assetLike.userId, userId))
        .then((res) => Number(res[0].count)),

      ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(post)
        .where(eq(post.authorId, userId))
        .then((res) => Number(res[0].count)),

      ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(postLike)
        .where(eq(postLike.userId, userId))
        .then((res) => Number(res[0].count)),

      ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(collection)
        .where(eq(collection.userId, userId))
        .then((res) => Number(res[0].count)),

      ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(assetLike)
        .innerJoin(asset, eq(assetLike.assetId, asset.id))
        .where(eq(asset.userId, userId))
        .then((res) => Number(res[0].count)),
    ])

    return {
      myCount: assetCount,
      likeCount: assetLikeCount + postLikeCount,
      assetCount,
      assetLikeCount,
      postCount,
      postLikeCount,
      collectionCount,
      totalReceivedLikes,
    }
  }),
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    const [stats, recentUploads] = await Promise.all([
      ctx.db
        .select({
          myCount: sql<number>`count(distinct ${asset.id})`.mapWith(Number),
          totalReceivedLikes: sql<number>`count(${assetLike.assetId})`.mapWith(
            Number,
          ),
        })
        .from(asset)
        .leftJoin(assetLike, eq(assetLike.assetId, asset.id))
        .where(eq(asset.userId, ctx.user.id))
        .then((res) => ({
          myCount: res[0]?.myCount ?? 0,
          totalReceivedLikes: res[0]?.totalReceivedLikes ?? 0,
        })),
      ctx.db
        .select({
          id: asset.id,
          title: asset.title,
          objectKey: asset.objectKey,
        })
        .from(asset)
        .where(eq(asset.userId, ctx.user.id))
        .orderBy(sql`${asset.createdAt} desc`)
        .limit(4),
    ])

    return {
      ...stats,
      recentUploads: recentUploads.map((item) => mapObjectKeyToUrl(item)),
    }
  }),
  preferences: protectedProcedure.query(async ({ ctx }) => {
    const [preferences] = await ctx.db
      .select({
        locale: userPreference.locale,
        theme: userPreference.theme,
      })
      .from(userPreference)
      .where(eq(userPreference.userId, ctx.user.id))
      .limit(1)

    if (!preferences) return defaultPreferences

    return {
      locale:
        preferences.locale === 'en-US' || preferences.locale === 'zh-CN'
          ? preferences.locale
          : defaultPreferences.locale,
      theme:
        preferences.theme === 'light' ||
        preferences.theme === 'dark' ||
        preferences.theme === 'system'
          ? preferences.theme
          : defaultPreferences.theme,
    }
  }),
  updatePreferences: protectedProcedure
    .input(
      preferenceInputSchema.refine((value) => Object.keys(value).length > 0, {
        message: 'At least one preference must be provided',
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existingPreferences] = await ctx.db
        .select({
          locale: userPreference.locale,
          theme: userPreference.theme,
        })
        .from(userPreference)
        .where(eq(userPreference.userId, ctx.user.id))
        .limit(1)

      const nextPreferences = {
        locale:
          input.locale ??
          (existingPreferences?.locale === 'en-US' ||
          existingPreferences?.locale === 'zh-CN'
            ? existingPreferences.locale
            : defaultPreferences.locale),
        theme:
          input.theme ??
          (existingPreferences?.theme === 'light' ||
          existingPreferences?.theme === 'dark' ||
          existingPreferences?.theme === 'system'
            ? existingPreferences.theme
            : defaultPreferences.theme),
      } as const

      const [upsertedPreferences] = await ctx.db
        .insert(userPreference)
        .values({
          userId: ctx.user.id,
          ...nextPreferences,
        })
        .onConflictDoUpdate({
          target: userPreference.userId,
          set: {
            ...nextPreferences,
            updatedAt: new Date(),
          },
        })
        .returning({
          locale: userPreference.locale,
          theme: userPreference.theme,
        })

      return {
        locale:
          upsertedPreferences.locale === 'en-US' ||
          upsertedPreferences.locale === 'zh-CN'
            ? upsertedPreferences.locale
            : defaultPreferences.locale,
        theme:
          upsertedPreferences.theme === 'light' ||
          upsertedPreferences.theme === 'dark' ||
          upsertedPreferences.theme === 'system'
            ? upsertedPreferences.theme
            : defaultPreferences.theme,
      }
    }),
})
