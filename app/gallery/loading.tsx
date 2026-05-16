import { Skeleton } from "@/components/ui/skeleton"

export default function GalleryLoading() {
  return (
    <div className="space-y-4">
      <section className="grid gap-4 overflow-hidden lg:grid-cols-[1.3fr_0.7fr]">
        <div className="bg-card rounded-[28px] border p-5 shadow-sm sm:p-6">
          <Skeleton className="h-4 w-36 rounded-md" />
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,22rem)_1fr]">
            <div>
              <Skeleton className="h-10 max-w-72 rounded-lg" />
              <div className="mt-3 space-y-2">
                <Skeleton className="h-4 rounded-md" />
                <Skeleton className="h-4 w-4/5 rounded-md" />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Skeleton className="h-6 w-24 rounded-3xl" />
                <Skeleton className="h-6 w-28 rounded-3xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="aspect-4/5 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
        <div className="bg-card rounded-[28px] border p-5 shadow-sm sm:p-6">
          <Skeleton className="h-4 w-28 rounded-md" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-14 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>

      <section className="from-card via-card to-primary/10 rounded-[28px] border bg-linear-to-br p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Skeleton className="h-10 flex-1 rounded-2xl" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-3xl" />
            <Skeleton className="h-8 w-20 rounded-3xl" />
          </div>
        </div>
        <div className="mt-4 flex gap-2 overflow-hidden">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-24 shrink-0 rounded-3xl" />
          ))}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton
            key={index}
            className={
              index % 3 === 0 ? "h-80 rounded-3xl" : "h-64 rounded-3xl"
            }
          />
        ))}
      </div>
    </div>
  )
}
