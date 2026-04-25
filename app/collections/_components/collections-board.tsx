'use client'

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { BookMarked, FolderPlus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useTRPC } from '@/trpc/client'

export function CollectionsBoard() {
  const trpc = useTRPC()
  const t = useTranslations('Collections')
  const tPreferences = useTranslations('Preferences')
  const locale = useLocale()
  const queryClient = useQueryClient()
  const { data: collections } = useSuspenseQuery(
    trpc.collection.list.queryOptions(),
  )
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const createMutation = useMutation(
    trpc.collection.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.collection.list.queryKey(),
        })
        setName('')
        setDescription('')
        toast.success(tPreferences('saved'))
      },
    }),
  )

  const deleteMutation = useMutation(
    trpc.collection.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.collection.list.queryKey(),
        })
        toast.success(tPreferences('saved'))
      },
    }),
  )

  const handleCreate = () => {
    const trimmedName = name.trim()
    if (!trimmedName) return

    createMutation.mutate({
      name: trimmedName,
      description: description.trim() || undefined,
    })
  }

  return (
    <div className="space-y-5">
      <section className="from-hero via-hero to-primary/35 text-hero-foreground rounded-[28px] border bg-linear-to-r px-6 py-6">
        <p className="text-primary text-[11px] font-semibold tracking-[0.28em] uppercase">
          {t('title')}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
          {t('title')}
        </h1>
        <p className="text-hero-muted mt-2 max-w-2xl text-sm">
          {t('description')}
        </p>
      </section>

      <section className="bg-card rounded-[28px] border p-5 shadow-sm">
        <h2 className="text-foreground mb-3 flex items-center gap-2 text-lg font-black">
          <FolderPlus className="size-4" />
          {t('createTitle')}
        </h2>
        <div className="grid gap-3">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t('namePlaceholder')}
          />
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t('descriptionPlaceholder')}
          />
          <div className="flex justify-end">
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending || name.trim().length === 0}
            >
              {t('createButton')}
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {collections.length > 0 ? (
          collections.map((item) => (
            <article
              key={item.id}
              className="bg-card rounded-3xl border p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-foreground truncate text-lg font-black">
                    {item.name}
                  </h3>
                  {item.description ? (
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                      {item.description}
                    </p>
                  ) : null}
                </div>
                <BookMarked className="text-muted-foreground size-4 shrink-0" />
              </div>
              <p className="text-muted-foreground mt-3 text-xs">
                {item.assetCount} {t('assetsCount')}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {t('updated')}:{' '}
                {new Date(item.updatedAt).toLocaleDateString(locale)}
              </p>
              <div className="mt-4 flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  nativeButton={false}
                  render={<Link href={`/collections/${item.id}`} />}
                >
                  {t('open')}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={deleteMutation.isPending}
                  onClick={() =>
                    deleteMutation.mutate({ collectionId: item.id })
                  }
                >
                  <Trash2 className="size-3.5" />
                  {t('delete')}
                </Button>
              </div>
            </article>
          ))
        ) : (
          <p className="bg-muted/50 text-muted-foreground rounded-3xl border border-dashed p-6 text-sm">
            {t('empty')}
          </p>
        )}
      </section>
    </div>
  )
}
