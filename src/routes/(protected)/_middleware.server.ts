import type { RequestEvent } from './$types';

export async function middleware(event: RequestEvent) {
  // Example: Check authentication
  console.log('Validating session for routes...');
  await event.locals.validateSession();

  return;
}
