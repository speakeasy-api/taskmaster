import { getRequestEvent } from '$app/server';
import { DATABASE_AUTHENTICATED_URL } from '$env/static/private';
import { combinedSchemas } from '$lib/db';
import { neon } from '@neondatabase/serverless';
import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http';

const sessionAuthenticator = async (): Promise<string> => {
  const { locals } = getRequestEvent();
  const session = await locals.validateSession();
  return session.jwt;
};

const bearerAuthenticator = async (): Promise<string> => {
  const { locals } = getRequestEvent();
  const { jwt } = await locals.validateBearerToken();
  return jwt;
};

const apiKeyAuthenticator = async (): Promise<string> => {
  const { locals } = getRequestEvent();
  const session = await locals.validateApiKey();
  return session.jwt;
};

export const createAuthenticatedDb = (
  strategy: 'session' | 'bearer' | 'apiKey'
): AuthenticatedDbClient => {
  let authenticator: () => Promise<string>;
  if (strategy === 'session') {
    authenticator = sessionAuthenticator;
  } else if (strategy === 'bearer') {
    authenticator = bearerAuthenticator;
  } else if (strategy === 'apiKey') {
    authenticator = apiKeyAuthenticator;
  } else {
    throw new Error('Invalid authentication strategy');
  }

  return drizzle(neon(DATABASE_AUTHENTICATED_URL), {
    schema: combinedSchemas
  }).$withAuth(authenticator);
};

export type AuthenticatedDbClient = ReturnType<
  NeonHttpDatabase<typeof combinedSchemas>['$withAuth']
>;
