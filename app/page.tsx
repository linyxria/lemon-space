import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Lemon Space",
  description: "A personal writing space with a visual gallery.",
}

export default function HomePage() {
  redirect("/posts")
}
