'use client'
import dynamic from 'next/dynamic'

import { Spinner } from '../ui/spinner'

const MasonryLayout = dynamic(() => import('./MasonryLayout'), {
  ssr: false,
  // 选填：这里可以放一个骨架屏，防止加载时的闪烁
  loading: () => (
    <div className="flex min-h-20 items-center justify-center md:min-h-40">
      <Spinner className="size-6 md:size-10" />
    </div>
  ),
})

export default MasonryLayout
