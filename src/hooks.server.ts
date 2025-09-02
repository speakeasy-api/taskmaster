import { building } from '$app/environment';
import type { RouteId } from '$app/types';
import { auth } from '$lib/auth';
import {
  createAuthenticatedDb,
  createBearerTokenValidator,
  createSessionValidator,
  createUserIdGetter,
  log,
  logError,
  sendFlashMessage
} from '$lib/server/event-utilities';
import { type Handle } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';

const SESSION_PROTECTED_ROUTE_ID_PREFIX: RouteId = '/(protected)';
const BEARER_TOKEN_PROTECTED_ROUTE_ID_PREFIX: RouteId = '/api/(protected)';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.log = log;
  event.locals.logError = logError;
  event.locals.sendFlashMessage = sendFlashMessage;
  event.locals.validateSession = createSessionValidator();
  event.locals.validateBearerToken = createBearerTokenValidator();

  if (event.route.id?.startsWith(SESSION_PROTECTED_ROUTE_ID_PREFIX)) {
    await event.locals.validateSession();
    event.locals.db = createAuthenticatedDb('session');
    event.locals.getUserId = createUserIdGetter('session');
  } else if (event.route.id?.startsWith(BEARER_TOKEN_PROTECTED_ROUTE_ID_PREFIX)) {
    await event.locals.validateBearerToken();
    event.locals.db = createAuthenticatedDb('bearer');
    event.locals.getUserId = createUserIdGetter('bearer');
  }

  return svelteKitHandler({ event, resolve, auth, building });
};
