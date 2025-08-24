ALTER TABLE "tasks" ADD COLUMN "search_vector" "tsvector" GENERATED ALWAYS AS (
        setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(description, '')), 'B')
      ) STORED;--> statement-breakpoint
CREATE INDEX "title_search_index" ON "tasks" USING gin ("search_vector");