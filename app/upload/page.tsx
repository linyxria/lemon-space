'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { nanoid } from 'nanoid'
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
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const createBatchMutation = useMutation(
    trpc.asset.createBatch.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: trpc.asset.list.queryKey() }),
          queryClient.invalidateQueries({
            queryKey: trpc.asset.listByMe.queryKey(),
          }),
          queryClient.invalidateQueries({ queryKey: trpc.asset.tags.queryKey() }),
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
      setStatus('开始上传...')

      // 初始化所有文件的进度
      fileProgressRef.current = {}
      files.forEach((_, i) => (fileProgressRef.current[i] = 0))

      const totalFiles = files.length

      const uploadTasks = files.map(async ({ origin: file }, index) => {
        // 1. 上传文件到云端 (R2)
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
      setStatus(`正在批量入库 (${totalFiles} 件作品)`)
      await createBatchMutation.mutateAsync({
        assets,
        tags: formValues.tags,
      })

      setProgress(100)
      setStatus('入库成功！')

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
      setStatus('上传过程中出现异常')
      setUploading(false)
    }
  }

  return (
    <Card className="relative left-1/2 max-w-3xl -translate-x-1/2 md:top-4">
      <CardHeader>
        <CardTitle>上传你的作品</CardTitle>
        <CardDescription>请不要上传血腥、色情、暴力等违规内容</CardDescription>
        <CardAction>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Badge variant="secondary">{files.length} 件作品待上传</Badge>
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
            const seen = new Set(files.map(({ origin }) => getFileFingerprint(origin)))
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
            setSelectionMessage(skipped > 0 ? `已跳过 ${skipped} 个重复文件` : '')
            setStatus('')
          }}
        />

        {selectionMessage ? (
          <p className="text-xs font-medium text-zinc-500">{selectionMessage}</p>
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
            <MetadataForm formValues={formValues} onChange={setFormValues} />
          </>
        )}

        {/* 进度条展示 */}
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
          清空
        </Button>
        <Button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          className="flex w-full items-center gap-2"
        >
          {uploading ? (
            <>
              <Spinner />
              正在处理...
            </>
          ) : (
            '开始上传'
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
