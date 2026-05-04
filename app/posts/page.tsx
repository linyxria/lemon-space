import { PenLine, Plus, Sparkles } from "lucide-react"
import { headers } from "next/headers"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import { caller } from "@/trpc/server"

import { PostCard } from "./_components/post-card"
import { PostSearch } from "./_components/post-search"

export default async function PostHomePage({
  searchParams,
}: {
  searchParams: Promise<{
    tag?: string
    q?: string
  }>
}) {
  const [{ tag, q }, session] = await Promise.all([
    searchParams,
    auth.api.getSession({ headers: await headers() }),
  ])
  const [{ items }, tags, featured] = await Promise.all([
    caller.post.list({ tag, q, limit: 18 }),
    caller.post.tags(),
    caller.post.featured(),
  ])
  const heroPost = featured[0] ?? items[0]
  const secondaryPosts = items.filter((post) => post.id !== heroPost?.id)
  const hasFilters = Boolean(tag || q)

  return (
    <div className="space-y-8">
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="bg-hero text-hero-foreground rounded-lg border px-6 py-8 md:px-8 md:py-10">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full">
              <Sparkles className="size-3.5" />
              Lemon Space
            </Badge>
            {hasFilters ? (
              <Badge variant="secondary" className="rounded-full">
                已筛选
              </Badge>
            ) : null}
          </div>
          <h1 className="mt-5 max-w-2xl text-4xl font-black tracking-tighter md:text-5xl">
            文章与灵感的个人空间
          </h1>
          <p className="text-hero-muted mt-4 max-w-xl text-base leading-7">
            记录想法、教程和项目复盘；画廊独立保存视觉参考。
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {session ? (
              <Button nativeButton={false} render={<Link href="/posts/new" />}>
                <PenLine className="size-4" />
                写新文章
              </Button>
            ) : (
              <Button nativeButton={false} render={<Link href="/sign-in" />}>
                登录后写作
              </Button>
            )}
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/gallery" />}
              className="bg-background/10 text-hero-foreground hover:bg-background/20 hover:text-hero-foreground"
            >
              查看画廊
            </Button>
          </div>
        </div>

        <aside className="bg-card rounded-lg border p-5">
          <h2 className="text-lg font-black">探索文章</h2>
          <div className="mt-4">
            <PostSearch keyword={q} tag={tag} />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge
              variant={!tag ? "default" : "outline"}
              render={
                <Link
                  href={q ? `/posts?q=${encodeURIComponent(q)}` : "/posts"}
                />
              }
              className="rounded-full"
            >
              全部
            </Badge>
            {tags.map((item) => (
              <Badge
                key={item.id}
                variant={tag === item.slug ? "default" : "outline"}
                render={
                  <Link
                    href={`/posts?tag=${item.slug}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                  />
                }
                className="rounded-full"
              >
                {item.name}
              </Badge>
            ))}
          </div>
        </aside>
      </section>

      {heroPost ? (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-primary text-xs font-bold tracking-[0.24em] uppercase">
                Latest Essay
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.03em]">
                最近文章
              </h2>
            </div>
          </div>
          <PostCard post={heroPost} featured />
        </section>
      ) : (
        <section className="bg-muted/50 rounded-lg border border-dashed p-8 text-center">
          <Plus className="text-muted-foreground mx-auto size-8" />
          <h2 className="mt-3 text-xl font-black">还没有文章</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            登录后发布第一篇文章，这里就会成为你的文章主页。
          </p>
        </section>
      )}

      {secondaryPosts.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {secondaryPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </section>
      ) : null}
    </div>
  )
}
