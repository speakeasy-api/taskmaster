import type { AuthentictedDbClient } from '$lib/db';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      validateSession: () => Promise<ValidateSessionResult>;

      log: (...args: unknown[]) => void;
      logError: (...args: unknown[]) => void;

      /** Send a message to the client that will be displayed as a toast. */
      sendFlashMessage: (params: Omit<FlashMessage, 'createdAt'>) => void;

      /** Database connection that includes the JWT for the current user (if any) */
      db: AuthentictedDbClient;
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }

  type ValidateSessionResult = Readonly<{
    session: import('better-auth').Session;
    user: import('better-auth').User;
    jwt: string;
  }>;
  type FlashMessage = { title: string; description: string; createdAt: number };
  type StoreValue<T> = T extends import('svelte/store').Readable<infer U> ? U : never;
}

export {};
