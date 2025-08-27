ALTER TABLE "projects" ALTER COLUMN "created_by" SET DEFAULT auth.user_id();--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "created_by" SET NOT NULL;