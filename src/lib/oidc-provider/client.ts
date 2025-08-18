import type { BetterAuthClientPlugin } from 'better-auth/client';
import type { oidcProvider } from '.';

export const oidcClient = () => {
  return {
    id: 'oidc-client',
    $InferServerPlugin: {} as ReturnType<typeof oidcProvider>
  } satisfies BetterAuthClientPlugin;
};
