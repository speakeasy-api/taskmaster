import type { AuthContext, EndpointContext } from 'better-auth';
import z from 'zod';

export type TokenEndpointContext = EndpointContext<
  '/oauth2/token',
  { method: 'POST'; requireRequest: true },
  AuthContext
>;

export const GrantType = z.enum(['client_credentials', 'authorization_code']);
export type GrantType = z.infer<typeof GrantType>;

export const BaseTokenRequestBodySchema = z.object({
  grant_type: GrantType
});

export const PartialClientCredentialsSchema = z.object({
  client_id: z.string().nullable().default(null),
  client_secret: z.string().nullable().default(null)
});

export type PartialClientCredentials = z.infer<typeof PartialClientCredentialsSchema>;

export const AuthorizationCodeRequestBodySchema = z.object({
  grant_type: z.literal('authorization_code'),
  code: z.string(),
  redirect_uri: z.string().optional(),
  client_id: z.string().optional(),
  client_secret: z.string().optional(),
  code_verifier: z.string().optional()
});

export type AuthorizationCodeRequestBody = z.infer<typeof AuthorizationCodeRequestBodySchema>;
