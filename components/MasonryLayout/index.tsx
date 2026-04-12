'use client'
import dynamic from 'next/dynamic'

import { SkeletonCard } from '../SkeletonCard'

const MasonryLayout = dynamic(() => import('./MasonryLayout'), {
  ssr: false,
  // 选填：这里可以放一个骨架屏，防止加载时的闪烁
  loading: () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
      {[...Array(12)].map((v, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  ),
})

export default MasonryLayout
