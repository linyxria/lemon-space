import { Skeleton } from "@/components/ui/skeleton"

export default function PostsLoading() {
  return (
    <div className="space-y-8">
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="bg-hero rounded-lg border px-6 py-8 md:px-8 md:py-10">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-28 rounded-3xl bg-white/20" />
            <Skeleton className="h-5 w-20 rounded-3xl bg-white/20" />
          </div>
          <Skeleton className="mt-5 h-12 max-w-xl rounded-lg bg-white/20 md:h-14" />
          <div className="mt-4 space-y-2">
            <Skeleton className="h-4 max-w-lg rounded-md bg-white/20" />
            <Skeleton className="h-4 max-w-sm rounded-md bg-white/20" />
          </div>
          <div className="mt-6 flex gap-2">
            <Skeleton className="h-9 w-28 rounded-4xl bg-white/20" />
            <Skeleton className="h-9 w-24 rounded-4xl bg-white/20" />
          </div>
        </div>

        <aside className="bg-card rounded-lg border p-5">
          <Skeleton className="h-6 w-28 rounded-md" />
          <Skeleton className="mt-4 h-10 rounded-lg" />
          <div className="mt-5 flex flex-wrap gap-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-20 rounded-3xl" />
            ))}
          </div>
        </aside>
      </section>

      <section className="space-y-4">
        <div>
          <Skeleton className="h-3 w-28 rounded-md" />
          <Skeleton className="mt-2 h-8 w-32 rounded-md" />
        </div>
        <PostCardSkeleton featured />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <PostCardSkeleton key={index} />
        ))}
      </section>
    </div>
  )
}

function PostCardSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <div
      className={
        featured
          ? "bg-card grid min-h-36 grid-cols-[120px_minmax(0,1fr)] overflow-hidden rounded-lg border md:grid-cols-[160px_minmax(0,1fr)]"
          : "bg-card grid min-h-24 grid-cols-[88px_minmax(0,1fr)] overflow-hidden rounded-lg border"
      }
    >
      <Skeleton className="h-full rounded-none" />
      <div className={featured ? "p-4" : "p-2.5"}>
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-3xl" />
          <Skeleton className="h-5 w-20 rounded-3xl" />
        </div>
        <Skeleton className="mt-3 h-6 max-w-md rounded-md" />
        <Skeleton className="mt-2 h-4 max-w-lg rounded-md" />
        <div className="mt-4 flex gap-3">
          <Skeleton className="h-4 w-20 rounded-md" />
          <Skeleton className="h-4 w-10 rounded-md" />
          <Skeleton className="h-4 w-10 rounded-md" />
        </div>
      </div>
    </div>
  )
}
