import { Bookmark, Clock3, Eye, Heart } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type PostCardData = {
  id: string
  title: string
  excerpt: string
  coverImageUrl: string | null
  readingTime: number
  viewCount: number
  likeCount: number
  bookmarkCount: number
  publishedAt: Date | null
  tags: Array<{ id: string; name: string; slug: string }>
}

export function PostCard({
  post,
  featured = false,
}: {
  post: PostCardData
  featured?: boolean
}) {
  return (
    <article
      className={cn(
        'group border-border bg-card overflow-hidden rounded-lg border transition hover:-translate-y-0.5 hover:shadow-xl',
        'grid',
        featured
          ? 'min-h-36 grid-cols-[120px_minmax(0,1fr)] md:grid-cols-[160px_minmax(0,1fr)]'
          : 'min-h-24 grid-cols-[88px_minmax(0,1fr)]',
      )}
    >
      <Link
        href={`/posts/${post.id}`}
        className={cn(
          'bg-muted relative block overflow-hidden',
          'min-h-full',
        )}
      >
        {post.coverImageUrl ? (
          <span
            role="img"
            aria-label={post.title}
            className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url(${post.coverImageUrl})` }}
          />
        ) : (
          <div className="from-primary/20 via-background to-muted absolute inset-0 bg-linear-to-br" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/45 via-black/5 to-transparent" />
      </Link>

      <div
        className={cn('flex min-w-0 flex-col', featured ? 'p-4' : 'p-2.5')}
      >
        <div className="flex flex-wrap gap-1.5">
          {post.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              render={<Link href={`/posts?tag=${tag.slug}`} />}
              className={cn('rounded-full px-2 py-0 text-[11px]')}
            >
              {tag.name}
            </Badge>
          ))}
        </div>

        <h2
          className={cn(
            'font-black tracking-[-0.03em]',
            featured ? 'line-clamp-1 text-xl md:text-2xl' : 'line-clamp-1 text-base',
            post.tags.length > 0 ? 'mt-2' : 'mt-0',
          )}
        >
          <Link href={`/posts/${post.id}`} className="hover:text-primary">
            {post.title}
          </Link>
        </h2>

        <p
          className={cn(
            'text-muted-foreground mt-1.5 text-sm',
            featured ? 'line-clamp-2 leading-5' : 'line-clamp-1 leading-5',
          )}
        >
          {post.excerpt}
        </p>

        <div
          className={cn(
            'text-muted-foreground mt-auto flex flex-wrap items-center text-xs',
            'gap-2.5 pt-2',
          )}
        >
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="size-3.5" />
            {post.readingTime} 分钟阅读
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Eye className="size-3.5" />
            {post.viewCount}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Heart className="size-3.5" />
            {post.likeCount}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Bookmark className="size-3.5" />
            {post.bookmarkCount}
          </span>
        </div>
      </div>
    </article>
  )
}
