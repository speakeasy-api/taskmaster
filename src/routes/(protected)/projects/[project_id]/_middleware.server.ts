import type { RequestEvent } from './$types';

export async function middleware(event: RequestEvent) {
  console.log('Checking if you have access to project:', event.params.project_id);

  // Return nothing/undefined to continue to the route handler
  return;
}
