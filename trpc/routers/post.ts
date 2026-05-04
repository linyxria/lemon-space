import { TRPCError } from '@trpc/server'
import { and, desc, eq, exists, ilike, inArray, or, sql } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { nanoid } from 'nanoid'
import { z } from 'zod'

import type * as schema from '@/db/schema'
import {
  post,
  postBookmark,
  postLike,
  postTag,
  postTagLink,
  user,
} from '@/db/schema'
import { chineseSlugify } from '@/lib/utils'

import { procedure, protectedProcedure, router } from '../init'
import { mapUserImageToUrl } from './shared'

const postStatusSchema = z.enum(['draft', 'published'])
const tagListSchema = z.array(z.string().trim().min(1).max(32)).max(8)

const postInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  excerpt: z.string().trim().min(1).max(280),
  coverImageUrl: z.string().trim().url().max(500).optional().or(z.literal('')),
  content: z.string().trim().min(20),
  contentJson: z.record(z.string(), z.unknown()).optional().nullable(),
  status: postStatusSchema.default('draft'),
  tags: tagListSchema.default([]),
})

const postIdSchema = z.object({
  postId: z.string().trim().min(1),
})

type Database = PostgresJsDatabase<typeof schema>
type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0]

function normalizeTags(tags: string[]) {
  return Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)))
}

function estimateReadingTime(content: string) {
  const cjkCount = (content.match(/[\u4e00-\u9fff]/g) ?? []).length
  const wordCount = (
    content.replace(/[\u4e00-\u9fff]/g, ' ').match(/\S+/g) ?? []
  ).length

  return Math.max(1, Math.ceil((cjkCount + wordCount) / 420))
}

async function attachTags<T extends { id: string }>(db: Database, posts: T[]) {
  if (posts.length === 0) return posts.map((post) => ({ ...post, tags: [] }))

  const tagRows = await db
    .select({
      postId: postTagLink.postId,
      id: postTag.id,
      name: postTag.name,
      slug: postTag.slug,
    })
    .from(postTagLink)
    .innerJoin(postTag, eq(postTagLink.tagId, postTag.id))
    .where(
      inArray(
        postTagLink.postId,
        posts.map((post) => post.id),
      ),
    )

  const tagsByPost = new Map<
    string,
    Array<{ id: string; name: string; slug: string }>
  >()

  for (const row of tagRows) {
    const tags = tagsByPost.get(row.postId) ?? []
    tags.push({ id: row.id, name: row.name, slug: row.slug })
    tagsByPost.set(row.postId, tags)
  }

  return posts.map((post) => ({
    ...post,
    tags: tagsByPost.get(post.id) ?? [],
  }))
}

async function savePostTags({
  tx,
  postId,
  userId,
  tags,
}: {
  tx: Transaction
  postId: string
  userId: string
  tags: string[]
}) {
  const normalizedTags = normalizeTags(tags)

  await tx.delete(postTagLink).where(eq(postTagLink.postId, postId))

  if (normalizedTags.length === 0) return

  const insertedTags = await tx
    .insert(postTag)
    .values(
      normalizedTags.map((name) => ({
        name,
        slug: chineseSlugify(name) || nanoid(8),
        creatorId: userId,
      })),
    )
    .onConflictDoUpdate({
      target: postTag.slug,
      set: { slug: postTag.slug },
    })
    .returning({ id: postTag.id })

  await tx.insert(postTagLink).values(
    insertedTags.map(({ id }) => ({
      postId,
      tagId: id,
    })),
  )
}

export const postRouter = router({
  list: procedure
    .input(
      z.object({
        tag: z.string().trim().min(1).optional(),
        q: z.string().trim().min(1).optional(),
        limit: z.number().int().min(1).max(30).default(12),
        cursor: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const posts = await ctx.db
        .select({
          id: post.id,
          title: post.title,
          excerpt: post.excerpt,
          coverImageUrl: post.coverImageUrl,
          readingTime: post.readingTime,
          viewCount: post.viewCount,
          publishedAt: post.publishedAt,
          likeCount: sql<number>`(
            select count(*) from ${postLike}
            where ${postLike.postId} = ${post.id}
          )`.mapWith(Number),
          bookmarkCount: sql<number>`(
            select count(*) from ${postBookmark}
            where ${postBookmark.postId} = ${post.id}
          )`.mapWith(Number),
          author: {
            id: user.id,
            name: user.name,
            image: user.image,
          },
        })
        .from(post)
        .innerJoin(user, eq(post.authorId, user.id))
        .where(
          and(
            eq(post.status, 'published'),
            input.tag
              ? exists(
                  ctx.db
                    .select()
                    .from(postTagLink)
                    .innerJoin(postTag, eq(postTagLink.tagId, postTag.id))
                    .where(
                      and(
                        eq(postTagLink.postId, post.id),
                        eq(postTag.slug, input.tag),
                      ),
                    ),
                )
              : undefined,
            input.q
              ? or(
                  ilike(post.title, `%${input.q}%`),
                  ilike(post.excerpt, `%${input.q}%`),
                  ilike(post.content, `%${input.q}%`),
                )
              : undefined,
          ),
        )
        .orderBy(desc(post.publishedAt), desc(post.createdAt))
        .offset(input.cursor)
        .limit(input.limit + 1)

      const hasMore = posts.length > input.limit
      const slice = hasMore ? posts.slice(0, input.limit) : posts

      return {
        items: (await attachTags(ctx.db, slice)).map((post) => ({
          ...post,
          author: mapUserImageToUrl(post.author),
        })),
        nextCursor: hasMore ? input.cursor + input.limit : undefined,
      }
    }),
  featured: procedure.query(async ({ ctx }) => {
    const posts = await ctx.db
      .select({
        id: post.id,
        title: post.title,
        excerpt: post.excerpt,
        coverImageUrl: post.coverImageUrl,
        readingTime: post.readingTime,
        viewCount: post.viewCount,
        publishedAt: post.publishedAt,
        likeCount: sql<number>`(
          select count(*) from ${postLike}
          where ${postLike.postId} = ${post.id}
        )`.mapWith(Number),
        bookmarkCount: sql<number>`(
          select count(*) from ${postBookmark}
          where ${postBookmark.postId} = ${post.id}
        )`.mapWith(Number),
      })
      .from(post)
      .where(eq(post.status, 'published'))
      .orderBy(desc(post.publishedAt), desc(post.createdAt))
      .limit(3)

    return attachTags(ctx.db, posts)
  }),
  tags: procedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: postTag.id,
        name: postTag.name,
        slug: postTag.slug,
        postCount: sql<number>`count(${postTagLink.postId})`.mapWith(Number),
      })
      .from(postTag)
      .innerJoin(postTagLink, eq(postTag.id, postTagLink.tagId))
      .innerJoin(post, eq(postTagLink.postId, post.id))
      .where(eq(post.status, 'published'))
      .groupBy(postTag.id)
      .orderBy(desc(sql`count(${postTagLink.postId})`), postTag.name)
  }),
  byId: procedure
    .input(z.object({ id: z.string().trim().min(1) }))
    .query(async ({ ctx, input }) => {
      const [postRecord] = await ctx.db
        .select({
          id: post.id,
          title: post.title,
          excerpt: post.excerpt,
          coverImageUrl: post.coverImageUrl,
          content: post.content,
          contentJson: post.contentJson,
          status: post.status,
          readingTime: post.readingTime,
          viewCount: post.viewCount,
          publishedAt: post.publishedAt,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          authorId: post.authorId,
          author: {
            id: user.id,
            name: user.name,
            image: user.image,
          },
          likeCount: sql<number>`(
            select count(*) from ${postLike}
            where ${postLike.postId} = ${post.id}
          )`.mapWith(Number),
          bookmarkCount: sql<number>`(
            select count(*) from ${postBookmark}
            where ${postBookmark.postId} = ${post.id}
          )`.mapWith(Number),
          ...(ctx.session
            ? {
                likedByMe: sql<boolean>`exists(
                  select 1 from ${postLike}
                  where ${postLike.postId} = ${post.id}
                  and ${postLike.userId} = ${ctx.session.user.id}
                )`,
                bookmarkedByMe: sql<boolean>`exists(
                  select 1 from ${postBookmark}
                  where ${postBookmark.postId} = ${post.id}
                  and ${postBookmark.userId} = ${ctx.session.user.id}
                )`,
              }
            : {}),
        })
        .from(post)
        .innerJoin(user, eq(post.authorId, user.id))
        .where(eq(post.id, input.id))
        .limit(1)

      if (
        !postRecord ||
        (postRecord.status !== 'published' &&
          postRecord.authorId !== ctx.session?.user.id)
      ) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' })
      }

      const [withTags] = await attachTags(ctx.db, [postRecord])

      return {
        ...withTags,
        author: mapUserImageToUrl(withTags.author),
        canEdit: postRecord.authorId === ctx.session?.user.id,
        likedByMe: Boolean('likedByMe' in withTags && withTags.likedByMe),
        bookmarkedByMe: Boolean(
          'bookmarkedByMe' in withTags && withTags.bookmarkedByMe,
        ),
      }
    }),
  myList: protectedProcedure.query(async ({ ctx }) => {
    const posts = await ctx.db
      .select({
        id: post.id,
        title: post.title,
        excerpt: post.excerpt,
        coverImageUrl: post.coverImageUrl,
        status: post.status,
        readingTime: post.readingTime,
        viewCount: post.viewCount,
        publishedAt: post.publishedAt,
        updatedAt: post.updatedAt,
        likeCount: sql<number>`(
          select count(*) from ${postLike}
          where ${postLike.postId} = ${post.id}
        )`.mapWith(Number),
        bookmarkCount: sql<number>`(
          select count(*) from ${postBookmark}
          where ${postBookmark.postId} = ${post.id}
        )`.mapWith(Number),
      })
      .from(post)
      .where(eq(post.authorId, ctx.user.id))
      .orderBy(desc(post.updatedAt), desc(post.createdAt))

    return attachTags(ctx.db, posts)
  }),
  likedList: protectedProcedure.query(async ({ ctx }) => {
    const posts = await ctx.db
      .select({
        id: post.id,
        title: post.title,
        excerpt: post.excerpt,
        coverImageUrl: post.coverImageUrl,
        readingTime: post.readingTime,
        viewCount: post.viewCount,
        publishedAt: post.publishedAt,
        likeCount: sql<number>`(
          select count(*) from ${postLike}
          where ${postLike.postId} = ${post.id}
        )`.mapWith(Number),
        bookmarkCount: sql<number>`(
          select count(*) from ${postBookmark}
          where ${postBookmark.postId} = ${post.id}
        )`.mapWith(Number),
      })
      .from(postLike)
      .innerJoin(post, eq(postLike.postId, post.id))
      .where(
        and(eq(postLike.userId, ctx.user.id), eq(post.status, 'published')),
      )
      .orderBy(desc(postLike.createdAt))

    return attachTags(ctx.db, posts)
  }),
  create: protectedProcedure
    .input(postInputSchema)
    .mutation(async ({ ctx, input }) => {
      const now = new Date()

      const [createdPost] = await ctx.db.transaction(async (tx) => {
        const [createdPost] = await tx
          .insert(post)
          .values({
            authorId: ctx.user.id,
            title: input.title,
            excerpt: input.excerpt,
            coverImageUrl: input.coverImageUrl || null,
            content: input.content,
            contentJson: input.contentJson ?? null,
            status: input.status,
            readingTime: estimateReadingTime(input.content),
            publishedAt: input.status === 'published' ? now : null,
          })
          .returning({ id: post.id })

        await savePostTags({
          tx,
          postId: createdPost.id,
          userId: ctx.user.id,
          tags: input.tags,
        })

        return [createdPost]
      })

      return createdPost
    }),
  update: protectedProcedure
    .input(postInputSchema.extend({ postId: z.string().trim().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [existingPost] = await ctx.db
        .select({
          id: post.id,
          authorId: post.authorId,
          status: post.status,
          publishedAt: post.publishedAt,
        })
        .from(post)
        .where(eq(post.id, input.postId))
        .limit(1)

      if (!existingPost || existingPost.authorId !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' })
      }

      const [updatedPost] = await ctx.db.transaction(async (tx) => {
        const [updatedPost] = await tx
          .update(post)
          .set({
            title: input.title,
            excerpt: input.excerpt,
            coverImageUrl: input.coverImageUrl || null,
            content: input.content,
            contentJson: input.contentJson ?? null,
            status: input.status,
            readingTime: estimateReadingTime(input.content),
            publishedAt:
              input.status === 'published'
                ? (existingPost.publishedAt ?? new Date())
                : null,
            updatedAt: new Date(),
          })
          .where(and(eq(post.id, input.postId), eq(post.authorId, ctx.user.id)))
          .returning({ id: post.id })

        await savePostTags({
          tx,
          postId: updatedPost.id,
          userId: ctx.user.id,
          tags: input.tags,
        })

        return [updatedPost]
      })

      return updatedPost
    }),
  delete: protectedProcedure
    .input(postIdSchema)
    .mutation(async ({ ctx, input }) => {
      const [deletedPost] = await ctx.db
        .delete(post)
        .where(and(eq(post.id, input.postId), eq(post.authorId, ctx.user.id)))
        .returning({ id: post.id })

      if (!deletedPost) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' })
      }

      return { success: true }
    }),
  toggleLike: protectedProcedure
    .input(postIdSchema)
    .mutation(async ({ ctx, input }) => {
      const [existingLike] = await ctx.db
        .select({ postId: postLike.postId })
        .from(postLike)
        .where(
          and(
            eq(postLike.postId, input.postId),
            eq(postLike.userId, ctx.user.id),
          ),
        )
        .limit(1)

      if (existingLike) {
        await ctx.db
          .delete(postLike)
          .where(
            and(
              eq(postLike.postId, input.postId),
              eq(postLike.userId, ctx.user.id),
            ),
          )
      } else {
        await ctx.db.insert(postLike).values({
          postId: input.postId,
          userId: ctx.user.id,
        })
      }

      const [countRow] = await ctx.db
        .select({
          likeCount: sql<number>`count(*)`.mapWith(Number),
        })
        .from(postLike)
        .where(eq(postLike.postId, input.postId))

      return {
        likedByMe: !existingLike,
        likeCount: countRow?.likeCount ?? 0,
      }
    }),
  toggleBookmark: protectedProcedure
    .input(postIdSchema)
    .mutation(async ({ ctx, input }) => {
      const [existingBookmark] = await ctx.db
        .select({ postId: postBookmark.postId })
        .from(postBookmark)
        .where(
          and(
            eq(postBookmark.postId, input.postId),
            eq(postBookmark.userId, ctx.user.id),
          ),
        )
        .limit(1)

      if (existingBookmark) {
        await ctx.db
          .delete(postBookmark)
          .where(
            and(
              eq(postBookmark.postId, input.postId),
              eq(postBookmark.userId, ctx.user.id),
            ),
          )
      } else {
        await ctx.db.insert(postBookmark).values({
          postId: input.postId,
          userId: ctx.user.id,
        })
      }

      const [countRow] = await ctx.db
        .select({
          bookmarkCount: sql<number>`count(*)`.mapWith(Number),
        })
        .from(postBookmark)
        .where(eq(postBookmark.postId, input.postId))

      return {
        bookmarkedByMe: !existingBookmark,
        bookmarkCount: countRow?.bookmarkCount ?? 0,
      }
    }),
  recordView: procedure.input(postIdSchema).mutation(async ({ ctx, input }) => {
    const [updatedPost] = await ctx.db
      .update(post)
      .set({ viewCount: sql`${post.viewCount} + 1` })
      .where(and(eq(post.id, input.postId), eq(post.status, 'published')))
      .returning({ viewCount: post.viewCount })

    return {
      viewCount: updatedPost?.viewCount,
    }
  }),
})
