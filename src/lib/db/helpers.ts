import { sql } from 'drizzle-orm';

export const SQL_NOW = sql`(now() AT TIME ZONE 'utc'::text)`;
