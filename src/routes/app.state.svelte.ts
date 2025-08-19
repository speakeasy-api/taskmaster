import { authClient } from '$lib/auth-client';
import type { Session, User } from 'better-auth';
import type { BetterFetchError } from 'better-auth/svelte';
import { getContext, onMount, setContext } from 'svelte';
import { createToaster } from '@skeletonlabs/skeleton-svelte';

class AuthState {
  user: User | null = $state(null);
  session: Session | null = $state(null);
  error: BetterFetchError | null = $state(null);
  isPending: boolean = $state(true);
  isRefetching: boolean = $state(false);

  constructor() {
    onMount(() => {
      const unsubscribe = authClient.useSession().subscribe((result) => {
        this.session = result.data?.session ?? null;
        this.user = result.data?.user ?? null;
        this.error = result.error;
        this.isPending = result.isPending;
        this.isRefetching = result.isRefetching;
      });

      window.addEventListener('beforeunload', unsubscribe);
      return () => {
        window.removeEventListener('beforeunload', unsubscribe);
      };
    });
  }
}

export class AppState {
  private constructor(
    public auth: AuthState = new AuthState(),
    public toaster = createToaster({ max: 5, overlap: true, placement: 'bottom-end' })
  ) {
    // Private constructor to prevent instantiation
  }

  public static init(): AppState {
    return setContext('appState', new AppState());
  }

  public static get(): AppState {
    return getContext<AppState>('appState');
  }

  public static getAuth(): AuthState {
    return AppState.get().auth;
  }

  public static getToaster(): ReturnType<typeof createToaster> {
    return AppState.get().toaster;
  }
}
