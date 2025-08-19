import { form, getRequestEvent } from '$app/server';
import { auth } from '$lib/auth';
import { fail, redirect } from '@sveltejs/kit';

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
  } catch (error) {
    locals.logError('Error deleting user account:', error);
    return fail(500, { message: 'Failed to delete account. Please try again.' });
  }

  if (!result.success) {
    locals.logError('Failed to delete user account:', result.message);
    return fail(500, { message: 'Failed to delete account. Please try again.' });
  }

  locals.sendFlashMessage({
    title: 'Account Deleted',
    description: 'Your account has been successfully deleted.'
  });

  locals.logError('User account deletion initiated:', result);
  return redirect(302, '/sign-in');
});
