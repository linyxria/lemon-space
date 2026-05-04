CREATE TABLE "blog_post" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" text NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text NOT NULL,
	"cover_image_url" text,
	"content" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"reading_time" integer DEFAULT 1 NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_post_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "blog_post_tag" (
	"post_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "blog_post_tag_post_id_tag_id_pk" PRIMARY KEY("post_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "blog_tag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"creator_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_tag_name_unique" UNIQUE("name"),
	CONSTRAINT "blog_tag_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "blog_post" ADD CONSTRAINT "blog_post_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post_tag" ADD CONSTRAINT "blog_post_tag_post_id_blog_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post_tag" ADD CONSTRAINT "blog_post_tag_tag_id_blog_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."blog_tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blog_post_author_id_idx" ON "blog_post" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "blog_post_status_published_at_idx" ON "blog_post" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "blog_post_tag_tag_id_idx" ON "blog_post_tag" USING btree ("tag_id");
--> statement-breakpoint
ALTER TABLE "asset_tag" RENAME TO "asset_tag_link";--> statement-breakpoint
ALTER TABLE "tag" RENAME TO "asset_tag";--> statement-breakpoint
ALTER TABLE "blog_post" RENAME TO "post";--> statement-breakpoint
ALTER TABLE "blog_tag" RENAME TO "post_tag";--> statement-breakpoint
ALTER TABLE "blog_post_tag" RENAME TO "post_tag_link";--> statement-breakpoint
ALTER TABLE "asset_tag_link" RENAME CONSTRAINT "asset_tag_tag_id_asset_id_pk" TO "asset_tag_link_tag_id_asset_id_pk";--> statement-breakpoint
ALTER TABLE "asset_tag_link" RENAME CONSTRAINT "asset_tag_asset_id_asset_id_fk" TO "asset_tag_link_asset_id_asset_id_fk";--> statement-breakpoint
ALTER TABLE "asset_tag_link" RENAME CONSTRAINT "asset_tag_tag_id_tag_id_fk" TO "asset_tag_link_tag_id_asset_tag_id_fk";--> statement-breakpoint
ALTER TABLE "asset_tag" RENAME CONSTRAINT "tag_name_unique" TO "asset_tag_name_unique";--> statement-breakpoint
ALTER TABLE "asset_tag" RENAME CONSTRAINT "tag_slug_unique" TO "asset_tag_slug_unique";--> statement-breakpoint
ALTER TABLE "post" RENAME CONSTRAINT "blog_post_slug_unique" TO "post_slug_unique";--> statement-breakpoint
ALTER TABLE "post" RENAME CONSTRAINT "blog_post_author_id_user_id_fk" TO "post_author_id_user_id_fk";--> statement-breakpoint
ALTER TABLE "post_tag" RENAME CONSTRAINT "blog_tag_name_unique" TO "post_tag_name_unique";--> statement-breakpoint
ALTER TABLE "post_tag" RENAME CONSTRAINT "blog_tag_slug_unique" TO "post_tag_slug_unique";--> statement-breakpoint
ALTER TABLE "post_tag_link" RENAME CONSTRAINT "blog_post_tag_post_id_tag_id_pk" TO "post_tag_link_post_id_tag_id_pk";--> statement-breakpoint
ALTER TABLE "post_tag_link" RENAME CONSTRAINT "blog_post_tag_post_id_blog_post_id_fk" TO "post_tag_link_post_id_post_id_fk";--> statement-breakpoint
ALTER TABLE "post_tag_link" RENAME CONSTRAINT "blog_post_tag_tag_id_blog_tag_id_fk" TO "post_tag_link_tag_id_post_tag_id_fk";--> statement-breakpoint
ALTER INDEX "asset_id_idx" RENAME TO "asset_tag_link_asset_id_idx";--> statement-breakpoint
ALTER INDEX "blog_post_author_id_idx" RENAME TO "post_author_id_idx";--> statement-breakpoint
ALTER INDEX "blog_post_status_published_at_idx" RENAME TO "post_status_published_at_idx";--> statement-breakpoint
ALTER INDEX "blog_post_tag_tag_id_idx" RENAME TO "post_tag_link_tag_id_idx";--> statement-breakpoint
CREATE TABLE "post_bookmark" (
	"user_id" text NOT NULL,
	"post_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "post_bookmark_post_id_user_id_pk" PRIMARY KEY("post_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "post_like" (
	"user_id" text NOT NULL,
	"post_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "post_like_post_id_user_id_pk" PRIMARY KEY("post_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "post" ADD COLUMN "view_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "post_bookmark" ADD CONSTRAINT "post_bookmark_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_bookmark" ADD CONSTRAINT "post_bookmark_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_like" ADD CONSTRAINT "post_like_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_like" ADD CONSTRAINT "post_like_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "like" RENAME TO "asset_like";--> statement-breakpoint
ALTER TABLE "asset_like" RENAME CONSTRAINT "like_asset_id_user_id_pk" TO "asset_like_asset_id_user_id_pk";--> statement-breakpoint
ALTER TABLE "asset_like" RENAME CONSTRAINT "like_asset_id_asset_id_fk" TO "asset_like_asset_id_asset_id_fk";--> statement-breakpoint
CREATE TABLE "collection_post" (
	"collection_id" uuid NOT NULL,
	"post_id" uuid NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "collection_post_collection_id_post_id_pk" PRIMARY KEY("collection_id","post_id")
);
--> statement-breakpoint
ALTER TABLE "collection_item" RENAME TO "collection_asset";--> statement-breakpoint
ALTER TABLE "collection_asset" DROP CONSTRAINT "collection_item_collection_id_collection_id_fk";
--> statement-breakpoint
ALTER TABLE "collection_asset" DROP CONSTRAINT "collection_item_asset_id_asset_id_fk";
--> statement-breakpoint
DROP INDEX "collection_item_asset_id_idx";--> statement-breakpoint
DROP INDEX "collection_item_collection_id_idx";--> statement-breakpoint
ALTER TABLE "collection_asset" DROP CONSTRAINT "collection_item_collection_id_asset_id_pk";--> statement-breakpoint
ALTER TABLE "collection_asset" ADD CONSTRAINT "collection_asset_collection_id_asset_id_pk" PRIMARY KEY("collection_id","asset_id");--> statement-breakpoint
ALTER TABLE "post" ADD COLUMN "content_json" jsonb;--> statement-breakpoint
ALTER TABLE "collection_post" ADD CONSTRAINT "collection_post_collection_id_collection_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_post" ADD CONSTRAINT "collection_post_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "collection_post_post_id_idx" ON "collection_post" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "collection_post_collection_id_idx" ON "collection_post" USING btree ("collection_id");--> statement-breakpoint
ALTER TABLE "collection_asset" ADD CONSTRAINT "collection_asset_collection_id_collection_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_asset" ADD CONSTRAINT "collection_asset_asset_id_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "collection_asset_asset_id_idx" ON "collection_asset" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "collection_asset_collection_id_idx" ON "collection_asset" USING btree ("collection_id");--> statement-breakpoint
ALTER TABLE "post" DROP CONSTRAINT "post_slug_unique";--> statement-breakpoint
ALTER TABLE "post" DROP COLUMN "slug";
