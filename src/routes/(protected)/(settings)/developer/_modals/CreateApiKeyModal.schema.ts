import z from 'zod';

export const CreateApiKeyFormSchema = z.object({
  name: z.string().min(1).max(100)
});
