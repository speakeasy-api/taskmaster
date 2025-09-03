import type { ValidateBearerTokenResult } from '$lib/server/event-utilities';
import type { AuthenticatedDbClient } from '$lib/server/event-utilities/db';
import type { ServiceContainer } from '$lib/server/services';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      validateSession: () => Promise<GetSessionResponse>;

      log: (...args: unknown[]) => void;
      logError: (...args: unknown[]) => void;

      /** Send a message to the client that will be displayed as a toast. */
      sendFlashMessage: (params: Omit<FlashMessage, 'createdAt'>) => void;

      /** Database connection that includes the JWT for the current user (if any) */
      db: AuthenticatedDbClient;

      services: ServiceContainer;
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }

  type GetSessionResponse = {
    session: import('better-auth').Session;
    user: import('better-auth').User;
  };
  type FlashMessage = { title: string; description: string; createdAt: number };
  type StoreValue<T> = T extends import('svelte/store').Readable<infer U> ? U : never;
}

export {};
