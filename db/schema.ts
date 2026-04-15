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

export const tags = pgTable(
  'tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    slug: text('slug').notNull().unique(),
    creatorId: text('creator_id').notNull(),
    createdAt: timestamptz('created_at'),
  },
  () => [selectPolicy(), insertPolicy('creator_id')],
)

export const assets = pgTable(
  'assets',
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
  (t) => [
    primaryKey({ columns: [t.tagId, t.assetId] }),
    index('asset_id_idx').on(t.assetId),
    selectPolicy(),
  ],
)

export const likes = pgTable(
  'likes',
  {
    userId: text('user_id').notNull(),
    assetId: uuid('asset_id')
      .references(() => assets.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamptz('created_at'),
  },
  (t) => [
    primaryKey({ columns: [t.assetId, t.userId] }),
    selectPolicy(),
    insertPolicy('user_id'),
  ],
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
