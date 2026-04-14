'use client'
import { useAuth, useClerk } from '@clerk/nextjs'
import { ImageIcon, UploadCloud } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

export default function GalleryEmpty() {
  const { isSignedIn } = useAuth()
  const { openSignIn } = useClerk()
  const router = useRouter()

  const handlePublish = () => {
    if (isSignedIn) {
      router.push('/upload') // 已登录，去上传
    } else {
      openSignIn({ fallbackRedirectUrl: '/upload' })
    }
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
