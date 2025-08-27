ALTER TABLE "task_dependencies" ALTER COLUMN "created_by" SET DEFAULT auth.user_id();--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "created_by" SET DEFAULT auth.user_id();