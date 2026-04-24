import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'

import { db } from '@/db'
import { auth } from '@/lib/auth'

/**
 * This context creator accepts `headers` so it can be reused in both
 * the RSC server caller (where you pass `next/headers`) and the
 * API route handler (where you pass the request headers).
 */
export const createTRPCContext = async ({ headers }: { headers: Headers }) => {
  const session = await auth.api.getSession({ headers })
  return {
    db,
    session,
  }
}
// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC
  .context<Awaited<ReturnType<typeof createTRPCContext>>>()
  .create({
    /**
     * @see https://trpc.io/docs/server/data-transformers
     */
    transformer: superjson,
  })

// 1. 创建一个中间件
const isAuthed = t.middleware(({ next, ctx }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  const { user } = ctx.session

  return next({
    ctx: {
      user,
    },
  })
})

export const router = t.router
export const procedure = t.procedure
export const createCallerFactory = t.createCallerFactory
export const protectedProcedure = t.procedure.use(isAuthed)
