import { Edit3, PenLine, Plus } from "lucide-react"
import { headers } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import { caller } from "@/trpc/server"

import { PostCard } from "../_components/post-card"

export default async function MyPostsPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect("/sign-in")

  const posts = await caller.post.myList()

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-primary text-xs font-bold tracking-[0.24em] uppercase">
            Writing
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">我的文章</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
            管理你发布过的文章和草稿。
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/posts/new" />}>
          <PenLine className="size-4" />
          写新文章
        </Button>
      </section>

      {posts.length > 0 ? (
        <section className="grid gap-3 lg:grid-cols-2">
          {posts.map((post) => (
            <div key={post.id} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Badge
                  variant={post.status === "published" ? "default" : "outline"}
                  className="rounded-full"
                >
                  {post.status === "published" ? "已发布" : "草稿"}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  nativeButton={false}
                  render={<Link href={`/posts/${post.id}/edit`} />}
                >
                  <Edit3 className="size-3.5" />
                  编辑
                </Button>
              </div>
              <PostCard post={post} />
            </div>
          ))}
        </section>
      ) : (
        <section className="bg-muted/50 rounded-lg border border-dashed p-8 text-center">
          <Plus className="text-muted-foreground mx-auto size-8" />
          <h2 className="mt-3 text-xl font-black">还没有文章</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            写下第一篇文章后，它会出现在这里。
          </p>
        </section>
      )}
    </div>
  )
}
