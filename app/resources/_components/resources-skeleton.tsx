import { Skeleton } from "@/components/ui/skeleton"

export function ResourcesSkeleton() {
  return (
    <div className="space-y-6">
      <section className="border-border/70 bg-card overflow-hidden rounded-xl border px-4 py-5 shadow-sm sm:px-6 sm:py-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <div className="flex gap-2">
              <Skeleton className="h-5 w-24 rounded-3xl" />
              <Skeleton className="h-5 w-28 rounded-3xl" />
            </div>
            <Skeleton className="mt-5 h-12 w-44 rounded-lg sm:h-14 sm:w-56" />
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 max-w-xl rounded-md" />
              <Skeleton className="h-4 max-w-md rounded-md" />
            </div>
            <Skeleton className="mt-5 h-13 max-w-2xl rounded-xl" />
          </div>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="border-border/70 bg-card rounded-xl border p-3 shadow-sm">
            <Skeleton className="mb-3 h-5 w-24 rounded-md" />
            <div className="space-y-2">
              {Array.from({ length: 7 }).map((_, index) => (
                <Skeleton key={index} className="h-12 rounded-lg" />
              ))}
            </div>
          </div>
          <div className="border-border/70 bg-card rounded-xl border p-4 shadow-sm">
            <Skeleton className="h-5 w-24 rounded-md" />
            <div className="mt-3 flex flex-wrap gap-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-20 rounded-3xl" />
              ))}
            </div>
          </div>
        </aside>

        <div className="min-w-0 space-y-5">
          <div className="grid gap-3 xl:grid-cols-[1.35fr_0.65fr]">
            <Skeleton className="h-72 rounded-xl" />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <Skeleton className="h-52 rounded-xl" />
              <Skeleton className="h-52 rounded-xl" />
            </div>
          </div>

          <section className="border-border/70 bg-card rounded-xl border p-3 shadow-sm sm:p-4">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <Skeleton className="h-3 w-20 rounded-md" />
                <Skeleton className="mt-2 h-8 w-32 rounded-md" />
              </div>
              <Skeleton className="h-5 w-24 rounded-3xl" />
            </div>
            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <ResourceCardSkeleton key={index} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function ResourceCardSkeleton() {
  return (
    <div className="border-border/70 bg-card flex min-h-60 flex-col rounded-xl border p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Skeleton className="size-11 shrink-0 rounded-lg" />
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-5 w-32 rounded-md" />
            <Skeleton className="h-3 w-24 rounded-md" />
          </div>
        </div>
        <Skeleton className="size-10 rounded-4xl" />
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 rounded-md" />
        <Skeleton className="h-4 rounded-md" />
        <Skeleton className="h-4 w-2/3 rounded-md" />
      </div>
      <div className="mt-4 flex gap-1.5">
        <Skeleton className="h-5 w-16 rounded-3xl" />
        <Skeleton className="h-5 w-20 rounded-3xl" />
      </div>
      <div className="mt-auto flex gap-2 pt-5">
        <Skeleton className="h-9 w-24 rounded-4xl" />
        <Skeleton className="h-9 w-18 rounded-4xl" />
      </div>
    </div>
  )
}
