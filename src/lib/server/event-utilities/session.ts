import { resolve } from '$app/paths';
import { getRequestEvent } from '$app/server';
import { auth } from '$lib/auth';
import { error, redirect } from '@sveltejs/kit';
import z from 'zod';
import { verifyJwt } from '../jwt';

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

const MinimumJwtPayloadSchema = z.object({
  sub: z.string()
});

export type ValidateBearerTokenResult = {
  jwt: string;
  user: {
    id: string;
  };
};

export const createBearerTokenValidator = (): (() => Promise<ValidateBearerTokenResult>) => {
  const { request, locals } = getRequestEvent();
  let validatedToken: ValidateBearerTokenResult | null = null;

  return async () => {
    if (validatedToken) return validatedToken;

    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      error(401, { message: 'Authorization header missing' });
    }
    if (!authHeader.startsWith('Bearer ')) {
      error(401, { message: 'Invalid Authorization header format' });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
      error(401, { message: 'Invalid Authorization header format' });
    }
    const providedToken = parts[1];
    const jwtPayload = await verifyJwt(providedToken);

    if (!jwtPayload.valid || !jwtPayload.payload) {
      error(401, { message: 'Invalid or expired token' });
    }

    const parseResult = MinimumJwtPayloadSchema.safeParse(jwtPayload.payload);
    if (!parseResult.success) {
      locals.logError('JWT payload is missing required fields:', parseResult.error);
      error(401, { message: 'Invalid token payload' });
    }

    validatedToken = { jwt: providedToken, user: { id: parseResult.data.sub } };
    return validatedToken;
  };
};
