ALTER TABLE "task_dependencies" ALTER COLUMN "task_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "task_dependencies" ALTER COLUMN "depends_on_task_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "project_id" SET NOT NULL;