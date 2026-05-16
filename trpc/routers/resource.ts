import { TRPCError } from "@trpc/server"
import { and, desc, eq, exists, ilike, or, sql } from "drizzle-orm"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { nanoid } from "nanoid"
import z from "zod"

import type * as schema from "@/db/schema"
import {
  techResource,
  techResourceBookmark,
  techResourceTag,
  techResourceTagLink,
  user,
} from "@/db/schema"
import {
  TECH_RESOURCE_CATEGORIES,
  TECH_RESOURCE_LEVELS,
  TECH_RESOURCE_STATUSES,
  type TechResourceCategory,
  type TechResourceLevel,
} from "@/lib/tech-resources"
import { chineseSlugify } from "@/lib/utils"

import { procedure, protectedProcedure, router } from "../init"
import { mapUserImageToUrl } from "./shared"

type Database = PostgresJsDatabase<typeof schema>
type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0]

type ResourceTag = {
  id: string
  name: string
  slug: string
}

const resourceCategoryIds = TECH_RESOURCE_CATEGORIES.map(
  (category) => category.id,
) as [TechResourceCategory, ...TechResourceCategory[]]
const resourceLevelIds = TECH_RESOURCE_LEVELS as readonly [
  TechResourceLevel,
  ...TechResourceLevel[],
]

const resourceCategorySchema = z.enum(resourceCategoryIds)
const resourceLevelSchema = z.enum(resourceLevelIds)
const resourceStatusSchema = z.enum(TECH_RESOURCE_STATUSES)
const tagListSchema = z
  .array(z.string().trim().min(1).max(32))
  .max(8)
  .default([])

const resourceInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(360),
  category: resourceCategorySchema,
  level: resourceLevelSchema,
  url: z.string().trim().url().max(500),
  docsUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  tags: tagListSchema,
  featured: z.boolean().default(false),
  status: resourceStatusSchema.default("published"),
})

const resourceIdSchema = z.object({
  resourceId: z.string().trim().min(1),
})

function createResourceTagsAggExpr() {
  return sql<ResourceTag[]>`coalesce(
    json_agg(
      distinct jsonb_build_object(
        'id', ${techResourceTag.id},
        'name', ${techResourceTag.name},
        'slug', ${techResourceTag.slug}
      )
    ) filter (where ${techResourceTag.id} is not null),
    '[]'
  )`.as("tags")
}

function createBookmarkCountExpr() {
  return sql<number>`(
    select count(*) from ${techResourceBookmark}
    where ${techResourceBookmark.resourceId} = ${techResource.id}
  )`.mapWith(Number)
}

function normalizeTags(tags: string[]) {
  return Array.from(
    new Set(
      tags.flatMap((tag) => {
        const trimmed = tag.trim()
        return trimmed ? [trimmed] : []
      }),
    ),
  )
}

function cleanOptionalUrl(url: string | undefined) {
  return url?.trim() ? url.trim() : null
}

function createSlug(name: string) {
  return chineseSlugify(name) || nanoid(10)
}

async function saveResourceTags({
  tx,
  resourceId,
  userId,
  tags,
}: {
  tx: Transaction
  resourceId: string
  userId: string
  tags: string[]
}) {
  const normalizedTags = normalizeTags(tags)

  await tx
    .delete(techResourceTagLink)
    .where(eq(techResourceTagLink.resourceId, resourceId))

  if (normalizedTags.length === 0) return

  const insertedTags = await tx
    .insert(techResourceTag)
    .values(
      normalizedTags.map((name) => ({
        name,
        slug: createSlug(name),
        creatorId: userId,
      })),
    )
    .onConflictDoUpdate({
      target: techResourceTag.slug,
      set: { slug: techResourceTag.slug },
    })
    .returning({ id: techResourceTag.id })

  await tx.insert(techResourceTagLink).values(
    insertedTags.map(({ id }) => ({
      resourceId,
      tagId: id,
    })),
  )
}

function formatResource<
  T extends {
    creator: {
      id: string | null
      name: string | null
      image: string | null
    } | null
  },
>(item: T) {
  return {
    ...item,
    creator: item.creator?.id
      ? mapUserImageToUrl({
          id: item.creator.id,
          name: item.creator.name ?? "Lemon Space",
          image: item.creator.image,
        })
      : null,
  }
}

export const resourceRouter = router({
  list: procedure
    .input(
      z.object({
        category: resourceCategorySchema.optional(),
        tag: z.string().trim().min(1).optional(),
        q: z.string().trim().min(1).optional(),
        featured: z.boolean().optional(),
        limit: z.number().int().min(1).max(48).default(24),
        cursor: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const bookmarkCountExpr = createBookmarkCountExpr()

      const resources = await ctx.db
        .select({
          id: techResource.id,
          creatorId: techResource.creatorId,
          name: techResource.name,
          slug: techResource.slug,
          description: techResource.description,
          category: techResource.category,
          level: techResource.level,
          url: techResource.url,
          docsUrl: techResource.docsUrl,
          featured: techResource.featured,
          status: techResource.status,
          createdAt: techResource.createdAt,
          updatedAt: techResource.updatedAt,
          tags: createResourceTagsAggExpr(),
          bookmarkCount: bookmarkCountExpr,
          bookmarkedByMe: ctx.session
            ? sql<boolean>`exists(
                select 1 from ${techResourceBookmark}
                where ${techResourceBookmark.resourceId} = ${techResource.id}
                and ${techResourceBookmark.userId} = ${ctx.session.user.id}
              )`
            : sql<boolean>`false`,
          canEdit: ctx.session
            ? sql<boolean>`${techResource.creatorId} = ${ctx.session.user.id}`
            : sql<boolean>`false`,
          creator: {
            id: user.id,
            name: user.name,
            image: user.image,
          },
        })
        .from(techResource)
        .leftJoin(user, eq(techResource.creatorId, user.id))
        .leftJoin(
          techResourceTagLink,
          eq(techResource.id, techResourceTagLink.resourceId),
        )
        .leftJoin(
          techResourceTag,
          eq(techResourceTagLink.tagId, techResourceTag.id),
        )
        .where(
          and(
            eq(techResource.status, "published"),
            input.category
              ? eq(techResource.category, input.category)
              : undefined,
            input.featured !== undefined
              ? eq(techResource.featured, input.featured)
              : undefined,
            input.tag
              ? exists(
                  ctx.db
                    .select()
                    .from(techResourceTagLink)
                    .innerJoin(
                      techResourceTag,
                      eq(techResourceTagLink.tagId, techResourceTag.id),
                    )
                    .where(
                      and(
                        eq(techResourceTagLink.resourceId, techResource.id),
                        eq(techResourceTag.slug, input.tag),
                      ),
                    ),
                )
              : undefined,
            input.q
              ? or(
                  ilike(techResource.name, `%${input.q}%`),
                  ilike(techResource.description, `%${input.q}%`),
                  ilike(techResource.url, `%${input.q}%`),
                  exists(
                    ctx.db
                      .select()
                      .from(techResourceTagLink)
                      .innerJoin(
                        techResourceTag,
                        eq(techResourceTagLink.tagId, techResourceTag.id),
                      )
                      .where(
                        and(
                          eq(techResourceTagLink.resourceId, techResource.id),
                          ilike(techResourceTag.name, `%${input.q}%`),
                        ),
                      ),
                  ),
                )
              : undefined,
          ),
        )
        .groupBy(techResource.id, user.id)
        .orderBy(
          desc(techResource.featured),
          desc(bookmarkCountExpr),
          desc(techResource.updatedAt),
          desc(techResource.id),
        )
        .offset(input.cursor)
        .limit(input.limit + 1)

      const hasMore = resources.length > input.limit
      const slice = hasMore ? resources.slice(0, input.limit) : resources

      return {
        items: slice.map(formatResource),
        nextCursor: hasMore ? input.cursor + input.limit : undefined,
      }
    }),
  featured: procedure.query(async ({ ctx }) => {
    const bookmarkCountExpr = createBookmarkCountExpr()

    const [featuredResources, hotTags] = await Promise.all([
      ctx.db
        .select({
          id: techResource.id,
          creatorId: techResource.creatorId,
          name: techResource.name,
          slug: techResource.slug,
          description: techResource.description,
          category: techResource.category,
          level: techResource.level,
          url: techResource.url,
          docsUrl: techResource.docsUrl,
          featured: techResource.featured,
          status: techResource.status,
          createdAt: techResource.createdAt,
          updatedAt: techResource.updatedAt,
          tags: createResourceTagsAggExpr(),
          bookmarkCount: bookmarkCountExpr,
          bookmarkedByMe: ctx.session
            ? sql<boolean>`exists(
                select 1 from ${techResourceBookmark}
                where ${techResourceBookmark.resourceId} = ${techResource.id}
                and ${techResourceBookmark.userId} = ${ctx.session.user.id}
              )`
            : sql<boolean>`false`,
          canEdit: ctx.session
            ? sql<boolean>`${techResource.creatorId} = ${ctx.session.user.id}`
            : sql<boolean>`false`,
          creator: {
            id: user.id,
            name: user.name,
            image: user.image,
          },
        })
        .from(techResource)
        .leftJoin(user, eq(techResource.creatorId, user.id))
        .leftJoin(
          techResourceTagLink,
          eq(techResource.id, techResourceTagLink.resourceId),
        )
        .leftJoin(
          techResourceTag,
          eq(techResourceTagLink.tagId, techResourceTag.id),
        )
        .where(
          and(
            eq(techResource.status, "published"),
            eq(techResource.featured, true),
          ),
        )
        .groupBy(techResource.id, user.id)
        .orderBy(desc(bookmarkCountExpr), desc(techResource.updatedAt))
        .limit(5),
      ctx.db
        .select({
          id: techResourceTag.id,
          name: techResourceTag.name,
          slug: techResourceTag.slug,
          resourceCount:
            sql<number>`count(${techResourceTagLink.resourceId})`.mapWith(
              Number,
            ),
        })
        .from(techResourceTag)
        .innerJoin(
          techResourceTagLink,
          eq(techResourceTag.id, techResourceTagLink.tagId),
        )
        .innerJoin(
          techResource,
          eq(techResourceTagLink.resourceId, techResource.id),
        )
        .where(eq(techResource.status, "published"))
        .groupBy(techResourceTag.id)
        .orderBy(desc(sql`count(${techResourceTagLink.resourceId})`))
        .limit(10),
    ])

    return {
      featuredResources: featuredResources.map(formatResource),
      hotTags,
    }
  }),
  tags: procedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: techResourceTag.id,
        name: techResourceTag.name,
        slug: techResourceTag.slug,
        resourceCount:
          sql<number>`count(${techResourceTagLink.resourceId})`.mapWith(Number),
      })
      .from(techResourceTag)
      .innerJoin(
        techResourceTagLink,
        eq(techResourceTag.id, techResourceTagLink.tagId),
      )
      .innerJoin(
        techResource,
        eq(techResourceTagLink.resourceId, techResource.id),
      )
      .where(eq(techResource.status, "published"))
      .groupBy(techResourceTag.id)
      .orderBy(desc(sql`count(${techResourceTagLink.resourceId})`))
  }),
  categories: procedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        category: techResource.category,
        resourceCount: sql<number>`count(${techResource.id})`.mapWith(Number),
      })
      .from(techResource)
      .where(eq(techResource.status, "published"))
      .groupBy(techResource.category)

    const counts = new Map(rows.map((row) => [row.category, row.resourceCount]))

    return TECH_RESOURCE_CATEGORIES.map((category) => ({
      ...category,
      resourceCount: counts.get(category.id) ?? 0,
    }))
  }),
  bookmarked: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(48).default(24),
        cursor: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const bookmarkCountExpr = createBookmarkCountExpr()

      const resources = await ctx.db
        .select({
          id: techResource.id,
          creatorId: techResource.creatorId,
          name: techResource.name,
          slug: techResource.slug,
          description: techResource.description,
          category: techResource.category,
          level: techResource.level,
          url: techResource.url,
          docsUrl: techResource.docsUrl,
          featured: techResource.featured,
          status: techResource.status,
          createdAt: techResource.createdAt,
          updatedAt: techResource.updatedAt,
          tags: createResourceTagsAggExpr(),
          bookmarkCount: bookmarkCountExpr,
          bookmarkedByMe: sql<boolean>`true`,
          canEdit: sql<boolean>`${techResource.creatorId} = ${ctx.user.id}`,
          creator: {
            id: user.id,
            name: user.name,
            image: user.image,
          },
        })
        .from(techResourceBookmark)
        .innerJoin(
          techResource,
          eq(techResourceBookmark.resourceId, techResource.id),
        )
        .leftJoin(user, eq(techResource.creatorId, user.id))
        .leftJoin(
          techResourceTagLink,
          eq(techResource.id, techResourceTagLink.resourceId),
        )
        .leftJoin(
          techResourceTag,
          eq(techResourceTagLink.tagId, techResourceTag.id),
        )
        .where(
          and(
            eq(techResourceBookmark.userId, ctx.user.id),
            eq(techResource.status, "published"),
          ),
        )
        .groupBy(techResource.id, user.id, techResourceBookmark.createdAt)
        .orderBy(desc(techResourceBookmark.createdAt))
        .offset(input.cursor)
        .limit(input.limit + 1)

      const hasMore = resources.length > input.limit
      const slice = hasMore ? resources.slice(0, input.limit) : resources

      return {
        items: slice.map(formatResource),
        nextCursor: hasMore ? input.cursor + input.limit : undefined,
      }
    }),
  myList: protectedProcedure.query(async ({ ctx }) => {
    const bookmarkCountExpr = createBookmarkCountExpr()

    const resources = await ctx.db
      .select({
        id: techResource.id,
        creatorId: techResource.creatorId,
        name: techResource.name,
        slug: techResource.slug,
        description: techResource.description,
        category: techResource.category,
        level: techResource.level,
        url: techResource.url,
        docsUrl: techResource.docsUrl,
        featured: techResource.featured,
        status: techResource.status,
        createdAt: techResource.createdAt,
        updatedAt: techResource.updatedAt,
        tags: createResourceTagsAggExpr(),
        bookmarkCount: bookmarkCountExpr,
        bookmarkedByMe: sql<boolean>`exists(
          select 1 from ${techResourceBookmark}
          where ${techResourceBookmark.resourceId} = ${techResource.id}
          and ${techResourceBookmark.userId} = ${ctx.user.id}
        )`,
        canEdit: sql<boolean>`true`,
        creator: {
          id: user.id,
          name: user.name,
          image: user.image,
        },
      })
      .from(techResource)
      .leftJoin(user, eq(techResource.creatorId, user.id))
      .leftJoin(
        techResourceTagLink,
        eq(techResource.id, techResourceTagLink.resourceId),
      )
      .leftJoin(
        techResourceTag,
        eq(techResourceTagLink.tagId, techResourceTag.id),
      )
      .where(eq(techResource.creatorId, ctx.user.id))
      .groupBy(techResource.id, user.id)
      .orderBy(desc(techResource.updatedAt), desc(techResource.createdAt))

    return resources.map(formatResource)
  }),
  create: protectedProcedure
    .input(resourceInputSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        const [createdResource] = await tx
          .insert(techResource)
          .values({
            creatorId: ctx.user.id,
            name: input.name,
            slug: `${createSlug(input.name)}-${nanoid(6)}`,
            description: input.description,
            category: input.category,
            level: input.level,
            url: input.url,
            docsUrl: cleanOptionalUrl(input.docsUrl),
            featured: input.featured,
            status: input.status,
          })
          .returning({ id: techResource.id })

        await saveResourceTags({
          tx,
          resourceId: createdResource.id,
          userId: ctx.user.id,
          tags: input.tags,
        })

        return { id: createdResource.id }
      })
    }),
  update: protectedProcedure
    .input(resourceIdSchema.extend(resourceInputSchema.shape))
    .mutation(async ({ ctx, input }) => {
      const updatedResource = await ctx.db.transaction(async (tx) => {
        const [resource] = await tx
          .update(techResource)
          .set({
            name: input.name,
            description: input.description,
            category: input.category,
            level: input.level,
            url: input.url,
            docsUrl: cleanOptionalUrl(input.docsUrl),
            featured: input.featured,
            status: input.status,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(techResource.id, input.resourceId),
              eq(techResource.creatorId, ctx.user.id),
            ),
          )
          .returning({ id: techResource.id })

        if (!resource) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Resource not found",
          })
        }

        await saveResourceTags({
          tx,
          resourceId: resource.id,
          userId: ctx.user.id,
          tags: input.tags,
        })

        return resource
      })

      return { id: updatedResource.id }
    }),
  delete: protectedProcedure
    .input(resourceIdSchema)
    .mutation(async ({ ctx, input }) => {
      const [deletedResource] = await ctx.db
        .delete(techResource)
        .where(
          and(
            eq(techResource.id, input.resourceId),
            eq(techResource.creatorId, ctx.user.id),
          ),
        )
        .returning({ id: techResource.id })

      if (!deletedResource) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resource not found",
        })
      }

      return { success: true }
    }),
  toggleBookmark: protectedProcedure
    .input(resourceIdSchema)
    .mutation(async ({ ctx, input }) => {
      const [resource] = await ctx.db
        .select({ id: techResource.id })
        .from(techResource)
        .where(
          and(
            eq(techResource.id, input.resourceId),
            eq(techResource.status, "published"),
          ),
        )
        .limit(1)

      if (!resource) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resource not found",
        })
      }

      const existing = await ctx.db
        .select({ userId: techResourceBookmark.userId })
        .from(techResourceBookmark)
        .where(
          and(
            eq(techResourceBookmark.userId, ctx.user.id),
            eq(techResourceBookmark.resourceId, input.resourceId),
          ),
        )
        .limit(1)

      if (existing.length > 0) {
        await ctx.db
          .delete(techResourceBookmark)
          .where(
            and(
              eq(techResourceBookmark.userId, ctx.user.id),
              eq(techResourceBookmark.resourceId, input.resourceId),
            ),
          )
      } else {
        await ctx.db
          .insert(techResourceBookmark)
          .values({
            userId: ctx.user.id,
            resourceId: input.resourceId,
          })
          .onConflictDoNothing()
      }

      const [countRow] = await ctx.db
        .select({
          bookmarkCount: sql<number>`count(*)`.mapWith(Number),
        })
        .from(techResourceBookmark)
        .where(eq(techResourceBookmark.resourceId, input.resourceId))

      return {
        bookmarkedByMe: existing.length === 0,
        bookmarkCount: countRow?.bookmarkCount ?? 0,
      }
    }),
})
