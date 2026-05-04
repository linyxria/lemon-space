import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { caller } from "@/trpc/server"

import { PostEditor } from "../../_components/post-editor"

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect("/sign-in")

  const { id } = await params
  const post = await caller.post.byId({ id }).catch(() => null)

  if (!post || !post.canEdit) notFound()

  return (
    <div className="space-y-5">
      <section>
        <p className="text-primary text-xs font-bold tracking-[0.24em] uppercase">
          Writing Studio
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">
          编辑文章
        </h1>
      </section>
      <PostEditor post={post} />
    </div>
  )
}
