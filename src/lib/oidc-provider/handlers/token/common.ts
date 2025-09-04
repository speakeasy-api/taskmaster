import { BETTER_AUTH_URL } from '$env/static/private';
import { APIError } from 'better-auth/api';
import { generateRandomString } from 'better-auth/crypto';
import { getJwtToken, type jwt } from 'better-auth/plugins/jwt';
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

export async function generateAccessToken(params: {
  ctx: TokenEndpointContext;
  userId: string;
  clientId: string;
  opts: OIDCOptionsWithDefaults;
  expiresAt: Date;
}): Promise<string> {
  const { ctx, userId } = params;

  const jwtPlugin = ctx.context.options.plugins?.find((plugin) => {
    return plugin.id === 'jwt';
  }) as ReturnType<typeof jwt>;

  if (!jwtPlugin) {
    throw ctx.error('INTERNAL_SERVER_ERROR', {
      message: 'JWT plugin is not configured'
    });
  }

  const user = await ctx.context.internalAdapter.findUserById(userId);
  if (!user) {
    throw ctx.error('BAD_REQUEST', {
      code: 'invalid_request',
      message: 'User not found'
    });
  }

  const result = await getJwtToken(
    {
      ...ctx,
      context: {
        ...ctx.context,
        session: {
          session: {
            id: 'does-not-matter',
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: user.id,
            expiresAt: new Date(),
            token: 'does-not-matter',
            ipAddress: 'does-not-matter'
          },
          user
        }
      }
    },
    {
      jwt: {
        definePayload: (params) => {
          return {
            iss: BETTER_AUTH_URL,
            aud: BETTER_AUTH_URL,
            sub: params.session.userId,
            iat: Math.floor(Date.now() / 1000),
            exp:
              Math.floor((params.session.expiresAt.getTime() - Date.now()) / 1000) +
              Math.floor(Date.now() / 1000),
            jti: generateRandomString(32, 'a-z', 'A-Z')
          };
        }
      },
      jwks: {
        keyPairConfig: {
          alg: 'ES256'
        }
      }
    }
  );

  return result;
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
