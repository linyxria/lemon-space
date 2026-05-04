import { relations } from 'drizzle-orm'
import {
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'

import { user } from './auth'

export const assetTag = pgTable('asset_tag', {
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

export const assetTagLink = pgTable(
  'asset_tag_link',
  {
    assetId: uuid('asset_id')
      .references(() => asset.id, { onDelete: 'cascade' })
      .notNull(),
    tagId: uuid('tag_id')
      .references(() => assetTag.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.tagId, t.assetId] }),
    index('asset_tag_link_asset_id_idx').on(t.assetId),
  ],
)

export const assetLike = pgTable(
  'asset_like',
  {
    userId: text('user_id').notNull(),
    assetId: uuid('asset_id')
      .references(() => asset.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.assetId, t.userId] })],
)

export const collection = pgTable(
  'collection',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (t) => [index('collection_user_id_idx').on(t.userId)],
)

export const collectionAsset = pgTable(
  'collection_asset',
  {
    collectionId: uuid('collection_id')
      .references(() => collection.id, { onDelete: 'cascade' })
      .notNull(),
    assetId: uuid('asset_id')
      .references(() => asset.id, { onDelete: 'cascade' })
      .notNull(),
    addedAt: timestamp('added_at').defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.collectionId, t.assetId] }),
    index('collection_asset_asset_id_idx').on(t.assetId),
    index('collection_asset_collection_id_idx').on(t.collectionId),
  ],
)

export const post = pgTable(
  'post',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    authorId: text('author_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    excerpt: text('excerpt').notNull(),
    coverImageUrl: text('cover_image_url'),
    content: text('content').notNull(),
    contentJson: jsonb('content_json').$type<Record<string, unknown> | null>(),
    status: text('status').notNull().default('draft'),
    readingTime: integer('reading_time').notNull().default(1),
    viewCount: integer('view_count').notNull().default(0),
    publishedAt: timestamp('published_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (t) => [
    index('post_author_id_idx').on(t.authorId),
    index('post_status_published_at_idx').on(t.status, t.publishedAt),
  ],
)

export const collectionPost = pgTable(
  'collection_post',
  {
    collectionId: uuid('collection_id')
      .references(() => collection.id, { onDelete: 'cascade' })
      .notNull(),
    postId: uuid('post_id')
      .references(() => post.id, { onDelete: 'cascade' })
      .notNull(),
    addedAt: timestamp('added_at').defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.collectionId, t.postId] }),
    index('collection_post_post_id_idx').on(t.postId),
    index('collection_post_collection_id_idx').on(t.collectionId),
  ],
)

export const postTag = pgTable('post_tag', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  creatorId: text('creator_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const postTagLink = pgTable(
  'post_tag_link',
  {
    postId: uuid('post_id')
      .references(() => post.id, { onDelete: 'cascade' })
      .notNull(),
    tagId: uuid('tag_id')
      .references(() => postTag.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.postId, t.tagId] }),
    index('post_tag_link_tag_id_idx').on(t.tagId),
  ],
)

export const postLike = pgTable(
  'post_like',
  {
    userId: text('user_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull(),
    postId: uuid('post_id')
      .references(() => post.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.userId] })],
)

export const postBookmark = pgTable(
  'post_bookmark',
  {
    userId: text('user_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull(),
    postId: uuid('post_id')
      .references(() => post.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.userId] })],
)

export const assetRelations = relations(asset, ({ one, many }) => ({
  user: one(user, {
    fields: [asset.userId],
    references: [user.id],
  }),
  assetTags: many(assetTagLink),
  likedBy: many(assetLike),
  collectionAssets: many(collectionAsset),
}))

export const assetTagRelations = relations(assetTag, ({ many }) => ({
  assetTags: many(assetTagLink),
}))

export const assetTagLinkRelations = relations(assetTagLink, ({ one }) => ({
  asset: one(asset, {
    fields: [assetTagLink.assetId],
    references: [asset.id],
  }),
  tag: one(assetTag, {
    fields: [assetTagLink.tagId],
    references: [assetTag.id],
  }),
}))

export const assetLikeRelations = relations(assetLike, ({ one }) => ({
  asset: one(asset, {
    fields: [assetLike.assetId],
    references: [asset.id],
  }),
}))

export const collectionRelations = relations(collection, ({ one, many }) => ({
  user: one(user, {
    fields: [collection.userId],
    references: [user.id],
  }),
  assets: many(collectionAsset),
  posts: many(collectionPost),
}))

export const collectionAssetRelations = relations(collectionAsset, ({ one }) => ({
  collection: one(collection, {
    fields: [collectionAsset.collectionId],
    references: [collection.id],
  }),
  asset: one(asset, {
    fields: [collectionAsset.assetId],
    references: [asset.id],
  }),
}))

export const postRelations = relations(post, ({ one, many }) => ({
  author: one(user, {
    fields: [post.authorId],
    references: [user.id],
  }),
  postTags: many(postTagLink),
  likedBy: many(postLike),
  bookmarkedBy: many(postBookmark),
  collectionPosts: many(collectionPost),
}))

export const collectionPostRelations = relations(collectionPost, ({ one }) => ({
  collection: one(collection, {
    fields: [collectionPost.collectionId],
    references: [collection.id],
  }),
  post: one(post, {
    fields: [collectionPost.postId],
    references: [post.id],
  }),
}))

export const postTagRelations = relations(postTag, ({ many }) => ({
  postTags: many(postTagLink),
}))

export const postTagLinkRelations = relations(postTagLink, ({ one }) => ({
  post: one(post, {
    fields: [postTagLink.postId],
    references: [post.id],
  }),
  tag: one(postTag, {
    fields: [postTagLink.tagId],
    references: [postTag.id],
  }),
}))

export const postLikeRelations = relations(postLike, ({ one }) => ({
  post: one(post, {
    fields: [postLike.postId],
    references: [post.id],
  }),
}))

export const postBookmarkRelations = relations(postBookmark, ({ one }) => ({
  post: one(post, {
    fields: [postBookmark.postId],
    references: [post.id],
  }),
}))

export * from './auth'
