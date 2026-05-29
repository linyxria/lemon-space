"use client"

import { AnimatePresence } from "motion/react"
import { usePathname } from "next/navigation"
import { useState } from "react"

import { GalleryContext, type ModalAssetData } from "./gallery-context"
import ImageModal from "./image-modal"

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
  const contextValue = { openAsset }

  return (
    <GalleryContext.Provider value={contextValue}>
      {children}
      <AnimatePresence onExitComplete={handleExitComplete}>
        {isModalOpen && (
          <ImageModal asset={modal.asset} onClose={() => setModal(null)} />
        )}
      </AnimatePresence>
    </GalleryContext.Provider>
  )
}
