'use client'

import { AnimatePresence } from 'motion/react'
import { createContext, useContext, useState } from 'react'

import type { AssetData } from './ImageCard'
import ImageModal from './ImageModal'

const GalleryContext = createContext<{
  openAsset: (asset: AssetData) => void
} | null>(null)

export function GalleryProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [asset, setAsset] = useState<AssetData | null>(null)

  const openAsset = (item: AssetData) => {
    setAsset(item)
    setIsOpen(true)
  }

  const handleExitComplete = () => {
    // 只有当动画彻底结束时，才把数据源断掉
    // 这样在 exit 动画期间，asset 始终有值，不会报错
    setAsset(null)
  }

  return (
    <GalleryContext.Provider value={{ openAsset: openAsset }}>
      {children}
      {/* 这里的单例 Modal 只在 Provider 挂载时渲染一次 */}
      <AnimatePresence onExitComplete={handleExitComplete}>
        {isOpen && (
          <ImageModal asset={asset} onClose={() => setIsOpen(false)} />
        )}
      </AnimatePresence>
    </GalleryContext.Provider>
  )
}

export const useGallery = () => {
  const context = useContext(GalleryContext)
  if (!context)
    throw new Error('useGallery must be used within GalleryProvider')
  return context
}
