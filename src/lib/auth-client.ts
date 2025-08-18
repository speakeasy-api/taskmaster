import { inferAdditionalFields } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/svelte';
import type { auth } from './auth.js';
import { oidcClient } from './oidc-provider/client.js';

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>(), oidcClient()]
});
