import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { jwt, openAPI } from 'better-auth/plugins';
import { db } from '../lib/db/index.js';
import * as schemas from '../lib/db/schemas/auth.js';
import { oidcProvider } from './oidc-provider/index.js';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';

export const auth = betterAuth({
  user: {
    deleteUser: { enabled: true }
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: schemas
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60
    }
  },
  plugins: [
    sveltekitCookies(getRequestEvent),
    jwt(),
    oidcProvider({
      loginPage: '/sign-in',
      storeClientSecret: 'encrypted',
      useJWTPlugin: true,
      allowDynamicClientRegistration: true,
      consentPage: '/oauth2/consent'
    }),
    openAPI()
  ]
});
