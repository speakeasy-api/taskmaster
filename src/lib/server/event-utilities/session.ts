import { resolve } from '$app/paths';
import { getRequestEvent } from '$app/server';
import { auth } from '$lib/auth';
import { redirect } from '@sveltejs/kit';

const clearAuthCookies = () => {
  const { cookies } = getRequestEvent();
  const allCookies = cookies.getAll();

  for (const cookie of allCookies) {
    const isAuthCookie = /^(__Secure-)?better-auth.*$/.test(cookie.name);
    if (isAuthCookie) {
      cookies.delete(cookie.name, { path: '/' });
    }
  }
};

/**
 * Creates a session validator function with caching capabilities.
 *
 * This factory function returns a validator that can be called multiple times
 * within the same request context to validate user sessions. The validator
 * implements request-scoped caching to avoid redundant API calls.
 */
export const createSessionValidator = (): (() => Promise<ValidateSessionResult>) => {
  const event = getRequestEvent();
  let validatedSession: ValidateSessionResult | null = null;

  /**
   * Validates the current user session with request-scoped caching.
   *
   * On first call, validates the session by:
   * 1. Calling the Better Auth API with request headers
   * 2. Checking response status and extracting session data
   * 3. Validating presence of JWT token header
   * 4. Caching the result for subsequent calls
   *
   * On authentication failure:
   * - Shows flash message to user explaining the error
   * - Clears all Better Auth cookies
   * - Redirects to sign-in page
   */
  return async () => {
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
      redirect(303, resolve('/(auth)/sign-in'));
    }

    const sessionJson: ValidateSessionResult | null = await sessionResponse.json();
    const setJwtHeader: string | null = sessionResponse.headers.get('set-auth-jwt');

    if (!sessionJson || !setJwtHeader) {
      event.locals.sendFlashMessage({
        title: 'Unauthorized',
        description: 'Your session is invalid. Please log in again.'
      });
      clearAuthCookies();
      redirect(303, resolve('/(auth)/sign-in'));
    }

    validatedSession = {
      ...sessionJson,
      jwt: sessionResponse.headers.get('set-auth-jwt')!
    };

    return validatedSession;
  };
};
