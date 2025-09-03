import { building } from '$app/environment';
import { auth } from '$lib/auth';
import {
  createAuthenticatedDb,
  createBearerTokenValidator,
  createSessionValidator,
  createUserIdGetter,
  getAuthTypeForRoute,
  log,
  logError,
  sendFlashMessage
} from '$lib/server/event-utilities';
import { ServiceContainer } from '$lib/server/services';
import { type Handle } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { randomBytes } from 'crypto';

export const handle: Handle = async ({ event, resolve }) => {
  let validatedSession: GetSessionResponse | null = null;
  event.locals.validateSession = async () => {
    if (validatedSession) {
      return validatedSession;
    }

    const session = await auth.api.getSession({ headers: event.request.headers });
    if (!session) {
      error(401, 'Unauthorized');
    }

    event.locals.db = createAuthenticatedDb(authType);
    event.locals.getUserId = createUserIdGetter(authType);
    event.locals.services = new ServiceContainer(event.locals.db);
  }

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

  event.locals.sendFlashMessage = (params) => {
    const messageKey = `_message-${randomBytes(4).toString('base64url')}`;
    const messageJson = JSON.stringify({
      title: params.title,
      description: params.description,
      createdAt: Date.now()
    } satisfies FlashMessage);
    event.cookies.set(messageKey, messageJson, { path: '/', httpOnly: false, maxAge: 15 });
  };

  return svelteKitHandler({ event, resolve, auth, building });
};
