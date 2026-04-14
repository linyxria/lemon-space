'use client'
import { UploadCloud } from 'lucide-react'
import { useDropzone } from 'react-dropzone'

export default function UploadArea({
  uploading,
  onDrop,
}: {
  uploading: boolean
  onDrop: (acceptedFiles: File[]) => void
}) {
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
      className={`flex flex-col items-center justify-center gap-6 rounded border border-dashed p-12 transition
            ${isDragActive ? 'border-primary bg-primary/10 scale-[1.02] shadow-inner' : 'border-border bg-muted'}`}
    >
      <input {...getInputProps()} />
      <UploadCloud
        size={48}
        strokeWidth={1.5}
        className={
          isDragActive ? 'text-primary animate-bounce' : 'text-muted-foreground'
        }
      />
      <p className="text-sm text-muted-foreground text-center font-medium">
        将图片拖入此区域或点击选择图片
      </p>
    </div>
  )
}
