import { form, getRequestEvent } from '$app/server';
import { auth } from '$lib/auth';
import { sendFlashMessage } from '$lib/server/event-utilities';
import { error, redirect } from '@sveltejs/kit';

export const deleteUserAccount = form(async () => {
  const { request, locals } = getRequestEvent();

  let result;
  try {
    result = await auth.api.deleteUser({
      body: {
        callbackURL: '/sign-in'
      },
      headers: request.headers
    });
  } catch (e) {
    sendFlashMessage({
      title: 'Error',
      description: 'There was an error deleting your account.'
    });
    locals.logError('Error deleting user account:', e);
    return error(500);
  }

  if (!result.success) {
    locals.sendFlashMessage({
      title: 'Error',
      description: 'Failed to delete your account. Please try again.'
    });
    locals.logError('Failed to delete user account:', result.message);
    return error(500, { message: 'Failed to delete account. Please try again.' });
  }

  locals.sendFlashMessage({
    title: 'Account Deleted',
    description: 'Your account has been successfully deleted.'
  });
  locals.logError('User account deleted:', result);

  return redirect(302, '/sign-in');
});
