import { building } from '$app/environment';
import { resolve as resolvePath } from '$app/paths';
import { auth } from '$lib/auth';
import { buildAuthenticatedDbClient } from '$lib/db';
import { sendFlashMessage } from '$lib/server/flash';
import * as loggers from '$lib/server/log';
import { redirect, type Handle } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';

export const handle: Handle = async ({ event, resolve }) => {
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
      redirect(303, resolvePath('/(auth)/sign-in'));
    }

    const sessionJson: ValidateSessionResult = await sessionResponse.json();

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

  event.locals.sendFlashMessage = sendFlashMessage;

  return svelteKitHandler({ event, resolve, auth, building });
};
