import { BETTER_AUTH_URL } from '$env/static/private';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

const JWKS = createRemoteJWKSet(new URL(`${BETTER_AUTH_URL}/api/auth/jwks`));

type VerifyJwtResult =
  | {
      valid: true;
      payload: JWTPayload;
    }
  | {
      valid: false;
      error: unknown;
    };

export const verifyJwt = async (token: string): Promise<VerifyJwtResult> => {
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      algorithms: ['ES256'],
      issuer: BETTER_AUTH_URL,
      audience: BETTER_AUTH_URL,
      requiredClaims: ['sub', 'iat', 'exp']
    });
    return { valid: true, payload };
  } catch (err) {
    console.error('JWT verification error:', err);
    return { valid: false, error: err };
  }
};
