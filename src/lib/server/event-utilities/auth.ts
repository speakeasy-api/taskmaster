import { getRequestEvent } from '$app/server';

export function createUserIdGetter(strategy: 'session' | 'bearer'): () => Promise<string> {
  const { locals } = getRequestEvent();

  if (strategy === 'session') {
    return async () => {
      const { user } = await locals.validateSession();
      return user.id;
    };
  }

  if (strategy === 'bearer') {
    return async () => {
      const { user } = await locals.validateBearerToken();
      return user.id;
    };
  }

  throw new Error('Invalid authentication strategy');
}
// export async function getAuthenticatedUserId(): Promise<string> {
//   const { locals } = getRequestEvent();
//
//   // First try to get from bearer token validation (for API routes)
//   try {
//     const { jwt } = await locals.validateBearerToken();
//     const jwtPayload = await verifyJwt(jwt);
//
//     if (!jwtPayload.valid || !jwtPayload.payload?.sub) {
//       throw new Error('Invalid JWT token - no user ID found');
//     }
//
//     return jwtPayload.payload.sub as string;
//   } catch (bearerError) {
//     // Fall back to session validation (for protected app routes)
//     try {
//       const session = await locals.validateSession();
//       return session.user.id;
//     } catch (sessionError) {
//       throw new Error('No valid authentication context found');
//     }
//   }
// }
