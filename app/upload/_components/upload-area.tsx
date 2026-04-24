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
      className={`group rounded-3xl border border-dashed px-6 py-12 transition sm:px-8 ${isDragActive ? 'border-lime-500 bg-lime-50 shadow-inner shadow-lime-200/50' : 'border-zinc-300 bg-zinc-50/70 hover:border-zinc-400 hover:bg-zinc-100/70'}`}
    >
      <input {...getInputProps()} />
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 text-center">
        <div
          className={`rounded-2xl border p-4 transition ${isDragActive ? 'border-lime-400 bg-lime-100 text-lime-700' : 'border-zinc-200 bg-white text-zinc-500 group-hover:text-zinc-700'}`}
        >
          <UploadCloud
            size={44}
            strokeWidth={1.5}
            className={isDragActive ? 'animate-bounce' : ''}
          />
        </div>
        <p className="text-sm font-semibold text-zinc-700">
          {isDragActive ? t('dragging') : t('idle')}
        </p>
        <p className="text-xs text-zinc-500">{t('formats')}</p>
      </div>
    </div>
  )
}
