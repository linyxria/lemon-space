import type { Metadata } from "next"

import { ResourceExplorer } from "./_components/resource-explorer"
import { TECH_RESOURCES } from "./_data/resources"

export const metadata: Metadata = {
  title: "Resources",
  description: "Browse curated tools and references for building products.",
}

export default function ResourcesPage() {
  return <ResourceExplorer resources={TECH_RESOURCES} />
}
