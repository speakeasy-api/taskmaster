import { form, getRequestEvent } from '$app/server';
import { auth } from '$lib/auth';
import { validateForm } from '$lib/server/remote-fns';
import { CreateApiKeyFormSchema } from './CreateApiKeyModal.schema';

export const createApiKey = form(async (form) => {
  const { request } = getRequestEvent();

  const formValidation = validateForm(form, CreateApiKeyFormSchema);
  if (!formValidation.success) {
    return {
      success: false,
      message: 'There were errors with your submission',
      errors: formValidation.error.flatten().fieldErrors
    };
  }

  const result = await auth.api.createApiKey({
    body: { ...formValidation.data },
    headers: request.headers
  });

  return {
    success: true,
    data: result
  };
});
