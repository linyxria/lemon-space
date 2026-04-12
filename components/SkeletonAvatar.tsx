import { Skeleton } from '@/components/ui/skeleton'

export function SkeletonAvatar() {
  return (
    <div className="flex w-fit items-center gap-4">
      <div className="grid gap-2">
        <Skeleton className="h-4 w-24 md:w-37.5" />
        <Skeleton className="h-4 w-16 md:w-25" />
      </div>
      <Skeleton className="size-10 shrink-0 rounded-full" />
    </div>
  )
}
