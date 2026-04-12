import { desc, eq } from 'drizzle-orm'

import ImageCard from '@/components/ImageCard'
import MasonryLayout from '@/components/MasonryLayout'
import { db } from '@/db'
import { hydrateAssets } from '@/db/queries/assets'
import { likes } from '@/db/schema'

import EmptyState from './EmptyState'

export default async function LikedList({ userId }: { userId: string }) {
  const likesData = await db.query.likes.findMany({
    where: eq(likes.userId, userId),
    orderBy: [desc(likes.createdAt)],
    with: { asset: { with: { tags: { with: { tag: true } } } } },
  })

  if (likesData.length === 0) {
    return (
      <EmptyState
        title="暂无喜爱的资源"
        description="浏览首页并保存你喜欢的灵感。"
      />
    )
  }

  const data = await hydrateAssets(likesData.map((like) => like.asset))

  return (
    <MasonryLayout>
      {data.map((asset, index) => (
        <ImageCard
          key={asset.id}
          index={index}
          asset={asset}
          isLikedInitial={true}
        />
      ))}
    </MasonryLayout>
  )
}
