import { TRPCError } from '@trpc/server'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'

import { asset, like, user } from '@/db/schema'
import { objectKey2Url } from '@/lib/utils'

import { protectedProcedure, router } from '../init'

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

    const [myCount, likeCount] = await Promise.all([
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
    ])

    return {
      myCount,
      likeCount,
    }
  }),
})
