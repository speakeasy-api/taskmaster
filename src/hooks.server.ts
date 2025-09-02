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
import { type Handle } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.log = log;
  event.locals.logError = logError;
  event.locals.sendFlashMessage = sendFlashMessage;
  event.locals.validateSession = createSessionValidator();
  event.locals.validateBearerToken = createBearerTokenValidator();

  const authType = getAuthTypeForRoute();
  if (authType !== 'none') {
    if (authType === 'session') await event.locals.validateSession();
    else if (authType === 'bearer') await event.locals.validateBearerToken();

    event.locals.db = createAuthenticatedDb(authType);
    event.locals.getUserId = createUserIdGetter(authType);
  }

  return svelteKitHandler({ event, resolve, auth, building });
};
