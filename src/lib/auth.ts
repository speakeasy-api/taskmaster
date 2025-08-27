import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { jwt, openAPI } from 'better-auth/plugins';
import { db } from '../lib/db/index.js';
import * as schemas from '../lib/db/schemas/auth.js';
import { oidcProvider } from './oidc-provider/index.js';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';

export const auth = betterAuth({
  disabledPaths: ['/oauth2/token'],
  user: {
    deleteUser: { enabled: true }
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: schemas,
    usePlural: true
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false
  },
  session: {
    // cookieCache: {
    //   enabled: true,
    //   maxAge: 5 * 60
    // }
  },

  plugins: [
    sveltekitCookies(getRequestEvent),
    jwt({
      jwks: {
        keyPairConfig: {
          alg: 'ES256'
        }
      }
    }),
    oidcProvider({
      loginPage: '/sign-in',
      storeClientSecret: 'encrypted',
      allowDynamicClientRegistration: true,
      consentPage: '/oauth2/consent'
    }),
    openAPI()
  ]
});
