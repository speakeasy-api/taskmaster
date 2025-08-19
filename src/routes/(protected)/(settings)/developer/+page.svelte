<script lang="ts">
  import type { PageProps } from './$types';
  import CreateOAuthAppModal from './_modals/CreateOAuthAppModal.svelte';
  import PlusIcon from '@lucide/svelte/icons/plus';

  let { data }: PageProps = $props();

  let showCreateModal = $state(false);
</script>

<svelte:head>
  <title>Developer Portal</title>
</svelte:head>

<CreateOAuthAppModal
  open={showCreateModal}
  onClose={() => (showCreateModal = false)}
  onSuccess={() => window.location.reload()} />

<div class="flex w-lg flex-col gap-6">
  <header class="space-y-2">
    <div>
      <p class="h2 capitalize">Developer Dashboard</p>
      <p class="text-xs text-surface-500">Create and manage integrations with TaskMaster.</p>
    </div>
  </header>

  <section class="space-y-4">
    <header>
      <div class="flex items-baseline justify-between">
        <h2 class="h3">Registered Apps</h2>
        <button class="btn preset-tonal btn-sm" onclick={() => (showCreateModal = true)}>
          <PlusIcon size={12} />
          New
        </button>
      </div>
      <p class="text-xs text-surface-500">
        Applications enable secure user authorization, allowing your application to access protected
        resources on their behalf.
      </p>
    </header>

    {#if data.apps.length > 0}
      <ul class="space-y-4">
        {#each data.apps as app (app.id)}
          <li>
            <a
              href="/developer/app-{app.id}"
              class="flex justify-between gap-4 card preset-outlined-surface-200-800 p-4 hover:preset-tonal">
              <div class="flex flex-col gap-1">
                <p class="text-lg font-semibold">{app.name}</p>
                <div>
                  <p class="badge preset-tonal px-1.5">
                    Created {app.createdAt?.toLocaleDateString()}
                  </p>
                  <p class="badge preset-tonal px-1.5">
                    Updated {app.updatedAt?.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </a>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="text-sm text-surface-500">No applications have been registered yet!</p>
    {/if}
  </section>
</div>
