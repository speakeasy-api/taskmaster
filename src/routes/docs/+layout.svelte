<script lang="ts">
  import SquareAsteriskIcon from '@lucide/svelte/icons/square-asterisk';
  import ArrowLeftRightIcon from '@lucide/svelte/icons/arrow-left-right';
  import { page } from '$app/state';
  import type { Component } from 'svelte';
  import type { LayoutProps } from './$types';
  import { resolve } from '$app/paths';

  let { children }: LayoutProps = $props();
</script>

{#snippet navLink(href: string, label: string, Icon?: Component)}
  <li>
    <a
      class="btn w-full justify-start p-2 text-sm hover:cursor-pointer hover:bg-surface-100-900"
      class:preset-tonal={page.url.pathname === href}
      {href}>
      {#if Icon}
        <div class="flex h-4 w-4 items-center">
          <Icon />
        </div>
      {/if}
      {label}
    </a>
  </li>
{/snippet}

<div class="grid h-screen max-h-screen grid-cols-[auto_1fr]">
  <nav class="flex w-64 flex-col overflow-y-scroll p-2">
    <div class="flex-1 space-y-4">
      <header class="mb-3 p-2">
        <p class="ml-2 h4">Task Master</p>
        <p class="ml-2 text-xs text-surface-500">Developer Docs</p>
      </header>
      <section class="p-2">
        <p class="p-2 text-sm tracking-wide text-surface-500">OAuth2.0 Flows</p>
        <ul class="space-y-1">
          {@render navLink(
            resolve('/docs/auth/client-credentials-flow'),
            'Client Credentials',
            SquareAsteriskIcon
          )}
          {@render navLink('/authorization-code', 'Authorization Code', ArrowLeftRightIcon)}
        </ul>
      </section>
    </div>
  </nav>

  <main class="h-full max-h-screen p-2">
    <div
      class="h-full overflow-y-scroll rounded-xl border border-surface-200-800 p-6 dark:border-surface-900 dark:bg-surface-900">
      {@render children()}
    </div>
  </main>
</div>
