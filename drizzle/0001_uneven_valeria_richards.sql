ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "task_dependencies" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "projects" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id() = "projects"."created_by"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "projects" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id() = "projects"."created_by"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "projects" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id() = "projects"."created_by")) WITH CHECK ((select auth.user_id() = "projects"."created_by"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "projects" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id() = "projects"."created_by"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "task_dependencies" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id() = "task_dependencies"."created_by"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "task_dependencies" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id() = "task_dependencies"."created_by"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "task_dependencies" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id() = "task_dependencies"."created_by")) WITH CHECK ((select auth.user_id() = "task_dependencies"."created_by"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "task_dependencies" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id() = "task_dependencies"."created_by"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "tasks" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id() = "tasks"."created_by"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "tasks" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id() = "tasks"."created_by"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "tasks" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id() = "tasks"."created_by")) WITH CHECK ((select auth.user_id() = "tasks"."created_by"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "tasks" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id() = "tasks"."created_by"));