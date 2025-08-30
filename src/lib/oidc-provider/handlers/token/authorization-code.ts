import { getClient, type CodeVerificationValue } from '../../index.js';
import { verifyStoredClientSecret, type OIDCOptionsWithDefaults } from '../../utils.js';
import { APIError } from 'better-auth/api';
import { generateRandomString } from 'better-auth/crypto';
import {
  extractClientCredentials,
  generateAccessToken,
  parseRequestBody,
  validateCodeChallenge
} from './common';
import type { AuthorizationCodeRequestBody, TokenEndpointContext } from './types';

export async function handleAuthorizationCodeFlow(
  ctx: TokenEndpointContext,
  opts: OIDCOptionsWithDefaults
) {
  // !TODO: Validate request body content type
  const requestBody = (await parseRequestBody(
    ctx.request,
    'authorization_code'
  )) as AuthorizationCodeRequestBody;

  const { client_id: clientId, client_secret: clientSecret } = await extractClientCredentials(
    ctx.request
  );

  if (!clientId) {
    throw new APIError('BAD_REQUEST', {
      code: 'invalid_client',
      message: 'Client authentication required'
    });
  }

  // Retrieve the client
  const client = await getClient(clientId, ctx.context.adapter);
  if (!client || client.disabled) {
    throw new APIError('BAD_REQUEST', {
      code: 'invalid_client',
      message: 'Invalid client credentials'
    });
  }

  // Verify client secret if provided
  if (clientSecret && client.clientSecret) {
    const validClientSecret = await verifyStoredClientSecret(
      ctx,
      client.clientSecret,
      clientSecret,
      opts
    );
    if (!validClientSecret) {
      throw new APIError('BAD_REQUEST', {
        code: 'invalid_client',
        message: 'Invalid client credentials'
      });
    }
  } else if (client.type !== 'public' && !clientSecret) {
    throw new APIError('BAD_REQUEST', {
      code: 'invalid_client',
      message: 'Client authentication required for confidential clients'
    });
  }

  // Retrieve and validate the authorization code
  const verification = await ctx.context.internalAdapter.findVerificationValue(requestBody.code);
  if (!verification) {
    throw new APIError('BAD_REQUEST', {
      code: 'invalid_grant',
      message: 'Invalid authorization code'
    });
  }

  if (verification.expiresAt < new Date()) {
    await ctx.context.internalAdapter.deleteVerificationValue(verification.id);
    throw new APIError('BAD_REQUEST', {
      code: 'invalid_grant',
      message: 'Authorization code expired'
    });
  }

  const codeData = JSON.parse(verification.value) as CodeVerificationValue;

  // Validate that the client matches
  if (codeData.clientId !== clientId) {
    throw new APIError('BAD_REQUEST', {
      code: 'invalid_grant',
      message: 'Authorization code was not issued to this client'
    });
  }

  // Validate redirect_uri if provided
  if (requestBody.redirect_uri && requestBody.redirect_uri !== codeData.redirectURI) {
    throw new APIError('BAD_REQUEST', {
      code: 'invalid_grant',
      message: 'Redirect URI mismatch'
    });
  }

  // Validate PKCE if code challenge was used
  if (codeData.codeChallenge && codeData.codeChallengeMethod) {
    if (!requestBody.code_verifier) {
      throw new APIError('BAD_REQUEST', {
        code: 'invalid_request',
        message: 'Code verifier required for PKCE'
      });
    }

    const isValidChallenge = await validateCodeChallenge(
      requestBody.code_verifier,
      codeData.codeChallenge,
      'S256'
    );

    if (!isValidChallenge) {
      throw new APIError('BAD_REQUEST', {
        code: 'invalid_grant',
        message: 'Invalid code verifier'
      });
    }
  }

  // Clean up the authorization code (single use)
  await ctx.context.internalAdapter.deleteVerificationValue(verification.id);

  // Generate tokens
  // const accessToken = generateRandomString(32, 'a-z', 'A-Z');
  const accessTokenExpiresAt = new Date(Date.now() + opts.accessTokenExpiresIn * 1000);
  let refreshToken: string | null = null;
  let refreshTokenExpiresAt: Date | null = null;

  // Generate refresh token if offline_access scope is present
  if (codeData.scope.includes('offline_access')) {
    refreshToken = generateRandomString(32, 'a-z', 'A-Z');
    refreshTokenExpiresAt = new Date(Date.now() + opts.refreshTokenExpiresIn * 1000);
  }

  // Generate ID token if openid scope is present
  const accessToken = await generateAccessToken({
    ctx,
    userId: codeData.userId,
    clientId: client.clientId,
    opts,
    expiresAt: accessTokenExpiresAt
  });

  // Store the access token
  await ctx.context.adapter.create({
    model: 'oauthAccessToken',
    data: {
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      clientId: client.clientId,
      userId: codeData.userId,
      scopes: codeData.scope.join(' '),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });

  const tokenResponse: Record<string, unknown> = {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: opts.accessTokenExpiresIn
  };

  if (refreshToken) {
    tokenResponse.refresh_token = refreshToken;
  }

  return ctx.json(tokenResponse, {
    headers: {
      'Cache-Control': 'no-store',
      Pragma: 'no-cache'
    }
  });
}
