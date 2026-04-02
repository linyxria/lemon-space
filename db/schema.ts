// src/db/schema.ts
import { pgTable, uuid, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 50 }).notNull(),
  slug: varchar("slug", { length: 50 }).unique().notNull(),
});

export const assets = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  r2Key: text("r2_key").notNull(),
  url: text("url").notNull(),
  categoryId: uuid("category_id").references(() => categories.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
