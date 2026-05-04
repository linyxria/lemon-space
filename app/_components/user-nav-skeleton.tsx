import { Skeleton } from "@/components/ui/skeleton"

export default function UserNavSkeleton() {
  return (
    <div className="flex items-center gap-2 md:gap-4">
      <div className="hidden gap-2 text-right sm:grid">
        <Skeleton className="h-4 w-24 md:w-32" />
        <Skeleton className="ml-auto h-4 w-16 md:w-20" />
      </div>
      <Skeleton className="size-9 shrink-0 rounded-full" />
    </div>
  )
}
