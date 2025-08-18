import { command, form, getRequestEvent, prerender } from '$app/server';
import { auth } from '$lib/auth';
import { db } from '$lib/db';
import { oauthApplication } from '$lib/db/schemas/auth';
import { error, fail } from '@sveltejs/kit';
import { and, desc, eq } from 'drizzle-orm';
import { RegisterOAuthAppRequest, DeleteOAuthAppRequest } from './developer.schemas';
import { validateForm } from './utils';

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
    console.error('Failed to register OAuth application:', err);
    error(500, 'Failed to register OAuth application');
  }
});

export const getOAuthApplications = prerender(async () => {
  const { user } = await getRequestEvent().locals.validateSession();

  const applications = await db
    .select()
    .from(oauthApplication)
    .where(eq(oauthApplication.userId, user.id))
    .orderBy(desc(oauthApplication.createdAt));

  return applications;
});

export const deleteOAuthApplication = form(async (formData) => {
  const { user } = await getRequestEvent().locals.validateSession();

  const validatedReq = validateForm(formData, DeleteOAuthAppRequest);

  if (!validatedReq.success) {
    return fail(400, { message: 'Invalid request data' });
  }

  const { id } = validatedReq.data;

  const result = await db
    .delete(oauthApplication)
    .where(and(eq(oauthApplication.id, id), eq(oauthApplication.userId, user.id)));

  if (result.rowCount === 0) {
    return fail(404, { message: 'OAuth application not found' });
  }

  return { success: true };
});
