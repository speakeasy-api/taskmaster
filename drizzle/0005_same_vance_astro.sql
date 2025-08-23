ALTER TABLE "task_dependencies" ALTER COLUMN "dependency_type" SET DEFAULT 'relates_to';--> statement-breakpoint
ALTER TABLE "task_dependencies" ALTER COLUMN "dependency_type" SET NOT NULL;