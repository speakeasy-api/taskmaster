import { form, getRequestEvent } from '$app/server';
import { oauthApplications } from '$lib/db/schemas/auth';
import { validateForm } from '$lib/server/remote-fns';
import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { DeleteApplicationRequest } from './page.schemas';

export const deleteApp = form(async (formData) => {
  const { locals } = getRequestEvent();

  const validatedReq = validateForm(formData, DeleteApplicationRequest);

  if (!validatedReq.success) {
    locals.sendFlashMessage({
      title: 'Error',
      description: 'There was an error with your request.'
    });
    error(400, 'Invalid request');
  }

  const { id } = validatedReq.data;

  const result = await locals.db.delete(oauthApplications).where(eq(oauthApplications.id, id));

  if (result.rowCount === 0) {
    locals.sendFlashMessage({
      title: 'Error',
      description: 'Application not found or you do not have permission to delete it.'
    });
    error(404, 'Application not found');
  }

  redirect(303, '/developer');
});
