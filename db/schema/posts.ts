import {
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

import { user } from "./auth"

export const post = pgTable(
  "post",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull(),
    coverImageUrl: text("cover_image_url"),
    content: text("content").notNull(),
    contentJson: jsonb("content_json").$type<Record<string, unknown> | null>(),
    status: text("status").notNull().default("draft"),
    readingTime: integer("reading_time").notNull().default(1),
    viewCount: integer("view_count").notNull().default(0),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (t) => [
    index("post_author_id_idx").on(t.authorId),
    index("post_status_published_at_idx").on(t.status, t.publishedAt),
  ],
)

export const postTag = pgTable("post_tag", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  creatorId: text("creator_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const postTagLink = pgTable(
  "post_tag_link",
  {
    postId: uuid("post_id")
      .references(() => post.id, { onDelete: "cascade" })
      .notNull(),
    tagId: uuid("tag_id")
      .references(() => postTag.id, { onDelete: "cascade" })
      .notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.postId, t.tagId] }),
    index("post_tag_link_tag_id_idx").on(t.tagId),
  ],
)

export const postLike = pgTable(
  "post_like",
  {
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    postId: uuid("post_id")
      .references(() => post.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.userId] })],
)

export const postBookmark = pgTable(
  "post_bookmark",
  {
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    postId: uuid("post_id")
      .references(() => post.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.userId] })],
)
