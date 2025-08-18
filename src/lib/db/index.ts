import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { DATABASE_URL } from '$env/static/private';
import * as authSchemas from './schemas/auth.js';
import * as authRelations from './schemas/auth-relations.js';
import * as schemas from './schemas/schema.js';

export const db = drizzle(DATABASE_URL, {
  schema: { ...schemas, ...authSchemas, ...authRelations }
});
