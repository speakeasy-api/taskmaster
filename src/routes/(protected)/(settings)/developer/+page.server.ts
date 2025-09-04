import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const apps = await locals.db.query.oauthApplications.findMany();

  const userId = await locals.session.getUserId();
  if (userId.isErr()) {
    locals.logError('Error getting user ID from session', userId.error);
    switch (userId.error._tag) {
      case 'InvalidCredentialError':
        error(401, userId.error.message);
    }
  }

  const apiKeys = await locals.services.apiKeys.list({ userId: userId.value });

  if (apiKeys.isErr()) {
    locals.logError("Failed to load the user's api keys", apiKeys.error);
    error(500, { message: 'Failed to load API keys' });
  }

  return { apps, apiKeys: apiKeys.value };
};
