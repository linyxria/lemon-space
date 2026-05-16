import type { Metadata } from "next"

import UploadClient from "./_components/upload-client"

export const metadata: Metadata = {
  title: "Upload Gallery Assets",
  description: "Upload and tag images for your Lemon Space gallery.",
}

export default function UploadPage() {
  return <UploadClient />
}
