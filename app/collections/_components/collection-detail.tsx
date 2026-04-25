'use client'

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'

import ImageCard from '@/components/image-card'
import { MasonryGrid } from '@/components/masonry-grid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useTRPC } from '@/trpc/client'

function CollectionEditor({
  initialName,
  initialDescription,
  disabled,
  onSubmit,
  updateLabel,
  descriptionPlaceholder,
}: {
  initialName: string
  initialDescription: string
  disabled: boolean
  onSubmit: (payload: { name: string; description: string }) => void
  updateLabel: string
  descriptionPlaceholder: string
}) {
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription)

  const handleUpdate = () => {
    const trimmedName = name.trim()
    if (!trimmedName) return

    onSubmit({
      name: trimmedName,
      description,
    })
  }

  return (
    <div className="mt-4 grid gap-3">
      <Input value={name} onChange={(event) => setName(event.target.value)} />
      <Textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder={descriptionPlaceholder}
      />
      <div className="flex justify-end">
        <Button onClick={handleUpdate} disabled={disabled}>
          {updateLabel}
        </Button>
      </div>
    </div>
  )
}

export function CollectionDetail({ collectionId }: { collectionId: string }) {
  const trpc = useTRPC()
  const t = useTranslations('Collections')
  const tPreferences = useTranslations('Preferences')
  const queryClient = useQueryClient()
  const { data } = useSuspenseQuery(
    trpc.collection.detail.queryOptions({ collectionId }),
  )

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

      <section className="bg-card rounded-[28px] border p-5 shadow-sm">
        <h1 className="text-foreground text-3xl font-black tracking-tight">
          {data.name}
        </h1>
        {data.description ? (
          <p className="text-muted-foreground mt-2 text-sm">
            {data.description}
          </p>
        ) : null}

        <CollectionEditor
          key={`${data.name}\u0000${data.description ?? ''}`}
          initialName={data.name}
          initialDescription={data.description ?? ''}
          disabled={updateMutation.isPending}
          updateLabel={t('update')}
          descriptionPlaceholder={t('descriptionPlaceholder')}
          onSubmit={({ name, description }) => {
            updateMutation.mutate({
              collectionId,
              name,
              description,
            })
          }}
        />
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
              <ImageCard {...item} loading={index < 2 ? 'eager' : 'lazy'} />
            </div>
          )}
        />
      ) : (
        <p className="bg-muted/50 text-muted-foreground rounded-3xl border border-dashed p-6 text-sm">
          {t('empty')}
        </p>
      )}
    </div>
  )
}
