'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Sparkles, Tags } from 'lucide-react'
import { nanoid } from 'nanoid'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { uploadFile } from '@/lib/s3'
import { getImageDimensions } from '@/lib/utils'
import { useTRPC } from '@/trpc/client'

import MetadataForm, { type MetadataValues } from './_components/metadata-form'
import type { PreviewFile } from './_components/preview-list'
import PreviewList from './_components/preview-list'
import UploadArea from './_components/upload-area'

function getFileFingerprint(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function UploadPage() {
  const t = useTranslations('UploadPage')
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const createBatchMutation = useMutation(
    trpc.asset.createBatch.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.asset.list.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.asset.listByMe.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.asset.tags.queryKey(),
          }),
        ])
      },
    }),
  )

  const [files, setFiles] = useState<PreviewFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [selectionMessage, setSelectionMessage] = useState('')
  const [formValues, setFormValues] = useState<MetadataValues>({
    title: '',
    tags: [],
  })

  // 使用 useRef 存储每个文件的实时进度，避免频繁触发渲染时的闭包问题
  const fileProgressRef = useRef<Record<number, number>>({})
  const totalSize = files.reduce((sum, file) => sum + file.origin.size, 0)

  const handleUpload = async () => {
    if (files.length === 0) return

    try {
      setUploading(true)
      setProgress(0)
      setStatus(t('started'))

      // 初始化所有文件的进度
      fileProgressRef.current = {}
      files.forEach((_, i) => (fileProgressRef.current[i] = 0))

      const totalFiles = files.length

      const uploadTasks = files.map(async ({ origin: file }, index) => {
        // 1. 上传文件到云端
        const { objectKey } = await uploadFile('assets', file, {
          onProgress: (percent) => {
            // 更新当前文件的进度
            fileProgressRef.current[index] = percent

            // 计算全局平均进度
            const sum = Object.values(fileProgressRef.current).reduce(
              (a, b) => a + b,
              0,
            )
            const globalProgress = Math.round(sum / totalFiles)

            // 留 1% 给最后的数据库同步状态
            setProgress(Math.min(globalProgress, 99))
          },
        })

        // 2. 准备元数据
        const [dimensions] = await Promise.all([getImageDimensions(file)])

        const finalTitle = formValues.title
          ? totalFiles > 1
            ? `${formValues.title} - ${(index + 1).toString().padStart(2, '0')}`
            : formValues.title
          : file.name.split('.')[0]

        fileProgressRef.current[index] = 100

        return {
          title: finalTitle,
          objectKey,
          width: dimensions.width,
          height: dimensions.height,
        }
      })

      const assets = await Promise.all(uploadTasks)

      setProgress(99)
      setStatus(t('syncing', { count: totalFiles }))
      await createBatchMutation.mutateAsync({
        assets,
        tags: formValues.tags,
      })

      setProgress(100)
      setStatus(t('success'))

      setTimeout(() => {
        setUploading(false)
        setFiles([])
        setProgress(0)
        setStatus('')
        setSelectionMessage('')
        setFormValues({ title: '', tags: [] })
      }, 2000)
    } catch (err) {
      console.error(err)
      setStatus(t('error'))
      setUploading(false)
    }
  }

  return (
    <div className="space-y-5">
      <section className="from-hero via-hero to-primary/35 text-hero-foreground rounded-[30px] border bg-linear-to-r px-5 py-5 shadow-[0_24px_60px_-30px_rgba(24,24,27,0.65)] sm:px-6 sm:py-6">
        <p className="text-primary text-[11px] font-semibold tracking-[0.28em] uppercase">
          {t('heroBadge')}
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              {t('title')}
            </h1>
            <p className="text-hero-muted mt-2 max-w-3xl text-sm">
              {t('description')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {t('pendingCount', { count: files.length })}
            </Badge>
            {files.length > 0 ? (
              <Badge variant="outline">{formatBytes(totalSize)}</Badge>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <Card className="relative w-full rounded-[28px] shadow-[0_24px_60px_-38px_rgba(24,24,27,0.35)]">
          <CardHeader>
            <CardTitle>{t('cardTitle')}</CardTitle>
            <CardDescription>{t('cardDescription')}</CardDescription>
            <CardAction>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Badge variant="secondary">
                  {t('pendingCount', { count: files.length })}
                </Badge>
                {files.length > 0 ? (
                  <Badge variant="outline">{formatBytes(totalSize)}</Badge>
                ) : null}
              </div>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-6">
            <UploadArea
              uploading={uploading}
              onDrop={(acceptedFiles) => {
                if (!acceptedFiles) return
                const seen = new Set(
                  files.map(({ origin }) => getFileFingerprint(origin)),
                )
                const nextFiles: PreviewFile[] = []
                let skipped = 0

                acceptedFiles.forEach((file) => {
                  const fingerprint = getFileFingerprint(file)
                  if (seen.has(fingerprint)) {
                    skipped += 1
                    return
                  }

                  seen.add(fingerprint)
                  nextFiles.push({
                    origin: file,
                    id: nanoid(),
                    preview: URL.createObjectURL(file),
                  })
                })

                setFiles((prev) => [...prev, ...nextFiles])
                setSelectionMessage(
                  skipped > 0 ? t('duplicateSkipped', { count: skipped }) : '',
                )
                setStatus('')
              }}
            />

            {selectionMessage ? (
              <p className="text-muted-foreground text-xs font-medium">
                {selectionMessage}
              </p>
            ) : null}

            {files.length > 0 && (
              <>
                <PreviewList
                  files={files}
                  uploading={uploading}
                  onRemove={(id) =>
                    setFiles((prev) => prev.filter((file) => file.id !== id))
                  }
                />
                <MetadataForm
                  formValues={formValues}
                  onChange={setFormValues}
                />
              </>
            )}

            {uploading && (
              <Field>
                <FieldLabel htmlFor="progress-upload">
                  <span className="text-muted-foreground animate-pulse text-xs font-medium">
                    {status}
                  </span>
                  <span className="text-primary ml-auto font-mono text-xs font-bold">
                    {progress}%
                  </span>
                </FieldLabel>
                <Progress value={progress} id="progress-upload" />
              </Field>
            )}
          </CardContent>
          <CardFooter className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setFiles([])
                setSelectionMessage('')
                setStatus('')
              }}
              disabled={files.length === 0 || uploading}
              className="min-w-24"
            >
              {t('reset')}
            </Button>
            <Button
              onClick={handleUpload}
              disabled={files.length === 0 || uploading}
              className="flex flex-1 items-center gap-2"
            >
              {uploading ? (
                <>
                  <Spinner />
                  {t('processing')}
                </>
              ) : (
                t('startUpload')
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card className="from-card to-primary/10 rounded-[28px] bg-linear-to-b shadow-[0_20px_55px_-38px_rgba(24,24,27,0.35)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="text-primary size-4" />
              {t('tipsTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-3 text-sm">
            <p className="flex items-start gap-2">
              <Check className="text-primary mt-0.5 size-4" />
              {t('tip1')}
            </p>
            <p className="flex items-start gap-2">
              <Check className="text-primary mt-0.5 size-4" />
              {t('tip2')}
            </p>
            <p className="flex items-start gap-2">
              <Check className="text-primary mt-0.5 size-4" />
              {t('tip3')}
            </p>
          </CardContent>
          <CardFooter className="justify-start gap-2">
            <Badge variant="outline" className="rounded-full px-2.5">
              <Tags className="size-3.5" />
              {t('formats')}
            </Badge>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
