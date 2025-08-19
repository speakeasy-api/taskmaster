import { z } from 'zod';

export const DeleteAccountRequest = z.object({
  confirmText: z
    .string()
    .min(1, 'Confirmation text is required')
    .refine((val) => val === 'DELETE', {
      message: 'You must type "DELETE" to confirm account deletion'
    })
});

export type DeleteAccountRequest = z.infer<typeof DeleteAccountRequest>;
