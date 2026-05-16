import { relations } from "drizzle-orm"

import { asset, assetLike, assetTag, assetTagLink } from "./assets"
import { user } from "./auth"
import { collection, collectionAsset, collectionPost } from "./collections"
import { post, postBookmark, postLike, postTag, postTagLink } from "./posts"
import {
  techResource,
  techResourceBookmark,
  techResourceTag,
  techResourceTagLink,
} from "./resources"

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

export const collectionAssetRelations = relations(
  collectionAsset,
  ({ one }) => ({
    collection: one(collection, {
      fields: [collectionAsset.collectionId],
      references: [collection.id],
    }),
    asset: one(asset, {
      fields: [collectionAsset.assetId],
      references: [asset.id],
    }),
  }),
)

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

export const techResourceRelations = relations(
  techResource,
  ({ one, many }) => ({
    creator: one(user, {
      fields: [techResource.creatorId],
      references: [user.id],
    }),
    resourceTags: many(techResourceTagLink),
    bookmarkedBy: many(techResourceBookmark),
  }),
)

export const techResourceTagRelations = relations(
  techResourceTag,
  ({ many }) => ({
    resourceTags: many(techResourceTagLink),
  }),
)

export const techResourceTagLinkRelations = relations(
  techResourceTagLink,
  ({ one }) => ({
    resource: one(techResource, {
      fields: [techResourceTagLink.resourceId],
      references: [techResource.id],
    }),
    tag: one(techResourceTag, {
      fields: [techResourceTagLink.tagId],
      references: [techResourceTag.id],
    }),
  }),
)

export const techResourceBookmarkRelations = relations(
  techResourceBookmark,
  ({ one }) => ({
    resource: one(techResource, {
      fields: [techResourceBookmark.resourceId],
      references: [techResource.id],
    }),
  }),
)
