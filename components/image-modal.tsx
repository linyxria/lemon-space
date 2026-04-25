'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Copy, Download, ExternalLink, X } from 'lucide-react'
import { motion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'

import { authClient } from '@/lib/auth-client'
import { useTRPC } from '@/trpc/client'

import { useGallery } from './gallery-provider'
import { Badge } from './ui/badge'
import { Button } from './ui/button'

export interface ModalAssetData {
  id: string
  title: string
  url: string
  width?: number
  height?: number
  tags?: string[]
}

interface ImageModalProps {
  asset: ModalAssetData | null
  onClose: () => void
}

export default function ImageModal({ asset, onClose }: ImageModalProps) {
  const [copied, setCopied] = useState(false)
  const trpc = useTRPC()
  const gallery = useGallery()
  const queryClient = useQueryClient()
  const { data: session } = authClient.useSession()
  const t = useTranslations('ImageModal')

  const { data: relatedAssets } = useQuery(
    trpc.asset.related.queryOptions(
      { assetId: asset?.id ?? '', limit: 6 },
      {
        enabled: Boolean(asset?.id),
      },
    ),
  )

  const { data: collectionsForAsset } = useQuery(
    trpc.collection.listForAsset.queryOptions(
      { assetId: asset?.id ?? '' },
      {
        enabled: Boolean(asset?.id && session?.user),
      },
    ),
  )

  const toggleCollectionMutation = useMutation(
    trpc.collection.toggleAsset.mutationOptions({
      onSuccess: async () => {
        if (!asset) return

        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.collection.listForAsset.queryKey({
              assetId: asset.id,
            }),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.collection.list.queryKey(),
          }),
        ])
      },
    }),
  )

  if (!asset) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(asset.url)
      setCopied(true)
      toast.success(t('copied'))
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      toast.error(t('copyFailed'))
    }
  }

  const handleToggleCollection = (collectionId: string) => {
    toggleCollectionMutation.mutate({
      collectionId,
      assetId: asset.id,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-120 flex items-center justify-center p-3 sm:p-6 md:p-8"
    >
      {/* 1. 背景 */}
      <div
        onClick={onClose}
        className="bg-background/75 absolute inset-0 antialiased backdrop-blur-3xl"
      />

      {/* 2. 弹窗主体 */}
      <div className="bg-card relative z-10 h-[calc(100dvh-1.5rem)] w-full max-w-[1380px] overflow-hidden rounded-3xl shadow-[0_32px_64px_-24px_rgba(0,0,0,0.3)] sm:h-[calc(100dvh-3rem)] md:max-h-[92vh]">
        {/* 3. 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-80 rounded-full bg-black/40 p-3 text-white shadow-lg backdrop-blur-md transition-all hover:bg-black/60 active:scale-90"
        >
          <X size={22} strokeWidth={2.5} />
        </button>

        <div className="grid h-full grid-rows-[auto_1fr] md:grid-cols-[minmax(0,1.25fr)_minmax(22rem,0.75fr)] md:grid-rows-1">
          {/* 4. 图片展示区：桌面双栏左侧主视觉 */}
          <div className="bg-hero relative h-[40dvh] min-h-[15rem] overflow-hidden md:h-full md:min-h-0">
            {/* 底层氛围模糊图 */}
            <Image
              src={asset.url}
              alt="blur-bg"
              fill
              className="scale-125 object-cover opacity-40 blur-3xl"
              aria-hidden="true"
              sizes="(max-width: 768px) 100vw, 68vw"
            />

            {/* 主图：使用自然宽高，最大化可视区域 */}
            <div className="relative z-10 flex h-full w-full items-center justify-center p-3 sm:p-5 md:p-8">
              <Image
                src={asset.url}
                alt={asset.title}
                width={asset.width ?? 1600}
                height={asset.height ?? 900}
                priority
                className="h-auto max-h-full w-auto max-w-full rounded-xl object-contain shadow-[0_20px_50px_-26px_rgba(0,0,0,0.65)]"
                sizes="(max-width: 768px) 100vw, 68vw"
              />
            </div>
          </div>

          {/* 5. 右侧信息栏 */}
          <div className="bg-card relative min-h-0 overflow-y-auto border-t p-4 pb-20 md:border-t-0 md:border-l md:p-6 md:pb-8">
            <div className="flex flex-col gap-6">
              <div className="space-y-1.5">
                <h3 className="text-card-foreground max-w-70 truncate text-xl leading-tight font-black tracking-tight sm:max-w-md md:text-2xl">
                  {asset.title}
                </h3>
                {asset.tags && asset.tags.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {asset.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="rounded-full px-2.5"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : null}
                <div className="text-muted-foreground flex items-center gap-2 font-mono text-[9px] font-bold tracking-widest uppercase">
                  <span>ID: {asset.id.slice(-8)}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" onClick={handleCopy}>
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  {copied ? t('copied') : t('copyLink')}
                </Button>
                <Button
                  variant="secondary"
                  nativeButton={false}
                  render={
                    <a
                      href={asset.url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  <Download size={18} />
                  {t('download')}
                </Button>
                <Button
                  nativeButton={false}
                  render={
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('viewOriginal')}
                      <ExternalLink size={20} />
                    </a>
                  }
                />
              </div>

              {session?.user ? (
                <div className="bg-muted/60 rounded-2xl border p-3">
                  <p className="text-muted-foreground mb-2 text-xs font-bold tracking-[0.12em] uppercase">
                    {t('saveToCollection')}
                  </p>
                  {collectionsForAsset && collectionsForAsset.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {collectionsForAsset.map((item) => (
                        <Button
                          key={item.id}
                          variant={item.included ? 'default' : 'outline'}
                          size="sm"
                          disabled={toggleCollectionMutation.isPending}
                          onClick={() => handleToggleCollection(item.id)}
                        >
                          {item.name}
                          <span className="text-xs opacity-70">
                            ({item.assetCount})
                          </span>
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <p className="text-muted-foreground text-sm">
                        {t('noCollectionYet')}
                      </p>
                      <Button
                        variant="secondary"
                        size="sm"
                        nativeButton={false}
                        render={<Link href="/collections" onClick={onClose} />}
                      >
                        {t('createCollection')}
                      </Button>
                    </div>
                  )}
                </div>
              ) : null}

              {relatedAssets && relatedAssets.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-muted-foreground text-sm font-black tracking-[0.12em] uppercase">
                      {t('continueExploring')}
                    </h4>
                    <span className="text-muted-foreground text-xs font-medium">
                      {t('sameTagRelated')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-2">
                    {relatedAssets.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          gallery.openAsset({
                            id: item.id,
                            title: item.title,
                            url: item.url,
                            width: item.width,
                            height: item.height,
                            tags: item.tags,
                          })
                        }
                        className="group text-left"
                      >
                        <div className="bg-muted relative aspect-[4/5] overflow-hidden rounded-2xl">
                          <Image
                            src={item.url}
                            alt={item.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 768px) 42vw, (max-width: 1024px) 24vw, 16vw"
                          />
                        </div>
                        <p className="text-card-foreground mt-2 truncate text-xs font-semibold">
                          {item.title}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
