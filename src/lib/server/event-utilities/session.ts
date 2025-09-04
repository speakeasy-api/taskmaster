import { resolve } from '$app/paths';
import { getRequestEvent } from '$app/server';
import { auth } from '$lib/auth';
import { error, redirect } from '@sveltejs/kit';
import z from 'zod';
import { generateJwt, verifyJwt } from '../jwt';
import type { AuthenticatedDbClient } from './db';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { DATABASE_AUTHENTICATED_URL } from '$env/static/private';
import { combinedSchemas } from '$lib/db';
import type { User } from 'better-auth/types';

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

export const createApiKeyValidator = (): (() => Promise<ValidateSessionResult>) => {
  const { request } = getRequestEvent();
  let validatedSession: ValidateSessionResult | null = null;

  return async () => {
    if (validatedSession) return validatedSession;

    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) {
      error(401, { message: 'API key missing' });
    }

    const sessionResponse = await auth.api.getSession({
      headers: request.headers
    });

    if (!sessionResponse) {
      error(401, { message: 'Invalid API key' });
    }

    const jwt = await generateJwt({
      userId: sessionResponse.user.id
    });

    validatedSession = { ...sessionResponse, jwt };
    return validatedSession;
  };
};

// interface ISessionHandler {
//   validate(): Promise<{ user: { id: string }; jwt: string }>;
//   useDb: <TResult>(
//     cb: (db: AuthenticatedDbClient) => MaybePromise<TResult>
//   ) => MaybePromise<TResult>;
//   getUserId(): Promise<string>;
// }

export abstract class BaseSessionHandler {
  _event = getRequestEvent();

  constructor(params: { eagerValidate?: boolean }) {
    if (params.eagerValidate) this.validate();
  }

  abstract validate(): Promise<{ user: { id: string }; jwt: string }>;

  abstract getUser(): Promise<User>;

  /** Provides a database client authenticated with the current user's JWT. */
  useDb = <TResult>(
    cb: (db: AuthenticatedDbClient) => MaybePromise<TResult>
  ): MaybePromise<TResult> => {
    const authenticatedDb = drizzle(neon(DATABASE_AUTHENTICATED_URL), {
      schema: combinedSchemas
    }).$withAuth(async () => {
      const jwt = await this.getJwt();
      return jwt;
    });

    return cb(authenticatedDb);
  };

  async getJwt(): Promise<string> {
    const session = await this.validate();
    return session.jwt;
  }

  async getUserId(): Promise<string> {
    const validatedSession = await this.validate();
    return validatedSession.user.id;
  }
}

export class AppSessionHandler extends BaseSessionHandler {
  private validatedSession: ValidateSessionResult | null = null;
  // private event = getRequestEvent();

  constructor(options: { eagerValidate?: boolean }) {
    super(options);
  }

  /** Validates the current user session with request-scoped caching. */
  async validate() {
    if (this.validatedSession) {
      return this.validatedSession;
    }

    const sessionResponse = await auth.api.getSession({
      headers: this._event.request.headers,
      asResponse: true
    });

    if (sessionResponse.status !== 200) {
      this._event.locals.sendFlashMessage({
        title: 'Unauthorized',
        description: `An error occurred while validating your session (${sessionResponse.status}). Please log in again.`
      });
      clearAuthCookies();
      redirect(303, resolve('/(auth)/sign-in'));
    }

    const sessionJson: ValidateSessionResult | null = await sessionResponse.json();
    const setJwtHeader: string | null = sessionResponse.headers.get('set-auth-jwt');

    if (!sessionJson || !setJwtHeader) {
      this._event.locals.sendFlashMessage({
        title: 'Unauthorized',
        description: 'Your session is invalid. Please log in again.'
      });
      clearAuthCookies();
      redirect(303, resolve('/(auth)/sign-in'));
    }

    this.validatedSession = {
      ...sessionJson,
      jwt: sessionResponse.headers.get('set-auth-jwt')!
    };

    return this.validatedSession;
  }

  async getUser(): Promise<User> {
    const session = await this.validate();
    return session.user;
  }
}

export class ApiBearerTokenHandler extends BaseSessionHandler {
  private validatedToken: ValidateBearerTokenResult | null = null;
  private user: User | null = null;

  constructor(options: { eagerValidate?: boolean }) {
    super(options);
    // if (options.eagerValidate) this.validate();
  }

  async validate() {
    if (this.validatedToken) return this.validatedToken;

    const authHeader = this._event.request.headers.get('Authorization');

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
      this._event.locals.logError('JWT payload is missing required fields:', parseResult.error);
      error(401, { message: 'Invalid token payload' });
    }

    this.validatedToken = { jwt: providedToken, user: { id: parseResult.data.sub } };
    return this.validatedToken;
  }

  async getUser(): Promise<User> {
    if (this.user) return this.user;

    const session = await this.validate();
    const user = await this.useDb((db) =>
      db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, session.user.id)
      })
    );

    if (!user) {
      error(401, { message: 'User not found' });
    }

    this.user = user;
    return user;
  }
}

export class ApiKeySessionHandler extends BaseSessionHandler {
  private validatedSession: ValidateSessionResult | null = null;

  constructor(options: { eagerValidate?: boolean }) {
    super(options);
  }

  async validate() {
    if (this.validatedSession) return this.validatedSession;

    const apiKey = this._event.request.headers.get('x-api-key');
    if (!apiKey) {
      error(401, { message: 'API key missing' });
    }

    const sessionResponse = await auth.api.getSession({
      headers: this._event.request.headers
    });

    if (!sessionResponse) {
      error(401, { message: 'Invalid API key' });
    }

    const jwt = await generateJwt({
      userId: sessionResponse.user.id
    });

    this.validatedSession = { ...sessionResponse, jwt };
    return this.validatedSession;
  }

  async getUser(): Promise<User> {
    const session = await this.validate();
    return session.user;
  }
}
