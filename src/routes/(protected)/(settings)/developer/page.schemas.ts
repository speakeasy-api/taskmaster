import z from 'zod';

export const DeleteApiKeyFormSchema = z.object({
  id: z.string()
});
