import { ResourceExplorer } from "./_components/resource-explorer"
import { TECH_RESOURCES } from "./_data/resources"

export default function ResourcesPage() {
  return <ResourceExplorer resources={TECH_RESOURCES} />
}
