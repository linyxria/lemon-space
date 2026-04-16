'use client'

import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'

import { Button } from '@/components/ui/button'

export interface PreviewFile {
  origin: File
  id: string
  preview: string
}

const itemVariants = {
  initial: { opacity: 0, scale: 0.8, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.8, y: -10, transition: { duration: 0.2 } },
}

export default function PreviewList({
  files,
  uploading,
  onRemove,
}: {
  files: PreviewFile[]
  uploading: boolean
  onRemove: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-4 gap-1 md:grid-cols-6">
      <AnimatePresence mode="popLayout">
        {files.map((file) => {
          return (
            <motion.div
              key={file.id} // 必须唯一 key！
              layout // 关键：让布局变化也有动画
              initial="initial"
              animate="animate"
              exit="exit"
              variants={itemVariants}
              transition={{
                layout: { duration: 0.3, ease: 'easeOut' },
                opacity: { duration: 0.2 },
              }}
              className="group border-border relative aspect-square overflow-hidden rounded border shadow"
            >
              <Image
                src={file.preview}
                alt={file.origin.name}
                fill
                onLoad={() => URL.revokeObjectURL(file.preview)}
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {!uploading && (
                <Button
                  size="icon-xs"
                  className="hover:bg-destructive absolute top-1 right-1 z-10 rounded-full bg-zinc-800/80 text-white opacity-0 transition group-hover:opacity-100"
                  onClick={() => onRemove(file.id)}
                >
                  <X size={12} />
                </Button>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
