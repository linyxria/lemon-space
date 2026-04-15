ALTER TABLE "asset_tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "assets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "likes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "assets" DROP CONSTRAINT "user_object_idx";--> statement-breakpoint
ALTER TABLE "asset_tags" DROP CONSTRAINT "asset_tags_asset_id_tag_id_pk";--> statement-breakpoint
ALTER TABLE "likes" DROP CONSTRAINT "likes_user_id_asset_id_pk";--> statement-breakpoint
ALTER TABLE "asset_tags" ADD CONSTRAINT "asset_tags_tag_id_asset_id_pk" PRIMARY KEY("tag_id","asset_id");--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_asset_id_user_id_pk" PRIMARY KEY("asset_id","user_id");--> statement-breakpoint
CREATE INDEX "asset_id_idx" ON "asset_tags" USING btree ("asset_id");--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "user_id_object_key_unique" UNIQUE("user_id","object_key");--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "asset_tags" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "assets" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Enable insert for users based on user_id" ON "assets" AS PERMISSIVE FOR INSERT TO public WITH CHECK (requesting_user_id() = "user_id");--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "likes" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Enable insert for users based on user_id" ON "likes" AS PERMISSIVE FOR INSERT TO public WITH CHECK (requesting_user_id() = "user_id");--> statement-breakpoint
CREATE POLICY "Enable read access for all users" ON "tags" AS PERMISSIVE FOR SELECT TO public USING (true);--> statement-breakpoint
CREATE POLICY "Enable insert for users based on creator_id" ON "tags" AS PERMISSIVE FOR INSERT TO public WITH CHECK (requesting_user_id() = "creator_id");