import { building } from '$app/environment';
import { resolve as resolvePath } from '$app/paths';
import { auth } from '$lib/auth';
import { buildAuthenticatedDbClient } from '$lib/db';
import { clearAuthCookies } from '$lib/server/cookies';
import { sendFlashMessage } from '$lib/server/flash';
import * as loggers from '$lib/server/log';
import { redirect, type Handle } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.sendFlashMessage = sendFlashMessage;

  let validatedSession: ValidateSessionResult | null = null;

  event.locals.validateSession = async () => {
    if (validatedSession) {
      return validatedSession;
    }

    const sessionResponse = await auth.api.getSession({
      headers: event.request.headers,
      asResponse: true
    });

    if (sessionResponse.status !== 200) {
      event.locals.sendFlashMessage({
        title: 'Unauthorized',
        description: `An error occurred while validating your session (${sessionResponse.status}). Please log in again.`
      });
      clearAuthCookies();
      redirect(303, resolvePath('/(auth)/sign-in'));
    }

    const sessionJson: ValidateSessionResult | null = await sessionResponse.json();
    const setJwtHeader: string | null = sessionResponse.headers.get('set-auth-jwt');

    if (!sessionJson || !setJwtHeader) {
      event.locals.sendFlashMessage({
        title: 'Unauthorized',
        description: 'Your session is invalid. Please log in again.'
      });
      clearAuthCookies();
      redirect(303, resolvePath('/(auth)/sign-in'));
    }

    validatedSession = {
      ...sessionJson,
      jwt: sessionResponse.headers.get('set-auth-jwt')!
    };

    return validatedSession;
  };

  if (event.route.id?.startsWith('/(protected)')) {
    await event.locals.validateSession();
  }

  event.locals.db = buildAuthenticatedDbClient();

  event.locals.log = loggers.log;
  event.locals.logError = loggers.logError;

  return svelteKitHandler({ event, resolve, auth, building });
};
