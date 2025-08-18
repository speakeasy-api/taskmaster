import { building } from '$app/environment';
import { auth } from '$lib/auth';
import { error, type Handle } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.validateSession = async () => {
    const session = await auth.api.getSession({ headers: event.request.headers });
    if (!session) {
      error(401, 'Unauthorized');
    }
    return session;
  };

  event.locals.log = (...args: unknown[]) => {
    console.log(
      `[LOG] [${new Date().toISOString()}] ${event.request.method} ${event.url.pathname} ::`,
      ...args
    );
  };

  event.locals.logError = (...args: unknown[]) => {
    console.error(
      `[ERR] [${new Date().toISOString()}] ${event.request.method} ${event.url.pathname} ::`,
      ...args
    );
  };

  return svelteKitHandler({ event, resolve, auth, building });
};
