import { CalendarDays, Edit3 } from 'lucide-react'
import { headers } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { MarkdownRenderer } from '@/components/post/markdown-renderer'
import { RichTextRenderer } from '@/components/post/rich-text-renderer'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { auth } from '@/lib/auth'
import { caller } from '@/trpc/server'

import { PostActions } from '../_components/post-actions'

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [post, session] = await Promise.all([
    caller.post.byId({ id }).catch(() => null),
    auth.api.getSession({ headers: await headers() }),
  ])

  if (!post) notFound()

  return (
    <article className="mx-auto max-w-4xl space-y-7">
      <header className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              render={<Link href={`/posts?tag=${tag.slug}`} />}
              className="rounded-full"
            >
              {tag.name}
            </Badge>
          ))}
          {post.status === 'draft' ? (
            <Badge variant="outline" className="rounded-full">
              草稿
            </Badge>
          ) : null}
        </div>
        <h1 className="text-4xl font-black tracking-tighter md:text-6xl">
          {post.title}
        </h1>
        <p className="text-muted-foreground text-lg leading-8">
          {post.excerpt}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-4 border-y py-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarImage src={post.author.image ?? undefined} />
              <AvatarFallback>
                {post.author.name?.slice(0, 1) ?? 'L'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{post.author.name}</p>
              <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <CalendarDays className="size-3.5" />
                {post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString('zh-CN')
                  : '尚未发布'}
                <span>·</span>
                {post.readingTime} 分钟阅读
              </p>
            </div>
          </div>
          {post.canEdit ? (
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={`/posts/${post.id}/edit`} />}
            >
              <Edit3 className="size-4" />
              编辑
            </Button>
          ) : null}
        </div>
        <PostActions
          postId={post.id}
          canInteract={Boolean(session)}
          initialLiked={post.likedByMe}
          initialBookmarked={post.bookmarkedByMe}
          initialLikeCount={post.likeCount}
          initialBookmarkCount={post.bookmarkCount}
          initialViewCount={post.viewCount}
          published={post.status === 'published'}
        />
      </header>

      {post.coverImageUrl ? (
        <div className="relative aspect-video overflow-hidden rounded-lg border">
          <span
            role="img"
            aria-label={post.title}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${post.coverImageUrl})` }}
          />
        </div>
      ) : null}

      {post.contentJson ? (
        <RichTextRenderer content={post.contentJson} />
      ) : (
        <MarkdownRenderer content={post.content} />
      )}
    </article>
  )
}
