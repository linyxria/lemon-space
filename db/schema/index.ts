import { relations } from 'drizzle-orm'
import {
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'

import { user } from './auth'

export const tag = pgTable('tag', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  creatorId: text('creator_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const asset = pgTable(
  'asset',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    title: text('title').notNull(),
    objectKey: text('object_key').notNull(),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [unique('user_id_object_key_unique').on(t.userId, t.objectKey)],
)

export const assetTag = pgTable(
  'asset_tag',
  {
    assetId: uuid('asset_id')
      .references(() => asset.id, { onDelete: 'cascade' })
      .notNull(),
    tagId: uuid('tag_id')
      .references(() => tag.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.tagId, t.assetId] }),
    index('asset_id_idx').on(t.assetId),
  ],
)

export const like = pgTable(
  'like',
  {
    userId: text('user_id').notNull(),
    assetId: uuid('asset_id')
      .references(() => asset.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.assetId, t.userId] })],
)

export const assetRelations = relations(asset, ({ one, many }) => ({
  user: one(user, {
    fields: [asset.userId],
    references: [user.id],
  }),
  assetTags: many(assetTag),
  likedBy: many(like),
}))

export const tagRelations = relations(tag, ({ many }) => ({
  assetTags: many(assetTag),
}))

export const assetTagRelations = relations(assetTag, ({ one }) => ({
  asset: one(asset, { fields: [assetTag.assetId], references: [asset.id] }),
  tag: one(tag, { fields: [assetTag.tagId], references: [tag.id] }),
}))

export const likeRelations = relations(like, ({ one }) => ({
  asset: one(asset, {
    fields: [like.assetId],
    references: [asset.id],
  }),
}))

export * from './auth'
