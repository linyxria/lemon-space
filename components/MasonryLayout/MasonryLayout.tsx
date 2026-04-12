'use client'
import { ReactNode } from 'react'
import Masonry from 'react-masonry-css'

interface MasonryLayoutProps {
  children: ReactNode
}

const breakpointColumnsObj = {
  default: 4,
  1024: 3,
  640: 2,
}

export default function MasonryLayout({ children }: MasonryLayoutProps) {
  return (
    <Masonry
      breakpointCols={breakpointColumnsObj}
      className="flex w-auto -ml-2 md:-ml-4"
      columnClassName="bg-clip-padding pl-2 md:pl-4 *:mb-2 md:*:mb-4"
    >
      {children}
    </Masonry>
  )
}
