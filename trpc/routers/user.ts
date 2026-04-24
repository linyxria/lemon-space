import { TRPCError } from '@trpc/server'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'

import { asset, like, user, userPreference } from '@/db/schema'
import { objectKey2Url } from '@/lib/utils'

import { protectedProcedure, router } from '../init'

const preferenceInputSchema = z.object({
  locale: z.enum(['zh-CN', 'en-US']).optional(),
  showCardTags: z.boolean().optional(),
  defaultSort: z.enum(['latest', 'popular']).optional(),
})

const defaultPreferences = {
  locale: 'zh-CN' as const,
  showCardTags: true,
  defaultSort: 'latest' as const,
}

export const userRouter = router({
  info: protectedProcedure.query(({ ctx }) => {
    const { image, ...user } = ctx.user
    return {
      ...user,
      image: image ? objectKey2Url(image) : null,
    }
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

    const [myCount, likeCount, totalReceivedLikes] = await Promise.all([
      ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(asset)
        .where(eq(asset.userId, userId))
        .then((res) => Number(res[0].count)),

      ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(like)
        .where(eq(like.userId, userId))
        .then((res) => Number(res[0].count)),

      ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(like)
        .innerJoin(asset, eq(like.assetId, asset.id))
        .where(eq(asset.userId, userId))
        .then((res) => Number(res[0].count)),
    ])

    return {
      myCount,
      likeCount,
      totalReceivedLikes,
    }
  }),
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    const [stats, recentUploads] = await Promise.all([
      ctx.db
        .select({
          myCount: sql<number>`count(distinct ${asset.id})`.mapWith(Number),
          totalReceivedLikes: sql<number>`count(${like.assetId})`.mapWith(
            Number,
          ),
        })
        .from(asset)
        .leftJoin(like, eq(like.assetId, asset.id))
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
      recentUploads: recentUploads.map(({ objectKey, ...item }) => ({
        ...item,
        url: objectKey2Url(objectKey),
      })),
    }
  }),
  preferences: protectedProcedure.query(async ({ ctx }) => {
    const [preferences] = await ctx.db
      .select({
        locale: userPreference.locale,
        showCardTags: userPreference.showCardTags,
        defaultSort: userPreference.defaultSort,
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
      showCardTags: preferences.showCardTags,
      defaultSort:
        preferences.defaultSort === 'popular'
          ? 'popular'
          : defaultPreferences.defaultSort,
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
          showCardTags: userPreference.showCardTags,
          defaultSort: userPreference.defaultSort,
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
        showCardTags:
          input.showCardTags ?? existingPreferences?.showCardTags ?? true,
        defaultSort:
          input.defaultSort ??
          (existingPreferences?.defaultSort === 'popular'
            ? 'popular'
            : defaultPreferences.defaultSort),
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
          showCardTags: userPreference.showCardTags,
          defaultSort: userPreference.defaultSort,
        })

      return {
        locale:
          upsertedPreferences.locale === 'en-US' ||
          upsertedPreferences.locale === 'zh-CN'
            ? upsertedPreferences.locale
            : defaultPreferences.locale,
        showCardTags: upsertedPreferences.showCardTags,
        defaultSort:
          upsertedPreferences.defaultSort === 'popular'
            ? 'popular'
            : defaultPreferences.defaultSort,
      }
    }),
})
