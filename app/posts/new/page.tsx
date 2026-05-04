import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"

import { PostEditor } from "../_components/post-editor"

export default async function NewPostPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect("/sign-in")

  return (
    <div className="space-y-5">
      <section>
        <p className="text-primary text-xs font-bold tracking-[0.24em] uppercase">
          Writing Studio
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">
          写新文章
        </h1>
      </section>
      <PostEditor />
    </div>
  )
}
