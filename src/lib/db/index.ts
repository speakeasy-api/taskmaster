import { getRequestEvent } from '$app/server';
import { DATABASE_URL, DATABASE_AUTHENTICATED_URL } from '$env/static/private';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as authRelations from './schemas/auth-relations.js';
import * as authSchemas from './schemas/auth.js';
import * as schemas from './schemas/schema.js';

const combinedSchemas = { ...schemas, ...authSchemas, ...authRelations };

export const db = drizzle(neon(DATABASE_URL), {
  schema: combinedSchemas
});

export function buildAuthenticatedDbClient() {
  const db = drizzle(neon(DATABASE_AUTHENTICATED_URL), {
    schema: combinedSchemas
  });

  const dbWithAuth = db.$withAuth(async () => {
    const { locals } = getRequestEvent();
    const session = await locals.validateSession();
    return session.jwt;
  });

  return dbWithAuth;
}

export type AuthentictedDbClient = ReturnType<typeof buildAuthenticatedDbClient>;
