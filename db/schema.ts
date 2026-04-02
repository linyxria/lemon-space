import { relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
});

export const assets = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(), // 对应 Clerk 的 user.id
  title: text("title"),
  r2Key: text("r2_key").notNull(),
  url: text("url").notNull(),
  categoryId: uuid("category_id").references(() => categories.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const favorites = pgTable(
  "favorites",
  {
    userId: text("user_id").notNull(),
    assetId: uuid("asset_id")
      .references(() => assets.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.assetId] })],
);

export const assetsRelations = relations(assets, ({ one, many }) => ({
  category: one(categories, {
    fields: [assets.categoryId],
    references: [categories.id],
  }),
  favoritedBy: many(favorites),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  asset: one(assets, {
    fields: [favorites.assetId],
    references: [assets.id],
  }),
}));
