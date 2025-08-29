import { getRequestEvent } from '$app/server';
import { DATABASE_AUTHENTICATED_URL } from '$env/static/private';
import { combinedSchemas } from '$lib/db';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

export const authenticatedDb = drizzle(neon(DATABASE_AUTHENTICATED_URL), {
  schema: combinedSchemas
}).$withAuth(async () => {
  const { locals } = getRequestEvent();
  const session = await locals.validateSession();
  return session.jwt;
});

export type AuthenticatedDbClient = typeof authenticatedDb;
