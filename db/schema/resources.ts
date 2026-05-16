import {
  boolean,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

import { user } from "./auth"

export const techResource = pgTable(
  "tech_resource",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    creatorId: text("creator_id").references(() => user.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull(),
    category: text("category").notNull(),
    level: text("level").notNull(),
    url: text("url").notNull(),
    docsUrl: text("docs_url"),
    featured: boolean("featured").default(false).notNull(),
    status: text("status").notNull().default("published"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (t) => [
    index("tech_resource_creator_id_idx").on(t.creatorId),
    index("tech_resource_category_status_idx").on(t.category, t.status),
    index("tech_resource_status_featured_idx").on(t.status, t.featured),
  ],
)

export const techResourceTag = pgTable("tech_resource_tag", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  creatorId: text("creator_id").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const techResourceTagLink = pgTable(
  "tech_resource_tag_link",
  {
    resourceId: uuid("resource_id")
      .references(() => techResource.id, { onDelete: "cascade" })
      .notNull(),
    tagId: uuid("tag_id")
      .references(() => techResourceTag.id, { onDelete: "cascade" })
      .notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.resourceId, t.tagId] }),
    index("tech_resource_tag_link_tag_id_idx").on(t.tagId),
  ],
)

export const techResourceBookmark = pgTable(
  "tech_resource_bookmark",
  {
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    resourceId: uuid("resource_id")
      .references(() => techResource.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.resourceId, t.userId] })],
)
