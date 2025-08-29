import { DATABASE_URL } from '$env/static/private';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as authExtensions from './schemas/auth-extensions.js';
import * as authSchemas from './schemas/auth.js';
import * as schemas from './schemas/schema.js';

export const combinedSchemas = { ...schemas, ...authSchemas, ...authExtensions };

export const db = drizzle(neon(DATABASE_URL), {
  schema: combinedSchemas
});
