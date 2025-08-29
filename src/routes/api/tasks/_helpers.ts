import { db } from '$lib/db';
import type { oauthAccessTokens } from '$lib/db/schemas/auth';
import type { InferSelectModel } from 'drizzle-orm';

export async function validateAuthHeader(
  authHeader: string | null
): Promise<InferSelectModel<typeof oauthAccessTokens> | false> {
  if (!authHeader) return false;
  if (!authHeader.startsWith('Bearer ')) return false;

  const parts = authHeader.split(' ');

  if (parts.length !== 2) return false;
  const providedToken = parts[1];

  const storedToken = await db.query.oauthAccessTokens.findFirst({
    where: (table, { eq }) => eq(table.accessToken, providedToken)
  });
  if (!storedToken) return false;

  return storedToken;
}
