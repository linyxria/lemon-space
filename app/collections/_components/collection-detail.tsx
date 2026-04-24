'use client'

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import ImageCard from '@/components/image-card'
import { MasonryGrid } from '@/components/masonry-grid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useTRPC } from '@/trpc/client'

export function CollectionDetail({ collectionId }: { collectionId: string }) {
  const trpc = useTRPC()
  const t = useTranslations('Collections')
  const tPreferences = useTranslations('Preferences')
  const queryClient = useQueryClient()
  const { data } = useSuspenseQuery(
    trpc.collection.detail.queryOptions({ collectionId }),
  )
  const [name, setName] = useState(data.name)
  const [description, setDescription] = useState(data.description ?? '')

  useEffect(() => {
    setName(data.name)
    setDescription(data.description ?? '')
  }, [data.description, data.name])

  const updateMutation = useMutation(
    trpc.collection.update.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.collection.detail.queryKey({ collectionId }),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.collection.list.queryKey(),
          }),
        ])
        toast.success(tPreferences('saved'))
      },
    }),
  )

  const toggleAssetMutation = useMutation(
    trpc.collection.toggleAsset.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.collection.detail.queryKey({ collectionId }),
        })
      },
    }),
  )

  const handleUpdate = () => {
    const trimmedName = name.trim()
    if (!trimmedName) return

    updateMutation.mutate({
      collectionId,
      name: trimmedName,
      description,
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/collections" />}
        >
          <ArrowLeft className="size-4" />
          {t('back')}
        </Button>
      </div>

      <section className="rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-sm">
        <h1 className="text-3xl font-black tracking-tight text-zinc-900">
          {data.name}
        </h1>
        {data.description ? (
          <p className="mt-2 text-sm text-zinc-500">{data.description}</p>
        ) : null}

        <div className="mt-4 grid gap-3">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t('descriptionPlaceholder')}
          />
          <div className="flex justify-end">
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {t('update')}
            </Button>
          </div>
        </div>
      </section>

      {data.assets.length > 0 ? (
        <MasonryGrid
          items={data.assets}
          renderItem={(item, index) => (
            <div className="space-y-2">
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={toggleAssetMutation.isPending}
                  onClick={() =>
                    toggleAssetMutation.mutate({
                      collectionId,
                      assetId: item.id,
                    })
                  }
                >
                  <Trash2 className="size-3.5" />
                  {t('remove')}
                </Button>
              </div>
              <ImageCard {...item} priority={index < 6} />
            </div>
          )}
        />
      ) : (
        <p className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-500">
          {t('empty')}
        </p>
      )}
    </div>
  )
}
