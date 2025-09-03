CREATE TABLE "apikeys" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"start" text,
	"prefix" text,
	"key" text NOT NULL,
	"user_id" text NOT NULL,
	"refill_interval" integer,
	"refill_amount" integer,
	"last_refill_at" timestamp,
	"enabled" boolean DEFAULT true,
	"rate_limit_enabled" boolean DEFAULT true,
	"rate_limit_time_window" integer DEFAULT 86400000,
	"rate_limit_max" integer DEFAULT 10,
	"request_count" integer,
	"remaining" integer,
	"last_request" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"permissions" text,
	"metadata" text
);
--> statement-breakpoint
ALTER TABLE "apikeys" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "apikeys" ADD CONSTRAINT "apikeys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-delete" ON "apikeys" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((select auth.user_id() = "apikeys"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-insert" ON "apikeys" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((select auth.user_id() = "apikeys"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-select" ON "apikeys" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((select auth.user_id() = "apikeys"."user_id"));--> statement-breakpoint
CREATE POLICY "crud-authenticated-policy-update" ON "apikeys" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((select auth.user_id() = "apikeys"."user_id")) WITH CHECK ((select auth.user_id() = "apikeys"."user_id"));