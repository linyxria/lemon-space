DROP INDEX IF EXISTS "user_preference_default_sort_idx";--> statement-breakpoint
ALTER TABLE "user_preference" DROP COLUMN IF EXISTS "show_card_tags";--> statement-breakpoint
ALTER TABLE "user_preference" DROP COLUMN IF EXISTS "default_sort";
