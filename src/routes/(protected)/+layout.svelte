<script lang="ts">
  import PlusIcon from '@lucide/svelte/icons/plus';
  import SquareTerminal from '@lucide/svelte/icons/square-terminal';
  import CircleUserIcon from '@lucide/svelte/icons/circle-user';

  import type { LayoutProps } from './$types';
  import CreateProjectModal from './_modals/CreateProjectModal.svelte';
  import UserAccountPopover from '$lib/ui/UserAccountPopover.svelte';
  import { page } from '$app/state';
  import type { Component } from 'svelte';

  let { children, data }: LayoutProps = $props();

  let modalOpen: 'create-project' | null = $state(null);
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
        <p class="ml-2 h4">Taskmaster</p>
      </header>
      <section class="p-2">
        <div class="flex items-center justify-between">
          <p class="p-2 text-sm tracking-wide text-surface-500">PROJECTS</p>
          <button
            class="btn-icon btn-icon-sm preset-outlined-surface-200-800"
            onclick={() => (modalOpen = 'create-project')}>
            <PlusIcon />
          </button>
        </div>
        <ul class="space-y-1">
          {#each data.projects as project (project.id)}
            {@render navLink(`/projects/${project.id}`, project.name)}
          {:else}
            <li class="p-2 text-sm text-surface-500">No projects yet!</li>
          {/each}
        </ul>
      </section>
      <section class="p-2">
        <p class="p-2 text-sm tracking-wide text-surface-500">SETTINGS</p>
        <ul class="space-y-1">
          {@render navLink('/developer', 'Developer', SquareTerminal)}
          {@render navLink('/account', 'Account', CircleUserIcon)}
        </ul>
      </section>
    </div>

    <div class="p-2">
      <UserAccountPopover user={data.user} />
    </div>
  </nav>

  <main class="h-full max-h-screen p-2">
    <div
      class="h-full rounded-xl border border-surface-200-800 p-6 dark:border-surface-900 dark:bg-surface-900">
      {@render children()}
    </div>
  </main>
</div>

<CreateProjectModal open={modalOpen === 'create-project'} onClose={() => (modalOpen = null)} />
