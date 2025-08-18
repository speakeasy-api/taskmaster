import { base64Url } from '@better-auth/utils/base64';
import { createHash } from '@better-auth/utils/hash';
import type { OIDCOptions } from './types';
import type { WithRequired } from 'better-auth/client';
import type { GenericEndpointContext } from 'better-auth/types';
import { symmetricDecrypt } from 'better-auth/crypto';

/**
 * Default client secret hasher using SHA-256
 */
export const defaultClientSecretHasher = async (clientSecret: string) => {
  const hash = await createHash('SHA-256').digest(new TextEncoder().encode(clientSecret));
  const hashed = base64Url.encode(new Uint8Array(hash), {
    padding: false
  });
  return hashed;
};

/**
 * Get options for the OIDC provider with default values populated.
 */
export function getPopulatedOptions(options: OIDCOptions): OIDCOptionsWithDefaults {
  return {
    codeExpiresIn: 600,
    defaultScope: 'openid',
    accessTokenExpiresIn: 3600,
    refreshTokenExpiresIn: 604800,
    allowPlainCodeChallengeMethod: true,
    storeClientSecret: 'plain' as const,
    ...options,
    scopes: ['openid', 'profile', 'email', 'offline_access', ...(options?.scopes || [])]
  };
}

export type OIDCOptionsWithDefaults = WithRequired<
  OIDCOptions,
  | 'codeExpiresIn'
  | 'defaultScope'
  | 'accessTokenExpiresIn'
  | 'refreshTokenExpiresIn'
  | 'allowPlainCodeChallengeMethod'
  | 'storeClientSecret'
  | 'scopes'
>;

/**
 * Verify stored client secret against provided client secret
 */
export async function verifyStoredClientSecret(
  ctx: GenericEndpointContext,
  storedClientSecret: string,
  clientSecret: string,
  opts: OIDCOptions
): Promise<boolean> {
  if (opts.storeClientSecret === 'encrypted') {
    return (
      (await symmetricDecrypt({
        key: ctx.context.secret,
        data: storedClientSecret
      })) === clientSecret
    );
  }

  if (opts.storeClientSecret === 'hashed') {
    const hashedClientSecret = await defaultClientSecretHasher(clientSecret);
    return hashedClientSecret === storedClientSecret;
  }

  if (typeof opts.storeClientSecret === 'object' && 'hash' in opts.storeClientSecret) {
    const hashedClientSecret = await opts.storeClientSecret.hash(clientSecret);
    return hashedClientSecret === storedClientSecret;
  }

  if (typeof opts.storeClientSecret === 'object' && 'decrypt' in opts.storeClientSecret) {
    const decryptedClientSecret = await opts.storeClientSecret.decrypt(storedClientSecret);
    return decryptedClientSecret === clientSecret;
  }

  return clientSecret === storedClientSecret;
}
