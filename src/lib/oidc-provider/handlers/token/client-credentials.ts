import { getClient } from '../../index.js';
import { verifyStoredClientSecret, type OIDCOptionsWithDefaults } from '../../utils.js';
import { APIError } from 'better-auth/api';
import { generateRandomString } from 'better-auth/crypto';
import { extractClientCredentials } from './common';
import type { TokenEndpointContext } from './types';

export async function handleClientCredentialsFlow(
  ctx: TokenEndpointContext,
  opts: OIDCOptionsWithDefaults
) {
  const { client_id: clientId, client_secret: clientSecret } = await extractClientCredentials(
    ctx.request
  );

  if (!clientId || !clientSecret) {
    throw new APIError('BAD_REQUEST', {
      code: 'invalid_client',
      message: 'Client authentication required'
    });
  }

  const client = await getClient(clientId, ctx.context.adapter);

  if (!client || client.disabled || !client.clientSecret) {
    throw ctx.error('BAD_REQUEST', {
      code: 'invalid_client',
      message: 'invalid client credentials'
    });
  }

  const validClientSecret = await verifyStoredClientSecret(
    ctx,
    client.clientSecret,
    clientSecret,
    opts
  );

  if (!validClientSecret) {
    throw ctx.error('BAD_REQUEST', {
      code: 'invalid_client',
      message: 'invalid client credentials'
    });
  }

  const accessToken = generateRandomString(32, 'a-z', 'A-Z');
  const accessTokenExpiresAt = new Date(Date.now() + opts.accessTokenExpiresIn * 1000);

  // Generate ID token if user ID is available and openid scope is present
  const idToken: string | null = null;
  // if (client.userId && opts.scopes.includes('openid')) {
  //   idToken = await generateIdToken({
  //     ctx,
  //     userId: client.userId,
  //     clientId: client.clientId,
  //     opts,
  //     token: accessToken
  //   });
  // }

  await ctx.context.adapter.create({
    model: 'oauthAccessToken',
    data: {
      accessToken,
      accessTokenExpiresAt,
      clientId: client.clientId,
      userId: client.userId,
      scopes: opts.scopes.join(' '),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });

  const tokenResponse: Record<string, unknown> = {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: opts.accessTokenExpiresIn
  };

  // Include ID token if generated
  tokenResponse.id_token = idToken;

  return ctx.json(tokenResponse, {
    headers: {
      'Cache-Control': 'no-store',
      Pragma: 'no-cache'
    }
  });
}
