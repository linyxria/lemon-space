'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { db } from '@/db'
import { like } from '@/db/schema'
import { getSession } from '@/lib/auth'

export async function toggleLike(assetId: string) {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  const userId = session.user.id

  const existing = await db
    .select()
    .from(like)
    .where(and(eq(like.userId, userId), eq(like.assetId, assetId)))

  if (existing.length > 0) {
    await db
      .delete(like)
      .where(and(eq(like.userId, userId), eq(like.assetId, assetId)))
  } else {
    await db.insert(like).values({ userId, assetId })
  }

  // 关键：通知 Next.js 刷新数据缓存
  revalidatePath('/')
  revalidatePath('/profile')
}
