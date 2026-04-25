'use client'

import { UploadCloud } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useDropzone } from 'react-dropzone'

export default function UploadArea({
  uploading,
  onDrop,
}: {
  uploading: boolean
  onDrop: (acceptedFiles: File[]) => void
}) {
  const t = useTranslations('UploadArea')
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.avif', '.gif'],
    },
    disabled: uploading,
    multiple: true,
  })

  return (
    <div
      {...getRootProps()}
      className={`group rounded-3xl border border-dashed px-6 py-12 transition sm:px-8 ${isDragActive ? 'border-primary bg-primary/10 shadow-inner shadow-primary/20' : 'border-border bg-muted/50 hover:bg-muted'}`}
    >
      <input {...getInputProps()} />
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 text-center">
        <div
          className={`rounded-2xl border p-4 transition ${isDragActive ? 'border-primary bg-primary/15 text-primary' : 'bg-card text-muted-foreground group-hover:text-foreground'}`}
        >
          <UploadCloud
            size={44}
            strokeWidth={1.5}
            className={isDragActive ? 'animate-bounce' : ''}
          />
        </div>
        <p className="text-foreground text-sm font-semibold">
          {isDragActive ? t('dragging') : t('idle')}
        </p>
        <p className="text-muted-foreground text-xs">{t('formats')}</p>
      </div>
    </div>
  )
}
