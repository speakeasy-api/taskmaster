import { form, getRequestEvent } from '$app/server';
import { auth } from '$lib/auth';
import { DeleteApiKeyFormSchema } from './page.schemas';

export const deleteApiKey = form(
  DeleteApiKeyFormSchema,
  async (data): Promise<{ success: boolean }> => {
    const { locals, request } = getRequestEvent();

    const result = await auth.api.deleteApiKey({
      body: { keyId: data.id },
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
  }
);
