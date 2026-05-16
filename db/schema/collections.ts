import {
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

import { asset } from "./assets"
import { user } from "./auth"
import { post } from "./posts"

export const collection = pgTable(
  "collection",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (t) => [index("collection_user_id_idx").on(t.userId)],
)

export const collectionAsset = pgTable(
  "collection_asset",
  {
    collectionId: uuid("collection_id")
      .references(() => collection.id, { onDelete: "cascade" })
      .notNull(),
    assetId: uuid("asset_id")
      .references(() => asset.id, { onDelete: "cascade" })
      .notNull(),
    addedAt: timestamp("added_at").defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.collectionId, t.assetId] }),
    index("collection_asset_asset_id_idx").on(t.assetId),
    index("collection_asset_collection_id_idx").on(t.collectionId),
  ],
)

export const collectionPost = pgTable(
  "collection_post",
  {
    collectionId: uuid("collection_id")
      .references(() => collection.id, { onDelete: "cascade" })
      .notNull(),
    postId: uuid("post_id")
      .references(() => post.id, { onDelete: "cascade" })
      .notNull(),
    addedAt: timestamp("added_at").defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.collectionId, t.postId] }),
    index("collection_post_post_id_idx").on(t.postId),
    index("collection_post_collection_id_idx").on(t.collectionId),
  ],
)
