import { db } from '$lib/db';
import type { oauthAccessToken } from '$lib/db/schemas/auth';
import type { InferSelectModel } from 'drizzle-orm';

export async function validateAuthHeader(
  authHeader: string | null
): Promise<InferSelectModel<typeof oauthAccessToken> | false> {
  if (!authHeader) return false;
  if (!authHeader.startsWith('Bearer ')) return false;

  const parts = authHeader.split(' ');

  if (parts.length !== 2) return false;
  const providedToken = parts[1];

  const storedToken = await db.query.oauthAccessToken.findFirst({
    where: (table, { eq }) => eq(table.accessToken, providedToken)
  });
  if (!storedToken) return false;

  return storedToken;
}
