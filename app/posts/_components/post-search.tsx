"use client"

import { useRouter } from "@bprogress/next/app"
import { Search, X } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function PostSearch({
  keyword,
  tag,
}: {
  keyword?: string
  tag?: string
}) {
  const router = useRouter()
  const [value, setValue] = useState(keyword ?? "")

  const handleSubmit = (event: React.ChangeEvent<HTMLFormElement>) => {
    event.preventDefault()
    const params = new URLSearchParams()
    const nextKeyword = value.trim()

    if (nextKeyword) params.set("q", nextKeyword)
    if (tag) params.set("tag", tag)

    router.push(params.toString() ? `/posts?${params}` : "/posts")
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full gap-2">
      <div className="relative flex-1">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="搜索文章标题、摘要或正文"
          className="h-10 rounded-lg pr-9 pl-9"
        />
        {value ? (
          <button
            type="button"
            onClick={() => setValue("")}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
            aria-label="清除搜索"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
      <Button type="submit" className="h-10 px-4">
        搜索
      </Button>
    </form>
  )
}
