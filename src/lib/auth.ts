import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { jwt, openAPI, apiKey } from 'better-auth/plugins';
import { db } from '../lib/db/index.js';
import * as schemas from '../lib/db/schemas/auth.js';
import { oidcProvider } from './oidc-provider/index.js';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { BETTER_AUTH_SECRET } from '$env/static/private';

export const auth = betterAuth({
  secret: BETTER_AUTH_SECRET,
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
    // !TODO: re-enable
    // cookieCache: {
    //   enabled: true,
    //   maxAge: 5 * 60
    // }
  },

  plugins: [
    sveltekitCookies(getRequestEvent),
    apiKey({
      rateLimit: { enabled: false },
      schema: {
        apikey: {
          fields: {}
        }
      }
    }),
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
