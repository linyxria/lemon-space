'use client'

import { useRouter } from '@bprogress/next/app'
import axios from 'axios'
import { Camera, LoaderCircle } from 'lucide-react'
import type { ChangeEvent } from 'react'
import { useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import UserAvatar from '@/components/user-avatar'
import { uploadFileToCloud } from '@/lib/upload-service'

export default function AvatarUploadCard({
  name,
  email,
  image,
}: {
  name: string
  email: string
  image: string | null
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const avatarSrc = previewUrl ?? image

  if (avatarSrc) {
    ReactDOM.preload(avatarSrc, { as: 'image' })
    ReactDOM.preconnect(new URL(avatarSrc).origin)
  }

  const handleSelectFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件')
      event.target.value = ''
      return
    }

    const localPreviewUrl = URL.createObjectURL(file)

    try {
      setUploading(true)
      setPreviewUrl(localPreviewUrl)

      const { objectKey } = await uploadFileToCloud('avatars', file)

      await axios.put('/api/profile/avatar', { objectKey })

      toast.success('头像已更新')
      router.refresh()
    } catch (error) {
      console.error(error)
      setPreviewUrl(null)
      toast.error('头像上传失败，请稍后再试')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  return (
    <section className="relative mb-6 overflow-hidden rounded-[28px] border border-zinc-200/80 bg-linear-to-br from-white via-white to-amber-50/60 shadow-sm md:mb-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-linear-to-b from-amber-100/70 via-lime-50/35 to-transparent md:hidden" />
      <div className="pointer-events-none absolute top-5 left-1/2 size-36 -translate-x-1/2 rounded-full bg-white/70 blur-2xl md:hidden" />

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleSelectFile}
        disabled={uploading}
      />

      <div className="relative flex flex-col gap-6 p-5 sm:p-6 md:flex-row md:items-center md:justify-between md:gap-8 md:p-8">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left md:gap-6">
          <div className="relative flex flex-col items-center md:items-start">
            <div className="absolute inset-4 rounded-full bg-amber-100/45 blur-2xl md:hidden" />
            <div className="relative flex items-center justify-center">
              <UserAvatar
                name={name}
                image={avatarSrc}
                imageProps={{
                  loading: 'eager',
                  fetchPriority: 'high',
                }}
                className="relative size-24 shadow-[0_14px_30px_-20px_rgba(24,24,27,0.35)] sm:size-28 md:size-32 md:shadow-none"
              />
            </div>
            <Button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              size="sm"
              className="mt-3 inline-flex rounded-full border border-white/80 bg-white/92 px-4 text-zinc-900 shadow-lg shadow-zinc-900/10 backdrop-blur sm:hidden"
            >
              {uploading ? (
                <>
                  <LoaderCircle className="size-3.5 animate-spin" />
                  上传中
                </>
              ) : (
                <>
                  <Camera className="size-3.5" />
                  更换头像
                </>
              )}
            </Button>
          </div>

          <div className="flex min-w-0 flex-col items-center text-center sm:items-start sm:text-left">
            <span className="mb-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-medium tracking-[0.14em] text-zinc-500 uppercase shadow-sm md:hidden">
              Profile
            </span>
            <p className="text-xl font-black tracking-tight text-zinc-900 sm:text-2xl">
              {name}
            </p>
            <p className="mt-1 max-w-60 truncate text-sm text-zinc-500 sm:max-w-70 md:max-w-none">
              {email}
            </p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-600">
              上传一张新的头像，让你的个人主页更有辨识度。
            </p>
            <p className="mt-3 text-xs text-zinc-500 sm:hidden">
              支持 JPG、PNG、WebP、GIF 等图片格式
            </p>
          </div>
        </div>

        <div className="hidden w-full flex-col gap-3 border-t border-zinc-200/70 pt-4 sm:pt-5 md:flex md:w-auto md:items-end md:border-t-0 md:pt-0">
          <Button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex w-full items-center justify-center gap-2 md:w-auto"
          >
            {uploading ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                上传中...
              </>
            ) : (
              <>
                <Camera className="size-4" />
                更换头像
              </>
            )}
          </Button>
          <p className="text-xs text-zinc-500">
            支持 JPG、PNG、WebP、GIF 等图片格式
          </p>
        </div>
      </div>
    </section>
  )
}
