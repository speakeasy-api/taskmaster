import z from 'zod';

// OAuth Application schemas
export const RegisterOAuthAppRequest = z.object({
  name: z.string().min(1, 'Name is required'),
  redirectUrl: z.string().url('Invalid URL').optional()
});
export type RegisterOAuthAppRequest = z.infer<typeof RegisterOAuthAppRequest>;
