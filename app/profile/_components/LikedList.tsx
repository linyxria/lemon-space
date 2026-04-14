import { desc, eq } from 'drizzle-orm'

import MasonryLayout from '@/components/MasonryLayout'
import { db } from '@/db'
import { hydrateAssets } from '@/db/queries/assets'
import { likes } from '@/db/schema'

import TabsEmpty from './TabsEmpty'

export default async function LikedList({ userId }: { userId: string }) {
  const likesData = await db.query.likes.findMany({
    where: eq(likes.userId, userId),
    orderBy: [desc(likes.createdAt)],
    with: { asset: { with: { tags: { with: { tag: true } } } } },
  })

  if (likesData.length === 0) {
    return (
      <TabsEmpty
        title="暂无喜爱的资源"
        description="浏览首页并保存你喜欢的灵感。"
      />
    )
  }

  const items = await hydrateAssets(
    likesData.map((like) => ({ ...like.asset })),
    null,
    true,
  )

  return <MasonryLayout items={items} />
}
