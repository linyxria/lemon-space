'use client'
import { Masonry } from 'masonic'
import { useWindowSize } from 'react-use'

import GalleryProvider from '../gallery-provider'
import ImageCard, { type AssetData } from '../image-card'

function getCoulumnCount(width: number) {
  if (width < 768) return 2
  if (width < 1024) return 3
  return 4
}

function getColumnGlutter(width: number) {
  if (width < 768) return 8
  return 16
}

export default function MasonryLayout({ items }: { items: AssetData[] }) {
  const { width } = useWindowSize()

  const columnCount = getCoulumnCount(width)
  const columnGutter = getColumnGlutter(width)

  return (
    <GalleryProvider>
      <Masonry
        key={items.length}
        items={items}
        columnCount={columnCount}
        columnGutter={columnGutter}
        render={ImageCard}
      />
    </GalleryProvider>
  )
}
