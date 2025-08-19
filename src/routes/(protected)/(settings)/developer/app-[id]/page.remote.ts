import { form, getRequestEvent } from '$app/server';
import { db } from '$lib/db';
import { oauthApplication } from '$lib/db/schemas/auth';
import { fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { DeleteApplicationRequest } from './page.schemas';
import { handleDatabaseError, validateForm } from '$lib/util.server';

export const deleteApp = form(async (formData) => {
  const { locals } = getRequestEvent();
  const { user } = await locals.validateSession();

  const validatedReq = validateForm(formData, DeleteApplicationRequest);

  if (!validatedReq.success) {
    return fail(400, { message: 'Invalid request data' });
  }

  const { id } = validatedReq.data;

  const result = await db
    .delete(oauthApplication)
    .where(and(eq(oauthApplication.userId, user.id), eq(oauthApplication.id, id)));

  const error = handleDatabaseError(result.rowCount, 'OAuth application not found');
  if (error) return error;

  redirect(303, '/developer');
});
