import z from 'zod';

export const CreateApiKeyFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(30, 'Must be no more than 30 characters')
});
