"use client"

import { createContext, use } from "react"

export interface ModalAssetData {
  id: string
  title: string
  url: string
  width?: number
  height?: number
  tags?: string[]
}

export const GalleryContext = createContext<{
  openAsset: (asset: ModalAssetData) => void
} | null>(null)

export const useGallery = () => {
  const context = use(GalleryContext)
  if (!context)
    throw new Error("useGallery must be used within GalleryProvider")
  return context
}
