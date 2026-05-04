"use client"

import {
  BookMarked,
  Check,
  Copy,
  ExternalLink,
  Filter,
  Search,
  Sparkles,
} from "lucide-react"
import { useMemo, useState, useSyncExternalStore } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import {
  RESOURCE_CATEGORIES,
  type ResourceCategory,
  type TechResource,
} from "../_data/resources"

type ResourceFilter = ResourceCategory | "all" | "saved"

const SAVED_KEY = "lemon-space-saved-resources"

function readSavedResources() {
  if (typeof window === "undefined") return new Set<string>()

  try {
    const value = JSON.parse(window.localStorage.getItem(SAVED_KEY) ?? "[]")
    return new Set(Array.isArray(value) ? value.filter(Boolean) : [])
  } catch {
    return new Set<string>()
  }
}

function getSavedSnapshot() {
  return JSON.stringify(Array.from(readSavedResources()).sort())
}

function subscribeToSavedResources(callback: () => void) {
  window.addEventListener("storage", callback)
  window.addEventListener(SAVED_KEY, callback)

  return () => {
    window.removeEventListener("storage", callback)
    window.removeEventListener(SAVED_KEY, callback)
  }
}

export function ResourceExplorer({ resources }: { resources: TechResource[] }) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<ResourceFilter>("all")
  const savedSnapshot = useSyncExternalStore(
    subscribeToSavedResources,
    getSavedSnapshot,
    () => "[]",
  )
  const saved = useMemo(
    () => new Set(JSON.parse(savedSnapshot) as string[]),
    [savedSnapshot],
  )

  const featured = resources.filter((item) => item.featured).slice(0, 4)
  const normalizedQuery = query.trim().toLowerCase()
  const visibleResources = useMemo(() => {
    return resources.filter((resource) => {
      if (filter === "saved" && !saved.has(resource.id)) return false
      if (
        filter !== "all" &&
        filter !== "saved" &&
        resource.category !== filter
      )
        return false
      if (!normalizedQuery) return true

      const haystack = [
        resource.name,
        resource.description,
        resource.level,
        resource.category,
        ...resource.tags,
      ]
        .join(" ")
        .toLowerCase()

      return haystack.includes(normalizedQuery)
    })
  }, [filter, normalizedQuery, resources, saved])

  const toggleSaved = (id: string) => {
    const next = new Set(saved)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    window.localStorage.setItem(SAVED_KEY, JSON.stringify(Array.from(next)))
    window.dispatchEvent(new Event(SAVED_KEY))
  }

  const copyResource = async (resource: TechResource) => {
    await navigator.clipboard.writeText(resource.docsUrl ?? resource.url)
    toast.success("链接已复制")
  }

  return (
    <div className="space-y-5">
      <section className="bg-card min-w-0 rounded-lg border p-4 shadow-sm sm:p-5">
        <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <p className="text-primary flex items-center gap-2 text-xs font-bold tracking-[0.24em] uppercase">
              <Sparkles className="size-3.5" />
              Developer Directory
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              技术导航
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
              按场景整理常用框架、工具和文档入口，适合开发时快速检索和沉淀。
            </p>
          </div>
          <div className="bg-muted/40 min-w-0 rounded-lg border p-3">
            <div className="text-muted-foreground flex items-center gap-2 text-xs font-semibold">
              <Filter className="size-4" />
              当前收录
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-2xl font-black">{resources.length}</p>
                <p className="text-muted-foreground text-xs">条目</p>
              </div>
              <div>
                <p className="text-2xl font-black">
                  {RESOURCE_CATEGORIES.length - 2}
                </p>
                <p className="text-muted-foreground text-xs">分类</p>
              </div>
              <div>
                <p className="text-2xl font-black">{saved.size}</p>
                <p className="text-muted-foreground text-xs">收藏</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid min-w-0 gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="min-w-0 space-y-3 lg:sticky lg:top-20 lg:self-start">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索 React、测试、数据库..."
              className="pl-9"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
            {RESOURCE_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setFilter(category.id)}
                className={cn(
                  "min-w-0 rounded-lg border px-3 py-2 text-left transition",
                  filter === category.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "bg-card hover:bg-muted/60",
                )}
              >
                <span className="block text-sm font-bold">
                  {category.label}
                </span>
                <span className="text-muted-foreground mt-0.5 block truncate text-xs">
                  {category.description}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <div className="min-w-0 space-y-4">
          {filter === "all" && !normalizedQuery ? (
            <section className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {featured.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  compact
                  resource={resource}
                  saved={saved.has(resource.id)}
                  onCopy={copyResource}
                  onToggleSaved={toggleSaved}
                />
              ))}
            </section>
          ) : null}

          <section className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibleResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                saved={saved.has(resource.id)}
                onCopy={copyResource}
                onToggleSaved={toggleSaved}
              />
            ))}
          </section>

          {visibleResources.length === 0 ? (
            <div className="bg-muted/40 rounded-lg border border-dashed p-8 text-center">
              <p className="text-lg font-black">没有匹配的技术条目</p>
              <p className="text-muted-foreground mt-2 text-sm">
                换个关键词，或回到全部分类继续浏览。
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}

function ResourceCard({
  compact = false,
  resource,
  saved,
  onCopy,
  onToggleSaved,
}: {
  compact?: boolean
  resource: TechResource
  saved: boolean
  onCopy: (resource: TechResource) => void
  onToggleSaved: (id: string) => void
}) {
  return (
    <article
      className={cn(
        "bg-card group flex min-h-48 min-w-0 flex-col overflow-hidden rounded-lg border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg",
        compact ? "border-primary/25 bg-primary/5" : null,
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="bg-hero text-hero-foreground flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-black">
            {resource.name.slice(0, 2)}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-base font-black">{resource.name}</h2>
            <p className="text-muted-foreground text-xs">{resource.level}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onToggleSaved(resource.id)}
          aria-label={saved ? "取消收藏" : "收藏"}
          className={cn(
            "rounded-lg p-2 transition",
            saved
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {saved ? (
            <Check className="size-4" />
          ) : (
            <BookMarked className="size-4" />
          )}
        </button>
      </div>

      <p className="text-muted-foreground mt-3 line-clamp-3 text-sm leading-6">
        {resource.description}
      </p>

      <div className="mt-3 flex min-w-0 flex-wrap gap-1.5">
        {resource.tags.slice(0, 3).map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="max-w-full truncate rounded-full"
          >
            {tag}
          </Badge>
        ))}
      </div>

      <div className="mt-auto flex min-w-0 items-center gap-2 pt-4">
        <Button
          size="sm"
          className="min-w-0 flex-1"
          nativeButton={false}
          render={
            <a
              href={resource.docsUrl ?? resource.url}
              target="_blank"
              rel="noreferrer"
            />
          }
        >
          <span className="truncate">打开文档</span>
          <ExternalLink className="size-3.5" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          aria-label={`复制 ${resource.name} 链接`}
          onClick={() => onCopy(resource)}
        >
          <Copy className="size-3.5" />
        </Button>
      </div>
    </article>
  )
}
