import { BETTER_AUTH_SECRET, BETTER_AUTH_URL } from '$env/static/private';
import { db } from '$lib/db';
import { generateRandomString, symmetricDecrypt } from 'better-auth/crypto';
import { SignJWT, createRemoteJWKSet, importJWK, jwtVerify, type JWTPayload } from 'jose';

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

/**
 * Generate a random string of specified length and character set.
 *
 * Pass a time span like '1h', '30m', '15s' to the expiresIn parameter. Default is '1h'.
 */
export async function generateJwt(params: { userId: string; expiresIn?: string }): Promise<string> {
  const storedPk = await db.query.jwkss.findFirst();

  if (!storedPk) {
    throw new Error('JWKs not found in the database');
  }

  const decryptedKey = await symmetricDecrypt({
    key: BETTER_AUTH_SECRET,
    data: JSON.parse(storedPk.privateKey)
  });

  const privateKey = await importJWK(JSON.parse(decryptedKey), 'ES256');

  const jwt = new SignJWT()
    .setProtectedHeader({
      alg: 'ES256',
      kid: storedPk.id
    })
    .setSubject(params.userId)
    .setIssuer(BETTER_AUTH_URL)
    .setAudience(BETTER_AUTH_URL)
    .setIssuedAt()
    .setExpirationTime(params.expiresIn ?? '1h')
    .setJti(generateRandomString(32, 'a-z', 'A-Z'));

  return await jwt.sign(privateKey);
}
