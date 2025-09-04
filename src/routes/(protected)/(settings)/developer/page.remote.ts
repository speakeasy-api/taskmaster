import { form, getRequestEvent } from '$app/server';
import { auth } from '$lib/auth';
import { validateForm } from '$lib/server/remote-fns';
import z from 'zod';

const DeleteApiKeyFormSchema = z.object({
  id: z.string()
});

export const deleteApiKey = form(async (form): Promise<{ success: boolean }> => {
  const { locals, request } = getRequestEvent();

  const formValidation = validateForm(form, DeleteApiKeyFormSchema);
  if (!formValidation.success) {
    locals.logError('Could not delete API Key - Invalid form submission', formValidation.error);
    locals.sendFlashMessage({
      title: 'Error',
      description: 'Could not delete API key. Please inform customer support.'
    });
    return { success: false };
  }

  const result = await auth.api.deleteApiKey({
    body: { keyId: formValidation.data.id },
    headers: request.headers
  });

  if (!result.success) {
    locals.sendFlashMessage({
      title: 'Error',
      description: 'Failed to delete API key'
    });
    return { success: false };
  }

  return { success: true };
});
