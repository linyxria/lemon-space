'use client'

import { useRouter } from '@bprogress/next/app'
import { ImageIcon, UploadCloud } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { authClient } from '@/lib/auth-client'

export default function GalleryEmpty() {
  const { data: session } = authClient.useSession()
  const router = useRouter()

  const handlePublish = () => {
    const href = session
      ? '/upload'
      : `/sign-in?callbackURL=${encodeURIComponent('/upload')}`
    router.push(href)
  }

  return (
    <Empty className="bg-muted/30 border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ImageIcon />
        </EmptyMedia>
        <EmptyTitle>灵感空空如也</EmptyTitle>
        <EmptyDescription>
          这里暂时还没有任何资源。
          <br />
          作为先驱者，来发布第一条灵感吧！
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={handlePublish}>
          <UploadCloud />
          立即发布
        </Button>
      </EmptyContent>
    </Empty>
  )
}
