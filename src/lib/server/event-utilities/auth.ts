import { getRequestEvent } from '$app/server';
import type { RouteId } from '$app/types';

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

const SESSION_PROTECTED_ROUTE_ID_PREFIXES: RouteId[] = ['/(protected)'] as const;
const BEARER_PROTECTED_ROUTE_ID_PREFIXES: RouteId[] = ['/api/(protected)'];

/** Determine the authentication type required for the current request's route. */
export const getAuthTypeForRoute = (): 'session' | 'bearer' | 'none' => {
  const { route, isRemoteRequest } = getRequestEvent();

  if (isRemoteRequest) return 'session';

  const isSessionProtected = SESSION_PROTECTED_ROUTE_ID_PREFIXES.some((prefix) =>
    route.id?.startsWith(prefix)
  );
  if (isSessionProtected) return 'session';

  const isBearerProtected = BEARER_PROTECTED_ROUTE_ID_PREFIXES.some((prefix) =>
    route.id?.startsWith(prefix)
  );
  if (isBearerProtected) return 'bearer';

  if (route.id?.includes('(protected)'))
    throw new Error(
      `Resource is protected but does not match any known authentication strategies.`
    );

  return 'none';
};
