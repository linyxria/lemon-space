ALTER TABLE "assets" DROP CONSTRAINT "user_object_idx";--> statement-breakpoint
ALTER TABLE "asset_tags" DROP CONSTRAINT "asset_tags_asset_id_tag_id_pk";--> statement-breakpoint
ALTER TABLE "likes" DROP CONSTRAINT "likes_user_id_asset_id_pk";--> statement-breakpoint
ALTER TABLE "asset_tags" ADD CONSTRAINT "asset_tags_tag_id_asset_id_pk" PRIMARY KEY("tag_id","asset_id");--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_asset_id_user_id_pk" PRIMARY KEY("asset_id","user_id");--> statement-breakpoint
CREATE INDEX "asset_id_idx" ON "asset_tags" USING btree ("asset_id");--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "user_id_object_key_unique" UNIQUE("user_id","object_key");
