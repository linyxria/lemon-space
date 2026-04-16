import { relations, sql } from 'drizzle-orm'
import {
  index,
  integer,
  pgPolicy,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'

import { user } from './auth'

const timestamptz = (name: string) =>
  timestamp(name, { withTimezone: true, mode: 'date' }).notNull().defaultNow()

const selectPolicy = () =>
  pgPolicy('Enable read access for all users', {
    as: 'permissive',
    to: 'public',
    for: 'select',
    using: sql`true`,
  })

const insertPolicy = (column: string) =>
  pgPolicy(`Enable insert for users based on ${column}`, {
    as: 'permissive',
    to: 'public',
    for: 'insert',
    withCheck: sql`requesting_user_id() = ${sql.identifier(column)}`,
  })

export const tag = pgTable(
  'tag',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    slug: text('slug').notNull().unique(),
    creatorId: text('creator_id').notNull(),
    createdAt: timestamptz('created_at'),
  },
  () => [selectPolicy(), insertPolicy('creator_id')],
)

export const asset = pgTable(
  'asset',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    title: text('title').notNull(),
    objectKey: text('object_key').notNull(),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    createdAt: timestamptz('created_at'),
  },
  (t) => [
    unique('user_id_object_key_unique').on(t.userId, t.objectKey),
    selectPolicy(),
    insertPolicy('user_id'),
  ],
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
    selectPolicy(),
  ],
)

export const like = pgTable(
  'like',
  {
    userId: text('user_id').notNull(),
    assetId: uuid('asset_id')
      .references(() => asset.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamptz('created_at'),
  },
  (t) => [
    primaryKey({ columns: [t.assetId, t.userId] }),
    selectPolicy(),
    insertPolicy('user_id'),
  ],
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
