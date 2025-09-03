<script lang="ts">
  import LogOut from '@lucide/svelte/icons/log-out';
  import { Popover } from '@skeletonlabs/skeleton-svelte';
  import { authClient } from '$lib/auth-client';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  let { user } = $props<{ user: { name: string; email: string } }>();

  async function handleSignOut() {
    try {
      await authClient.signOut();
      goto(resolve('/sign-in'));
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }

  function getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
</script>

<div data-popover>
  <Popover
    triggerBase="btn w-full justify-start p-2 text-sm hover:cursor-pointer hover:bg-surface-100-900 preset-outlined-surface-200-800">
    {#snippet trigger()}
      <div
        class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-xs font-semibold text-white">
        {getInitials(user.name)}
      </div>
      <div class="flex min-w-0 flex-1 flex-col items-start">
        <span class="max-w-full truncate text-sm font-medium">{user.name}</span>
        <span class="max-w-full truncate text-xs text-surface-500">{user.email}</span>
      </div>
    {/snippet}

    {#snippet content()}
      <div
        class="min-w-56 rounded-lg border border-surface-200-800 bg-surface-50-950 p-2 shadow-xs">
        <div class="border-b border-surface-200-800 px-3 py-2">
          <p class="text-sm font-medium">{user.name}</p>
          <p class="text-xs text-surface-500">{user.email}</p>
        </div>
        <div class="py-1">
          <button
            class="btn w-full preset-outlined-error-500 btn-sm text-error-500"
            onclick={handleSignOut}>
            <LogOut class="mr-2 h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    {/snippet}
  </Popover>
</div>
