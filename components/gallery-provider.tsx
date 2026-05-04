"use client"

import { AnimatePresence } from "motion/react"
import { usePathname } from "next/navigation"
import { createContext, useContext, useState } from "react"

import ImageModal, { type ModalAssetData } from "./image-modal"

const GalleryContext = createContext<{
  openAsset: (asset: ModalAssetData) => void
} | null>(null)

export default function GalleryProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [modal, setModal] = useState<{
    asset: ModalAssetData
    pathname: string
  } | null>(null)

  const openAsset = (item: ModalAssetData) => {
    setModal({
      asset: item,
      pathname,
    })
  }

  const handleExitComplete = () => {
    setModal(null)
  }
  const isModalOpen = modal?.pathname === pathname

  return (
    <GalleryContext.Provider value={{ openAsset: openAsset }}>
      {children}
      <AnimatePresence onExitComplete={handleExitComplete}>
        {isModalOpen && (
          <ImageModal asset={modal.asset} onClose={() => setModal(null)} />
        )}
      </AnimatePresence>
    </GalleryContext.Provider>
  )
}

export const useGallery = () => {
  const context = useContext(GalleryContext)
  if (!context)
    throw new Error("useGallery must be used within GalleryProvider")
  return context
}
