import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/db'
import { user } from '@/db/schema'
import { getSession } from '@/lib/auth'

interface UpdateAvatarRequest {
  objectKey: string
}

export async function PATCH(request: Request) {
  const session = await getSession()

  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  try {
    const { objectKey }: UpdateAvatarRequest = await request.json()

    if (!objectKey) {
      return NextResponse.json({ error: 'Missing objectKey' }, { status: 400 })
    }

    const [updatedUser] = await db
      .update(user)
      .set({ image: objectKey })
      .where(eq(user.id, session.user.id))
      .returning({
        image: user.image,
      })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Failed to update avatar:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}
