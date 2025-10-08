import { form, getRequestEvent } from '$app/server';
import { auth } from '$lib/auth';
import { CreateApiKeyFormSchema } from './CreateApiKeyModal.schema';

export const createApiKey = form(CreateApiKeyFormSchema, async (data) => {
  const { request } = getRequestEvent();

  const result = await auth.api.createApiKey({
    body: { ...data },
    headers: request.headers
  });

  return {
    success: true,
    data: result
  };
});
