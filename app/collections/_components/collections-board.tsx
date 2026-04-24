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
      <section className="rounded-[28px] border border-zinc-200/70 bg-linear-to-r from-zinc-950 via-zinc-900 to-lime-950/90 px-6 py-6 text-white">
        <p className="text-[11px] font-semibold tracking-[0.28em] text-lime-200/80 uppercase">
          {t('title')}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
          {t('title')}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-300">
          {t('description')}
        </p>
      </section>

      <section className="rounded-[28px] border border-zinc-200/80 bg-white p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-zinc-900">
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
              className="rounded-3xl border border-zinc-200/80 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-black text-zinc-900">
                    {item.name}
                  </h3>
                  {item.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                      {item.description}
                    </p>
                  ) : null}
                </div>
                <BookMarked className="size-4 shrink-0 text-zinc-400" />
              </div>
              <p className="mt-3 text-xs text-zinc-500">
                {item.assetCount} {t('assetsCount')}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
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
          <p className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-500">
            {t('empty')}
          </p>
        )}
      </section>
    </div>
  )
}
