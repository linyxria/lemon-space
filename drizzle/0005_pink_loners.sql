ALTER TABLE "asset" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "asset_tag" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "like" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tag" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "asset" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "asset" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "like" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "like" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "tag" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "tag" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
DROP POLICY "Enable read access for all users" ON "asset" CASCADE;--> statement-breakpoint
DROP POLICY "Enable insert for users based on user_id" ON "asset" CASCADE;--> statement-breakpoint
DROP POLICY "Enable read access for all users" ON "asset_tag" CASCADE;--> statement-breakpoint
DROP POLICY "Enable read access for all users" ON "like" CASCADE;--> statement-breakpoint
DROP POLICY "Enable insert for users based on user_id" ON "like" CASCADE;--> statement-breakpoint
DROP POLICY "Enable read access for all users" ON "tag" CASCADE;--> statement-breakpoint
DROP POLICY "Enable insert for users based on creator_id" ON "tag" CASCADE;