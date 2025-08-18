import type { OIDCOptions } from '../../index.js';
import { getPopulatedOptions } from '../../utils.js';
import { APIError } from 'better-auth/api';
import { handleAuthorizationCodeFlow } from './authorization-code';
import { handleClientCredentialsFlow } from './client-credentials';
import { getGrantType } from './common';
import type { TokenEndpointContext } from './types';

export async function handleTokenRequest(ctx: TokenEndpointContext, options: OIDCOptions) {
  const grantType = await getGrantType(ctx.request);
  const opts = getPopulatedOptions(options);

  switch (grantType) {
    case 'client_credentials':
      return handleClientCredentialsFlow(ctx, opts);
    case 'authorization_code':
      return handleAuthorizationCodeFlow(ctx, opts);
    default:
      throw new APIError('BAD_REQUEST', {
        code: 'unsupported_grant_type',
        message: `Unsupported grant type: ${grantType}`
      });
  }
}
