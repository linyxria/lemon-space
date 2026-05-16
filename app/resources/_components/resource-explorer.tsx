"use client"

import { useRouter } from "@bprogress/next/app"
import {
  useMutation,
  useQueryClient,
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from "@tanstack/react-query"
import type { inferRouterOutputs } from "@trpc/server"
import {
  ArrowUpRight,
  Bookmark,
  Check,
  Database,
  ExternalLink,
  Funnel,
  Grid2X2,
  LibraryBig,
  Link as LinkIcon,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash,
  X,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  TECH_RESOURCE_CATEGORIES,
  TECH_RESOURCE_LEVELS,
  TECH_RESOURCE_STATUSES,
  type TechResourceCategory,
  type TechResourceLevel,
  type TechResourceStatus,
} from "@/lib/tech-resources"
import { cn } from "@/lib/utils"
import { useTRPC } from "@/trpc/client"
import type { AppRouter } from "@/trpc/routers/_app"

type RouterOutputs = inferRouterOutputs<AppRouter>
type ResourceItem = RouterOutputs["resource"]["list"]["items"][number]
type ResourceFilter = TechResourceCategory | "all" | "saved"

type ResourceDraft = {
  name: string
  description: string
  category: TechResourceCategory
  level: TechResourceLevel
  url: string
  docsUrl: string
  tags: string
  featured: boolean
  status: TechResourceStatus
}

const emptyDraft: ResourceDraft = {
  name: "",
  description: "",
  category: "framework",
  level: "工具",
  url: "",
  docsUrl: "",
  tags: "",
  featured: false,
  status: "published",
}

function buildResourceHref({
  filter,
  q,
  tag,
}: {
  filter?: ResourceFilter
  q?: string
  tag?: string
}) {
  const params = new URLSearchParams()

  if (filter && filter !== "all") {
    if (filter === "saved") params.set("view", "saved")
    else params.set("category", filter)
  }
  if (q) params.set("q", q)
  if (tag) params.set("tag", tag)

  const query = params.toString()
  return query ? `/resources?${query}` : "/resources"
}

function getCategoryLabel(categoryId: string) {
  return (
    TECH_RESOURCE_CATEGORIES.find((category) => category.id === categoryId)
      ?.label ?? categoryId
  )
}

function parseTagInput(value: string) {
  return Array.from(
    new Set(
      value.split(",").flatMap((tag) => {
        const trimmed = tag.trim()
        return trimmed ? [trimmed] : []
      }),
    ),
  )
}

type CategoryItem = {
  id: TechResourceCategory
  label: string
  description: string
  resourceCount: number
}

type HotTag = {
  id: string
  name: string
  slug: string
}

export function ResourceExplorer({
  filter,
  q,
  tag,
  signedIn,
}: {
  filter: ResourceFilter
  q: string | undefined
  tag: string | undefined
  signedIn: boolean
}) {
  const trpc = useTRPC()
  const { push } = useRouter()
  const pathname = usePathname()
  const [keyword, setKeyword] = useState(q ?? "")
  const [isNavigating, startNavigation] = useTransition()
  const [panelState, setPanelState] = useState<
    | { mode: "create"; resource?: undefined }
    | { mode: "edit"; resource: ResourceItem }
    | null
  >(null)

  const { data: categories } = useSuspenseQuery(
    trpc.resource.categories.queryOptions(),
  )
  const { data: tags } = useSuspenseQuery(trpc.resource.tags.queryOptions())
  const { data: featured } = useSuspenseQuery(
    trpc.resource.featured.queryOptions(),
  )

  const listQuery =
    filter === "saved" && signedIn
      ? trpc.resource.bookmarked.infiniteQueryOptions(
          { limit: 24 },
          {
            getNextPageParam: (lastPage) => lastPage.nextCursor,
          },
        )
      : trpc.resource.list.infiniteQueryOptions(
          {
            category:
              filter !== "all" && filter !== "saved" ? filter : undefined,
            q,
            tag,
            limit: 24,
          },
          {
            getNextPageParam: (lastPage) => lastPage.nextCursor,
          },
        )

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery(listQuery)
  const resources = useMemo(() => {
    const seen = new Set<string>()
    const uniqueResources: ResourceItem[] = []

    for (const page of data.pages) {
      for (const resource of page.items) {
        if (seen.has(resource.id)) continue
        seen.add(resource.id)
        uniqueResources.push(resource)
      }
    }

    return uniqueResources
  }, [data.pages])

  const totalCount = categories.reduce(
    (count, category) => count + category.resourceCount,
    0,
  )
  const featuredResources = featured.featuredResources
  const hotTags =
    featured.hotTags.length > 0 ? featured.hotTags : tags.slice(0, 8)
  const activeTitle =
    filter === "saved"
      ? "我的收藏"
      : filter === "all"
        ? "全部条目"
        : getCategoryLabel(filter)

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    startNavigation(() => {
      push(buildResourceHref({ filter, q: keyword.trim(), tag }))
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <ResourceHero
        filter={filter}
        keyword={keyword}
        resourceCount={resources.length}
        featuredCount={featuredResources.length}
        signedIn={signedIn}
        totalCount={totalCount}
        isSearching={isNavigating}
        onKeywordChange={setKeyword}
        onSubmitSearch={submitSearch}
      />

      <section className="grid gap-5 lg:grid-cols-[270px_minmax(0,1fr)]">
        <ResourceSidebar
          categories={categories}
          filter={filter}
          hotTags={hotTags}
          pathname={pathname}
          q={q}
          resourceCount={resources.length}
          signedIn={signedIn}
          tag={tag}
          totalCount={totalCount}
          onCreate={() => setPanelState({ mode: "create" })}
        />
        <ResourceResults
          activeTitle={activeTitle}
          featuredResources={featuredResources}
          filter={filter}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          pathname={pathname}
          q={q}
          resources={resources}
          signedIn={signedIn}
          tag={tag}
          onEdit={(resource) => setPanelState({ mode: "edit", resource })}
          onFetchNextPage={() => void fetchNextPage()}
        />
      </section>

      {panelState ? (
        <ResourceEditorPanel
          state={panelState}
          onClose={() => setPanelState(null)}
        />
      ) : null}
    </div>
  )
}

function ResourceHero({
  featuredCount,
  filter,
  keyword,
  resourceCount,
  signedIn,
  totalCount,
  isSearching,
  onKeywordChange,
  onSubmitSearch,
}: {
  featuredCount: number
  filter: ResourceFilter
  keyword: string
  resourceCount: number
  signedIn: boolean
  totalCount: number
  isSearching: boolean
  onKeywordChange: (value: string) => void
  onSubmitSearch: (event: React.FormEvent<HTMLFormElement>) => void
}) {
  return (
    <section className="border-border/70 bg-card relative overflow-hidden rounded-xl border px-4 py-5 shadow-sm sm:px-6 sm:py-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,color-mix(in_oklch,var(--primary)_22%,transparent),transparent_32%),linear-gradient(135deg,transparent_0%,color-mix(in_oklch,var(--muted)_64%,transparent)_100%)]" />
      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-foreground text-background">
              <Database data-icon="inline-start" />
              真实数据接口
            </Badge>
            <Badge variant="outline" className="text-muted-foreground">
              {totalCount} 条已发布
            </Badge>
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl leading-[0.95] font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            技术导航
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl text-sm leading-7 sm:text-base">
            把常用框架、工程链、数据工具和权威文档沉淀为可搜索、可收藏、可维护的团队知识入口。
          </p>
          <form
            onSubmit={onSubmitSearch}
            className="border-border/80 bg-background/90 mt-5 flex max-w-2xl flex-col gap-2 rounded-xl border p-1.5 shadow-sm backdrop-blur sm:flex-row"
          >
            <div className="relative min-w-0 flex-1">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                value={keyword}
                onChange={(event) => onKeywordChange(event.target.value)}
                placeholder="搜索 React、数据库、测试工具..."
                className="text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/35 h-10 border-transparent bg-transparent pl-9"
              />
            </div>
            <Button size="lg" className="h-10 px-4" disabled={isSearching}>
              {isSearching ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <ArrowUpRight className="size-4" />
              )}
              {isSearching ? "搜索中" : "搜索"}
            </Button>
          </form>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
          <HeroMetric
            icon={<Grid2X2 className="size-4" />}
            value={TECH_RESOURCE_CATEGORIES.length}
            label="清晰分类"
          />
          <HeroMetric
            icon={<Bookmark className="size-4" />}
            value={filter === "saved" ? resourceCount : featuredCount}
            label={filter === "saved" ? "已收藏" : "精选入口"}
          />
          <HeroMetric
            icon={<ShieldCheck className="size-4" />}
            value={signedIn ? "CRUD" : "Read"}
            label={signedIn ? "可维护" : "公开浏览"}
          />
        </div>
      </div>
    </section>
  )
}

function ResourceSidebar({
  categories,
  filter,
  hotTags,
  pathname,
  q,
  resourceCount,
  signedIn,
  tag,
  totalCount,
  onCreate,
}: {
  categories: CategoryItem[]
  filter: ResourceFilter
  hotTags: HotTag[]
  pathname: string
  q: string | undefined
  resourceCount: number
  signedIn: boolean
  tag: string | undefined
  totalCount: number
  onCreate: () => void
}) {
  return (
    <aside className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:self-start">
      <div className="border-border/70 bg-card rounded-xl border p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Funnel className="text-primary size-4" />
            分类筛选
          </div>
          {q || tag || filter !== "all" ? (
            <Button
              size="xs"
              variant="ghost"
              nativeButton={false}
              render={<Link href="/resources" />}
            >
              清除
            </Button>
          ) : null}
        </div>
        <div className="grid gap-2">
          <FilterLink
            active={filter === "all" && !tag}
            href={buildResourceHref({ filter: "all", q })}
            label="全部"
            description="所有已发布技术条目"
            count={totalCount}
          />
          <FilterLink
            active={filter === "saved"}
            href={
              signedIn
                ? buildResourceHref({ filter: "saved" })
                : `/sign-in?callbackURL=${encodeURIComponent(pathname)}`
            }
            label="收藏"
            description={signedIn ? "你保存的技术入口" : "登录后同步收藏"}
            count={filter === "saved" ? resourceCount : undefined}
          />
          {categories.map((category) => (
            <FilterLink
              key={category.id}
              active={filter === category.id}
              href={buildResourceHref({ filter: category.id, q })}
              label={category.label}
              description={category.description}
              count={category.resourceCount}
            />
          ))}
        </div>
      </div>

      <div className="border-border/70 bg-card rounded-xl border p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="text-primary size-4" />
          热门标签
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {hotTags.map((item) => (
            <Badge
              key={item.id}
              variant={tag === item.slug ? "default" : "outline"}
              render={
                <Link href={buildResourceHref({ filter, q, tag: item.slug })} />
              }
              className="h-8 px-3"
            >
              #{item.name}
            </Badge>
          ))}
        </div>
      </div>

      {signedIn ? (
        <ResourceManager onCreate={onCreate} />
      ) : (
        <div className="border-border/70 bg-card rounded-xl border border-dashed p-4 shadow-sm">
          <p className="text-sm font-semibold">维护技术导航</p>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            登录后可以新增、编辑和收藏条目。
          </p>
          <Button
            className="mt-3"
            size="sm"
            nativeButton={false}
            render={
              <Link
                href={`/sign-in?callbackURL=${encodeURIComponent(pathname)}`}
              />
            }
          >
            登录
          </Button>
        </div>
      )}
    </aside>
  )
}

function ResourceResults({
  activeTitle,
  featuredResources,
  filter,
  hasNextPage,
  isFetchingNextPage,
  pathname,
  q,
  resources,
  signedIn,
  tag,
  onEdit,
  onFetchNextPage,
}: {
  activeTitle: string
  featuredResources: ResourceItem[]
  filter: ResourceFilter
  hasNextPage: boolean
  isFetchingNextPage: boolean
  pathname: string
  q: string | undefined
  resources: ResourceItem[]
  signedIn: boolean
  tag: string | undefined
  onEdit: (resource: ResourceItem) => void
  onFetchNextPage: () => void
}) {
  const showFeatured =
    featuredResources.length > 0 && filter === "all" && !q && !tag

  return (
    <div className="min-w-0 space-y-5">
      {showFeatured ? (
        <section className="grid gap-3 xl:grid-cols-[1.35fr_0.65fr]">
          {featuredResources[0] ? (
            <FeaturedResourceCard
              resource={featuredResources[0]}
              signedIn={signedIn}
              onEdit={onEdit}
            />
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {featuredResources.slice(1, 3).map((resource) => (
              <ResourceCard
                key={resource.id}
                compact
                resource={resource}
                signedIn={signedIn}
                onEdit={onEdit}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="border-border/70 bg-card rounded-xl border p-3 shadow-sm sm:p-4">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
              Directory
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              {activeTitle}
            </h2>
          </div>
          <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
            {q ? <Badge variant="secondary">搜索：{q}</Badge> : null}
            {tag ? <Badge variant="secondary">标签：#{tag}</Badge> : null}
            <span>{resources.length} 个结果</span>
          </div>
        </div>

        {filter === "saved" && !signedIn ? (
          <EmptyResourceState
            title="登录后查看收藏"
            description="收藏会写入真实账号数据，不再使用本机 localStorage。"
            actionHref={`/sign-in?callbackURL=${encodeURIComponent(pathname)}`}
            actionLabel="登录"
          />
        ) : resources.length === 0 ? (
          <EmptyResourceState
            title="没有匹配的技术条目"
            description="换个关键词或分类继续浏览；登录后也可以提交新的技术入口。"
            actionHref="/resources"
            actionLabel="返回全部"
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {resources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                signedIn={signedIn}
                onEdit={onEdit}
              />
            ))}
          </div>
        )}

        {hasNextPage ? (
          <div className="mt-5 flex justify-center">
            <Button
              variant="secondary"
              disabled={isFetchingNextPage}
              onClick={onFetchNextPage}
            >
              {isFetchingNextPage ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : null}
              加载更多
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  )
}

function HeroMetric({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: React.ReactNode
  label: string
}) {
  return (
    <div className="border-border/70 bg-background/75 rounded-xl border p-4 shadow-sm backdrop-blur">
      <div className="text-muted-foreground flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <span className="font-mono text-xs font-semibold tracking-[0.18em] uppercase">
          {label}
        </span>
      </div>
      <p className="text-foreground mt-2 font-mono text-2xl font-semibold">
        {value}
      </p>
    </div>
  )
}

function FilterLink({
  active,
  href,
  label,
  description,
  count,
}: {
  active: boolean
  href: string
  label: string
  description: string
  count?: number
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex min-h-12 items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-all active:translate-y-px",
        active
          ? "border-primary/50 bg-primary/15 text-foreground shadow-[inset_3px_0_0_var(--primary)]"
          : "hover:border-border hover:bg-muted/45 border-transparent",
      )}
    >
      <span className="min-w-0">
        <span className="block truncate text-sm font-black">{label}</span>
        <span
          className={cn(
            "mt-0.5 block truncate text-xs",
            active ? "text-foreground/70" : "text-muted-foreground",
          )}
        >
          {description}
        </span>
      </span>
      {typeof count === "number" ? (
        <span
          className={cn(
            "rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold",
            active
              ? "border-primary/30 bg-primary/20 text-foreground"
              : "bg-background/70 text-muted-foreground",
          )}
        >
          {count}
        </span>
      ) : null}
    </Link>
  )
}

function FeaturedResourceCard({
  resource,
  signedIn,
  onEdit,
}: {
  resource: ResourceItem
  signedIn: boolean
  onEdit: (resource: ResourceItem) => void
}) {
  return (
    <article className="border-border/70 bg-card relative min-h-72 overflow-hidden rounded-xl border p-5 shadow-sm">
      <div className="bg-primary pointer-events-none absolute inset-x-0 top-0 h-1" />
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-foreground text-background">
          <Sparkles className="size-3.5" />
          精选
        </Badge>
        <Badge variant="secondary">{getCategoryLabel(resource.category)}</Badge>
      </div>
      <h2 className="mt-5 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
        {resource.name}
      </h2>
      <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-7">
        {resource.description}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {resource.tags.slice(0, 5).map((tag) => (
          <Badge key={tag.id} variant="outline" className="h-6 px-2.5">
            #{tag.name}
          </Badge>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Button
          nativeButton={false}
          render={
            <a
              href={resource.docsUrl ?? resource.url}
              target="_blank"
              rel="noreferrer"
            />
          }
        >
          打开文档
          <ExternalLink className="size-4" />
        </Button>
        <BookmarkButton resource={resource} signedIn={signedIn} />
        {resource.canEdit ? (
          <Button variant="outline" onClick={() => onEdit(resource)}>
            <Pencil className="size-4" />
            编辑
          </Button>
        ) : null}
      </div>
    </article>
  )
}

function ResourceCard({
  compact = false,
  resource,
  signedIn,
  onEdit,
}: {
  compact?: boolean
  resource: ResourceItem
  signedIn: boolean
  onEdit: (resource: ResourceItem) => void
}) {
  return (
    <article
      className={cn(
        "border-border/70 bg-card group hover:border-primary/35 flex min-h-60 min-w-0 flex-col rounded-xl border p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        compact && "bg-primary/10 min-h-52",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="bg-primary/12 text-primary ring-primary/15 flex size-11 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-semibold ring-1">
            {resource.name.slice(0, 2)}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold tracking-tight">
              {resource.name}
            </h3>
            <p className="text-muted-foreground text-xs font-medium">
              {getCategoryLabel(resource.category)} / {resource.level}
            </p>
          </div>
        </div>
        <BookmarkButton resource={resource} signedIn={signedIn} iconOnly />
      </div>

      <p className="text-muted-foreground mt-4 line-clamp-3 text-sm leading-6">
        {resource.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {resource.tags.slice(0, 4).map((tag) => (
          <Badge key={tag.id} variant="secondary">
            {tag.name}
          </Badge>
        ))}
      </div>

      <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
        <Button
          size="sm"
          className="h-10"
          nativeButton={false}
          render={
            <a
              href={resource.docsUrl ?? resource.url}
              target="_blank"
              rel="noreferrer"
            />
          }
        >
          打开文档
          <ExternalLink className="size-3.5" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-10"
          nativeButton={false}
          render={<a href={resource.url} target="_blank" rel="noreferrer" />}
        >
          官网
          <LinkIcon className="size-3.5" />
        </Button>
        {resource.canEdit ? (
          <Button
            size="sm"
            variant="ghost"
            className="col-span-2 h-10"
            onClick={() => onEdit(resource)}
          >
            <Pencil className="size-3.5" />
            编辑
          </Button>
        ) : null}
      </div>
    </article>
  )
}

function BookmarkButton({
  resource,
  signedIn,
  iconOnly = false,
}: {
  resource: ResourceItem
  signedIn: boolean
  iconOnly?: boolean
}) {
  const trpc = useTRPC()
  const { push } = useRouter()
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const mutation = useMutation(
    trpc.resource.toggleBookmark.mutationOptions({
      onSuccess: async (next) => {
        toast.success(next.bookmarkedByMe ? "已收藏" : "已取消收藏")
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.resource.list.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.resource.bookmarked.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.resource.featured.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.resource.myList.queryKey(),
          }),
        ])
      },
      onError: () => toast.error("收藏操作失败"),
    }),
  )

  const handleBookmark = () => {
    if (!signedIn) {
      push(
        `/sign-in?callbackURL=${encodeURIComponent(window.location.pathname)}`,
      )
      return
    }

    startTransition(() => {
      mutation.mutate({ resourceId: resource.id })
    })
  }

  return (
    <Button
      type="button"
      size={iconOnly ? "icon-lg" : "sm"}
      variant={resource.bookmarkedByMe ? "secondary" : "outline"}
      disabled={mutation.isPending || isPending}
      aria-label={resource.bookmarkedByMe ? "取消收藏" : "收藏"}
      onClick={handleBookmark}
      className={resource.bookmarkedByMe ? "text-primary" : undefined}
    >
      {resource.bookmarkedByMe ? (
        <Check className="size-4" />
      ) : (
        <Bookmark className="size-4" />
      )}
      {iconOnly ? null : (
        <span>{resource.bookmarkedByMe ? "已收藏" : "收藏"}</span>
      )}
    </Button>
  )
}

function ResourceManager({ onCreate }: { onCreate: () => void }) {
  const trpc = useTRPC()
  const { data } = useSuspenseQuery(trpc.resource.myList.queryOptions())

  return (
    <div className="border-border/70 bg-card rounded-xl border p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">我的条目</p>
          <p className="text-muted-foreground mt-1 text-xs">
            {data.length} 个由你维护
          </p>
        </div>
        <Button size="sm" onClick={onCreate}>
          <Plus className="size-4" />
          新增
        </Button>
      </div>
      <div className="mt-4 space-y-2">
        {data.slice(0, 4).map((resource) => (
          <div
            key={resource.id}
            className="bg-background/70 flex min-h-12 items-center justify-between gap-3 rounded-xl border px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{resource.name}</p>
              <p className="text-muted-foreground text-xs">
                {resource.status === "published" ? "已发布" : "草稿"}
              </p>
            </div>
            <Badge
              variant={
                resource.status === "published" ? "secondary" : "outline"
              }
            >
              {resource.bookmarkCount}
            </Badge>
          </div>
        ))}
        {data.length === 0 ? (
          <p className="bg-muted/30 text-muted-foreground rounded-xl border border-dashed px-3 py-4 text-sm">
            还没有自己维护的条目。
          </p>
        ) : null}
      </div>
    </div>
  )
}

function ResourceEditorPanel({
  state,
  onClose,
}: {
  state:
    | { mode: "create"; resource?: undefined }
    | { mode: "edit"; resource: ResourceItem }
  onClose: () => void
}) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<ResourceDraft>(() => {
    if (state.mode === "create") return emptyDraft

    return {
      name: state.resource.name,
      description: state.resource.description,
      category: state.resource.category as TechResourceCategory,
      level: state.resource.level as TechResourceLevel,
      url: state.resource.url,
      docsUrl: state.resource.docsUrl ?? "",
      tags: state.resource.tags.map((tag) => tag.name).join(", "),
      featured: state.resource.featured,
      status: state.resource.status as TechResourceStatus,
    }
  })

  const invalidateResources = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: trpc.resource.list.queryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: trpc.resource.tags.queryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: trpc.resource.categories.queryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: trpc.resource.featured.queryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: trpc.resource.myList.queryKey(),
      }),
    ])
  }

  const createMutation = useMutation(
    trpc.resource.create.mutationOptions({
      onSuccess: async () => {
        toast.success("技术条目已创建")
        await invalidateResources()
        onClose()
      },
      onError: (mutationError) => setError(mutationError.message),
    }),
  )
  const updateMutation = useMutation(
    trpc.resource.update.mutationOptions({
      onSuccess: async () => {
        toast.success("技术条目已更新")
        await invalidateResources()
        onClose()
      },
      onError: (mutationError) => setError(mutationError.message),
    }),
  )
  const deleteMutation = useMutation(
    trpc.resource.delete.mutationOptions({
      onSuccess: async () => {
        toast.success("技术条目已删除")
        await invalidateResources()
        onClose()
      },
      onError: (mutationError) => setError(mutationError.message),
    }),
  )

  const isSaving = createMutation.isPending || updateMutation.isPending
  const isDeleting = deleteMutation.isPending

  const setValue = <Key extends keyof ResourceDraft>(
    key: Key,
    value: ResourceDraft[Key],
  ) => setDraft((current) => ({ ...current, [key]: value }))

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const payload = {
      ...draft,
      tags: parseTagInput(draft.tags),
    }

    if (state.mode === "create") {
      createMutation.mutate(payload)
    } else {
      updateMutation.mutate({
        resourceId: state.resource.id,
        ...payload,
      })
    }
  }

  return (
    <div className="bg-foreground/20 fixed inset-0 z-40 flex justify-end p-2 backdrop-blur-sm sm:p-5">
      <div className="bg-background flex h-full max-h-dvh w-full max-w-2xl flex-col overflow-hidden rounded-xl border shadow-[0_20px_60px_-40px_rgba(0,0,0,0.35)]">
        <div className="flex items-start justify-between gap-4 border-b p-5">
          <div>
            <p className="text-primary text-xs font-bold tracking-[0.24em] uppercase">
              {state.mode === "create" ? "New Resource" : "Edit Resource"}
            </p>
            <h2 className="mt-1 text-2xl font-semibold">
              {state.mode === "create" ? "新增技术条目" : state.resource.name}
            </h2>
          </div>
          <Button size="icon-lg" variant="ghost" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <form onSubmit={submit} className="min-h-0 flex-1 overflow-y-auto p-5">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="resource-name">名称</FieldLabel>
              <Input
                id="resource-name"
                value={draft.name}
                onChange={(event) => setValue("name", event.target.value)}
                placeholder="例如 Next.js"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="resource-description">描述</FieldLabel>
              <Textarea
                id="resource-description"
                value={draft.description}
                onChange={(event) =>
                  setValue("description", event.target.value)
                }
                placeholder="说明这个工具适合什么场景"
                required
                className="min-h-28"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="resource-category">分类</FieldLabel>
                <select
                  id="resource-category"
                  value={draft.category}
                  onChange={(event) =>
                    setValue(
                      "category",
                      event.target.value as TechResourceCategory,
                    )
                  }
                  className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-10 rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"
                >
                  {TECH_RESOURCE_CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field>
                <FieldLabel htmlFor="resource-level">类型</FieldLabel>
                <select
                  id="resource-level"
                  value={draft.level}
                  onChange={(event) =>
                    setValue("level", event.target.value as TechResourceLevel)
                  }
                  className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-10 rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"
                >
                  {TECH_RESOURCE_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </Field>
              <Field>
                <FieldLabel htmlFor="resource-status">状态</FieldLabel>
                <select
                  id="resource-status"
                  value={draft.status}
                  onChange={(event) =>
                    setValue("status", event.target.value as TechResourceStatus)
                  }
                  className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 h-10 rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"
                >
                  {TECH_RESOURCE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status === "published" ? "发布" : "草稿"}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="resource-url">官网 URL</FieldLabel>
              <Input
                id="resource-url"
                type="url"
                value={draft.url}
                onChange={(event) => setValue("url", event.target.value)}
                placeholder="https://example.com"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="resource-docs-url">文档 URL</FieldLabel>
              <Input
                id="resource-docs-url"
                type="url"
                value={draft.docsUrl}
                onChange={(event) => setValue("docsUrl", event.target.value)}
                placeholder="https://example.com/docs"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="resource-tags">标签</FieldLabel>
              <Input
                id="resource-tags"
                value={draft.tags}
                onChange={(event) => setValue("tags", event.target.value)}
                placeholder="React, SSR, Full-stack"
              />
            </Field>
            <div className="bg-muted/30 flex items-start gap-3 rounded-xl border p-3 text-sm">
              <input
                id="resource-featured"
                type="checkbox"
                aria-label="精选展示"
                checked={draft.featured}
                onChange={(event) => setValue("featured", event.target.checked)}
                className="mt-1"
              />
              <span>
                <span className="block font-bold">精选展示</span>
                <span className="text-muted-foreground">
                  精选条目会出现在技术导航首屏，当前规则允许创建者自行设置。
                </span>
              </span>
            </div>
            {error ? <FieldError>{error}</FieldError> : null}
          </FieldGroup>

          <div className="mt-6 flex flex-wrap justify-between gap-2 border-t pt-5">
            {state.mode === "edit" ? (
              <Button
                type="button"
                variant="destructive"
                disabled={isDeleting || isSaving}
                onClick={() => {
                  if (!window.confirm("确定删除这个技术条目吗？")) return
                  deleteMutation.mutate({ resourceId: state.resource.id })
                }}
              >
                {isDeleting ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Trash className="size-4" />
                )}
                删除
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="min-w-20"
                onClick={onClose}
              >
                取消
              </Button>
              <Button
                type="submit"
                className="min-w-24"
                disabled={isSaving || isDeleting}
              >
                {isSaving ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : null}
                {state.mode === "create" ? "创建" : "保存"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function EmptyResourceState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string
  description: string
  actionHref: string
  actionLabel: string
}) {
  return (
    <div className="bg-muted/25 grid min-h-72 place-items-center rounded-xl border border-dashed p-8 text-center">
      <div>
        <div className="bg-primary/12 text-primary mx-auto flex size-12 items-center justify-center rounded-xl">
          <LibraryBig className="size-6" />
        </div>
        <h3 className="mt-4 text-xl font-semibold">{title}</h3>
        <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm leading-6">
          {description}
        </p>
        <Button
          className="mt-5"
          nativeButton={false}
          render={<Link href={actionHref} />}
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  )
}
