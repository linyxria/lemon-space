"use client"

import { useRouter } from "@bprogress/next/app"
import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { Camera, LoaderCircle } from "lucide-react"
import { useTranslations } from "next-intl"
import type { ChangeEvent } from "react"
import { useRef, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import UserAvatar from "@/components/user-avatar"
import { uploadFile } from "@/lib/s3"
import { useTRPC } from "@/trpc/client"

export default function AvatarUploadCard() {
  const trpc = useTRPC()
  const t = useTranslations("AvatarUpload")
  const { data } = useSuspenseQuery(trpc.user.info.queryOptions())

  const mutation = useMutation(trpc.user.avatarUpdate.mutationOptions())

  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>()

  const handleSelectFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error(t("invalidFile"))
      event.target.value = ""
      return
    }

    const localPreviewUrl = URL.createObjectURL(file)

    try {
      setUploading(true)
      setPreviewUrl(localPreviewUrl)

      const { objectKey } = await uploadFile("avatars", file)
      await mutation.mutateAsync({ objectKey })

      toast.success(t("updated"))
      router.refresh()
    } catch (error) {
      console.error(error)
      setPreviewUrl(undefined)
      toast.error(t("uploadFailed"))
    } finally {
      setUploading(false)
      event.target.value = ""
    }
  }

  return (
    <section className="from-card via-card to-primary/10 relative mb-6 overflow-hidden rounded-[28px] border bg-linear-to-br shadow-sm md:mb-8">
      <div className="from-primary/20 via-primary/10 pointer-events-none absolute inset-x-0 top-0 h-36 bg-linear-to-b to-transparent md:hidden" />
      <div className="bg-primary/10 pointer-events-none absolute top-5 left-1/2 size-36 -translate-x-1/2 rounded-full blur-2xl md:hidden" />
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
            <div className="bg-primary/15 absolute inset-4 rounded-full blur-2xl md:hidden" />
            <div className="relative flex items-center justify-center">
              <UserAvatar
                name={data.name}
                image={previewUrl || data.image}
                className="relative size-24 shadow-[0_14px_30px_-20px_rgba(24,24,27,0.35)] sm:size-28 md:size-32 md:shadow-none"
              />
            </div>
            <Button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              size="sm"
              className="bg-background text-foreground shadow-foreground/10 mt-3 inline-flex rounded-full border px-4 shadow-lg backdrop-blur sm:hidden"
            >
              {uploading ? (
                <>
                  <LoaderCircle className="size-3.5 animate-spin" />
                  {t("uploadingShort")}
                </>
              ) : (
                <>
                  <Camera className="size-3.5" />
                  {t("changeAvatar")}
                </>
              )}
            </Button>
          </div>

          <div className="flex min-w-0 flex-col items-center text-center sm:items-start sm:text-left">
            <span className="bg-background/80 text-muted-foreground mb-2 rounded-full px-3 py-1 text-[11px] font-medium tracking-[0.14em] uppercase shadow-sm md:hidden">
              {t("badge")}
            </span>
            <p className="text-foreground text-xl font-black tracking-tight sm:text-2xl">
              {data.name}
            </p>
            <p className="text-muted-foreground mt-1 max-w-60 truncate text-sm sm:max-w-70 md:max-w-none">
              {data.email}
            </p>
            <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-6">
              {t("description")}
            </p>
            <p className="text-muted-foreground mt-3 text-xs sm:hidden">
              {t("formats")}
            </p>
          </div>
        </div>

        <div className="hidden w-full flex-col gap-3 border-t pt-4 sm:pt-5 md:flex md:w-auto md:items-end md:border-t-0 md:pt-0">
          <Button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex w-full items-center justify-center gap-2 md:w-auto"
          >
            {uploading ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                {t("uploadingLong")}
              </>
            ) : (
              <>
                <Camera className="size-4" />
                {t("changeAvatar")}
              </>
            )}
          </Button>
          <p className="text-muted-foreground text-xs">{t("formats")}</p>
        </div>
      </div>
    </section>
  )
}
