// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      validateSession: () => Promise<{
        session: import('better-auth').Session;
        user: import('better-auth').User;
      }>;
      log: (...args: unknown[]) => void;
      logError: (...args: unknown[]) => void;
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }

  type StoreValue<T> = T extends import('svelte/store').Readable<infer U> ? U : never;
}

export {};
