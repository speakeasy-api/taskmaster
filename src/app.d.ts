import type { BaseSessionHandler, ValidateBearerTokenResult } from '$lib/server/event-utilities';
import type { AuthenticatedDbClient } from '$lib/server/event-utilities/db';
import type { ServiceContainer } from '$lib/server/services';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      /** Log to server console (or any other logging system you set up) */
      log: (...args: unknown[]) => void;
      /** Log an error to server console (or any other logging system you set up) */
      logError: (...args: unknown[]) => void;

      /** @deprecated Use `locals.session.validate()` instead */
      validateSession: () => Promise<ValidateSessionResult>;

      /** @deprecated Use `locals.session.validate()` instead */
      validateBearerToken: () => Promise<ValidateBearerTokenResult>;

      /** @deprecated Use `locals.session.validate()` instead */
      validateApiKey: () => Promise<ValidateSessionResult>;

      /** @deprecated Use `locals.session.getUserId()` instead */
      getUserId: () => Promise<string>;

      /** Send a message to the client that will be displayed as a toast. */
      sendFlashMessage: (params: Omit<FlashMessage, 'createdAt'>) => void;

      /**
       * Database connection that includes the JWT for the current user (if
       * any)
       *
       * @deprecated Use `locals.session.useDb()` instead
       * */
      db: AuthenticatedDbClient;

      services: ServiceContainer;

      session: BaseSessionHandler;
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
    //
    interface Error {
      message?: string;
      errors?: unknown;
    }
  }

  type ValidateSessionResult = Readonly<{
    session: import('better-auth').Session;
    user: import('better-auth').User;
    jwt: string;
  }>;

  type FlashMessage = { title: string; description: string; createdAt: number };

  // Utility types
  type MaybePromise<T> = T | Promise<T>;
  type StoreValue<T> = T extends import('svelte/store').Readable<infer U> ? U : never;
}

export {};
