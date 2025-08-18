import { eq, and } from 'drizzle-orm';
import { db } from './index.js';
import { oauthApplication } from './schemas/auth.js';

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createOAuthApp(userId: string, name: string, redirectUrls: string[]) {
  const clientId = generateRandomString(32);
  const clientSecret = generateRandomString(64);

  const [newApp] = await db
    .insert(oauthApplication)
    .values({
      id: generateRandomString(32),
      name,
      clientId,
      clientSecret,
      redirectURLs: JSON.stringify(redirectUrls),
      type: 'confidential',
      disabled: false,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .returning();

  return newApp;
}

export async function getOAuthAppsByUserId(userId: string) {
  return await db
    .select()
    .from(oauthApplication)
    .where(eq(oauthApplication.userId, userId))
    .orderBy(oauthApplication.createdAt);
}

export async function deleteOAuthApp(appId: string, userId: string) {
  await db
    .delete(oauthApplication)
    .where(and(eq(oauthApplication.id, appId), eq(oauthApplication.userId, userId)));
}

export async function getOAuthAppById(appId: string, userId: string) {
  const [app] = await db
    .select()
    .from(oauthApplication)
    .where(and(eq(oauthApplication.id, appId), eq(oauthApplication.userId, userId)));

  return app;
}
