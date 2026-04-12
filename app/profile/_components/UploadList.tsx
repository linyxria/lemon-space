import { desc, eq } from 'drizzle-orm'

import ImageCard from '@/components/ImageCard'
import MasonryLayout from '@/components/MasonryLayout'
import { db } from '@/db'
import { hydrateAssets } from '@/db/queries/assets'
import { assets } from '@/db/schema'

import EmptyState from './EmptyState' // 建议把 EmptyState 也抽离出来

export default async function UploadList({ userId }: { userId: string }) {
  const assetsData = await db.query.assets.findMany({
    where: eq(assets.userId, userId),
    orderBy: [desc(assets.createdAt)],
    with: { tags: { with: { tag: true } } },
  })

  if (assetsData.length === 0) {
    return (
      <EmptyState
        title="尚未上传资源"
        description="分享你的第一个灵感给社区吧！"
      />
    )
  }

  const data = await hydrateAssets(assetsData, userId)

  return (
    <MasonryLayout>
      {data.map((asset, index) => (
        <ImageCard
          key={asset.id}
          index={index}
          asset={asset}
          isLikedInitial={asset.isLikedByMe}
        />
      ))}
    </MasonryLayout>
  )
}
