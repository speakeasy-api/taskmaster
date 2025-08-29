import { command, getRequestEvent } from '$app/server';
import { auth } from '$lib/auth';
import { error } from '@sveltejs/kit';
import { RegisterOAuthAppRequest } from './CreateOAuthAppModal.schemas';

export const registerOAuthApp = command(RegisterOAuthAppRequest, async (data) => {
  const { locals, request } = getRequestEvent();
  await locals.validateSession();

  try {
    const result = await auth.api.registerOAuthApplication({
      body: {
        client_name: data.name,
        redirect_uris: data.redirectUrl ? [data.redirectUrl] : [],
        grant_types: ['client_credentials', 'authorization_code'],
        token_endpoint_auth_method: 'client_secret_basic',
        response_types: ['token', 'code']
      },
      headers: [['cookie', request.headers.get('cookie')!]]
    });
    return result;
  } catch (err) {
    locals.sendFlashMessage({
      title: 'Error',
      description: 'There was an error registering the OAuth application.'
    });
    locals.logError('Failed to register OAuth application:', err);
    error(500, 'Failed to register OAuth application');
  }
});
