import { getRequestEvent } from '$app/server';
import type { RouteId } from '$app/types';

export function createUserIdGetter(
  strategy: 'session' | 'bearer' | 'apiKey'
): () => Promise<string> {
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

  if (strategy === 'apiKey') {
    return async () => {
      const { user } = await locals.validateApiKey();
      return user.id;
    };
  }

  throw new Error('Invalid authentication strategy');
}

const PROTECTED_APP_PREFIXES: RouteId[] = ['/(protected)'] as const;
const PROTECTED_API_PREFIXES: RouteId[] = ['/api/(protected)'];

/** Determine the authentication type required for the current request's route. */
export const getAuthTypeForRoute = (): 'session' | 'bearer' | 'apiKey' | 'none' => {
  const { route, isRemoteRequest, request } = getRequestEvent();

  if (isRemoteRequest) return 'session';

  const isAppRequest = PROTECTED_APP_PREFIXES.some((prefix) => route.id?.startsWith(prefix));
  if (isAppRequest) return 'session';

  const isApiRoute = PROTECTED_API_PREFIXES.some((prefix) => route.id?.startsWith(prefix));
  if (isApiRoute) {
    if (request.headers.get('x-api-key')) return 'apiKey';
    else return 'bearer';
  }

  if (route.id?.includes('(protected)'))
    throw new Error(
      `Resource is protected but does not match any known authentication strategies.`
    );

  return 'none';
};
