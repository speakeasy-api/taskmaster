import { APIError } from 'better-auth/api';
import { generateRandomString } from 'better-auth/crypto';
import { getJwtToken, type jwt } from 'better-auth/plugins/jwt';
import { getMetadata } from 'better-auth/plugins/oidc-provider';
import type { OIDCOptionsWithDefaults } from '../../utils.js';
import {
  AuthorizationCodeRequestBodySchema,
  BaseTokenRequestBodySchema,
  GrantType,
  PartialClientCredentialsSchema,
  type AuthorizationCodeRequestBody,
  type PartialClientCredentials,
  type TokenEndpointContext
} from './types';

export async function getGrantType(request: Request): Promise<GrantType> {
  const reqClone = request.clone();
  const contentType = reqClone.headers.get('content-type');

  if (!contentType)
    throw new APIError('BAD_REQUEST', {
      code: 'invalid_request',
      message: 'Content-Type must be set to application/x-www-form-urlencoded or application/json'
    });

  let body: unknown;
  if (contentType.includes('application/x-www-form-urlencoded')) {
    body = Object.fromEntries(await reqClone.formData());
  } else if (contentType.includes('application/json')) {
    body = await reqClone.json();
  } else {
    throw new APIError('BAD_REQUEST', {
      code: 'invalid_request',
      message: 'Content-Type must be set to application/x-www-form-urlencoded or application/json'
    });
  }

  const bodyParseResult = BaseTokenRequestBodySchema.safeParse(body);

  if (!bodyParseResult.success) {
    throw new APIError('BAD_REQUEST', {
      code: 'unsupported_grant_type',
      message: `unsupported grant type`
    });
  }

  return bodyParseResult.data.grant_type;
}

export async function extractClientCredentials(
  request: Request
): Promise<PartialClientCredentials> {
  // First, try to extract from Authorization header (Basic auth)
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Basic ')) {
    try {
      const base64Credentials = authHeader.split(' ')[1];
      const credentials = atob(base64Credentials).split(':');
      if (credentials.length === 2) {
        return { client_id: credentials[0], client_secret: credentials[1] };
      }
    } catch {
      throw new APIError('BAD_REQUEST', {
        code: 'invalid_request',
        message: 'Invalid client credentials format in Authorization header'
      });
    }
  }

  // If not found in header, try request body
  const reqClone = request.clone();
  const contentType = reqClone.headers.get('content-type');

  const result: PartialClientCredentials = { client_id: null, client_secret: null };

  if (!contentType) return result;

  let body: Record<string, FormDataEntryValue> | null = null;
  if (contentType.includes('application/x-www-form-urlencoded')) {
    body = Object.fromEntries(await reqClone.formData());
  } else if (contentType.includes('application/json')) {
    body = await reqClone.json();
  }

  const parseResult = PartialClientCredentialsSchema.safeParse(body);

  if (!parseResult.success) {
    throw new APIError('BAD_REQUEST', {
      code: 'invalid_request',
      message: 'Invalid client credentials format'
    });
  }

  return parseResult.data;
}

export async function generateIdToken(params: {
  ctx: TokenEndpointContext;
  userId: string;
  clientId: string;
  opts: OIDCOptionsWithDefaults;
  token: string;
}): Promise<string | null> {
  const { ctx, userId, clientId, opts, token } = params;

  if (!opts.useJWTPlugin) {
    console.error('JWT plugin is not enabled, cannot generate ID token');
    throw new APIError('INTERNAL_SERVER_ERROR');
  }

  const jwtPlugin = ctx.context.options.plugins?.find(
    (plugin) => plugin.id === 'jwt'
  ) as ReturnType<typeof jwt>;

  if (!jwtPlugin) {
    return null;
  }

  const user = await ctx.context.internalAdapter.findUserById(userId);
  if (!user) {
    return null;
  }

  const metadata = getMetadata(ctx, opts);
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 3600; // ID tokens typically expire in 1 hour

  // Build the ID token claims
  const claims: Record<string, unknown> = {
    sub: user.id,
    iss: metadata.issuer,
    aud: clientId,
    exp: now + expiresIn,
    iat: now,
    auth_time: now
  };

  // Add profile claims if profile scope is requested
  if (opts.scopes.includes('profile') && user.name) {
    claims.name = user.name;
    const nameParts = user.name.split(' ');
    if (nameParts.length > 0) claims.given_name = nameParts[0];
    if (nameParts.length > 1) claims.family_name = nameParts.slice(1).join(' ');
  }

  // Add email claims if email scope is requested
  if (opts.scopes.includes('email') && user.email) {
    claims.email = user.email;
    claims.email_verified = user.emailVerified || false;
  }

  // Add picture if available and profile scope is requested
  if (opts.scopes.includes('profile') && user.image) {
    claims.picture = user.image;
  }

  try {
    return getJwtToken({
      ...ctx,
      context: {
        ...ctx.context,
        session: {
          session: {
            id: generateRandomString(32, 'a-z', 'A-Z'),
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: user.id,
            expiresAt: new Date(Date.now() + opts.accessTokenExpiresIn * 1000),
            token,
            ipAddress: ctx.request?.headers.get('x-forwarded-for')
          },
          user
        }
      }
    });
  } catch (error) {
    console.error('Error signing ID token:', error);
    return null;
  }
}

export async function parseRequestBody(
  request: Request,
  expectedGrantType?: GrantType
): Promise<AuthorizationCodeRequestBody | Record<string, unknown>> {
  const reqClone = request.clone();
  const contentType = reqClone.headers.get('content-type');

  if (!contentType) {
    throw new APIError('BAD_REQUEST', {
      code: 'invalid_request',
      message: 'Content-Type must be set to application/x-www-form-urlencoded or application/json'
    });
  }

  let body: unknown;
  if (contentType.includes('application/x-www-form-urlencoded')) {
    body = Object.fromEntries(await reqClone.formData());
  } else if (contentType.includes('application/json')) {
    body = await reqClone.json();
  } else {
    throw new APIError('BAD_REQUEST', {
      code: 'invalid_request',
      message: 'Content-Type must be set to application/x-www-form-urlencoded or application/json'
    });
  }

  if (expectedGrantType === 'authorization_code') {
    const parseResult = AuthorizationCodeRequestBodySchema.safeParse(body);
    if (!parseResult.success) {
      throw new APIError('BAD_REQUEST', {
        code: 'invalid_request',
        message: 'Invalid authorization code request format'
      });
    }
    return parseResult.data;
  }

  return body as Record<string, unknown>;
}

export async function validateCodeChallenge(
  codeVerifier: string,
  codeChallenge: string,
  codeChallengeMethod: 'plain' | 'S256' = 'S256'
): Promise<boolean> {
  if (codeChallengeMethod === 'plain') {
    return codeVerifier === codeChallenge;
  }

  if (codeChallengeMethod === 'S256') {
    const encoded = new TextEncoder().encode(codeVerifier);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
    const b64 = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    return b64 === codeChallenge;
  }

  return false;
}
