import { form, getRequestEvent } from '$app/server';
import { oauthApplications } from '$lib/db/schemas/auth';
import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { DeleteApplicationRequest } from './page.schemas';

export const deleteApp = form(DeleteApplicationRequest, async (data) => {
  const { locals } = getRequestEvent();

  const { id } = data;

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
