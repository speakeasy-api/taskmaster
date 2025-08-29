import { building } from '$app/environment';
import { auth } from '$lib/auth';
import { type Handle } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import {
  log,
  logError,
  sendFlashMessage,
  createSessionValidator,
  authenticatedDb
} from '$lib/server/event-utilities';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.log = log;
  event.locals.logError = logError;
  event.locals.sendFlashMessage = sendFlashMessage;
  event.locals.validateSession = createSessionValidator();
  event.locals.db = authenticatedDb;

  if (event.route.id?.startsWith('/(protected)')) {
    await event.locals.validateSession();
  }

  return svelteKitHandler({ event, resolve, auth, building });
};
