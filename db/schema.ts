import { relations } from 'drizzle-orm'
import {
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
})

export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  objectKey: text('object_key').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const assetTags = pgTable(
  'asset_tags',
  {
    assetId: uuid('asset_id')
      .references(() => assets.id, { onDelete: 'cascade' })
      .notNull(),
    tagId: uuid('tag_id')
      .references(() => tags.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.assetId, t.tagId] })],
)

export const likes = pgTable(
  'likes',
  {
    userId: text('user_id').notNull(),
    assetId: uuid('asset_id')
      .references(() => assets.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.assetId] })],
)

export const assetsRelations = relations(assets, ({ many }) => ({
  tags: many(assetTags),
  likedBy: many(likes),
}))

export const tagsRelations = relations(tags, ({ many }) => ({
  assets: many(assetTags),
}))

export const assetTagsRelations = relations(assetTags, ({ one }) => ({
  asset: one(assets, { fields: [assetTags.assetId], references: [assets.id] }),
  tag: one(tags, { fields: [assetTags.tagId], references: [tags.id] }),
}))

export const likesRelations = relations(likes, ({ one }) => ({
  asset: one(assets, {
    fields: [likes.assetId],
    references: [assets.id],
  }),
}))
