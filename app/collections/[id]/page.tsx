import { Suspense } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'

import { CollectionDetail } from '../_components/collection-detail'

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  prefetch(trpc.collection.detail.queryOptions({ collectionId: id }))

  return (
    <div className="mx-auto w-full max-w-7xl">
      <HydrateClient>
        <Suspense
          fallback={<Skeleton className="h-120 w-full rounded-[28px]" />}
        >
          <CollectionDetail collectionId={id} />
        </Suspense>
      </HydrateClient>
    </div>
  )
}
