<script lang="ts">
  import { resolve } from '$app/paths';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import TrashIcon from '@lucide/svelte/icons/trash';
  import type { PageProps } from './$types';
  import CreateApiKeyModal from './_modals/CreateApiKeyModal.svelte';
  import CreateOAuthAppModal from './_modals/CreateOAuthAppModal.svelte';
  import { deleteApiKey } from './page.remote';

  let { data }: PageProps = $props();

  let showCreateApiKeyModal = $state(false);
  let showCreateAppModal = $state(false);
</script>

<svelte:head>
  <title>Developer Portal</title>
</svelte:head>

<CreateApiKeyModal
  open={showCreateApiKeyModal}
  onClose={() => (showCreateApiKeyModal = false)}
  onSuccess={() => window.location.reload()} />

<CreateOAuthAppModal
  open={showCreateAppModal}
  onClose={() => (showCreateAppModal = false)}
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
        <h2 class="h3">API Keys</h2>
        <button class="btn preset-tonal btn-sm" onclick={() => (showCreateApiKeyModal = true)}>
          <PlusIcon size={12} />
          New
        </button>
      </div>
      <p class="text-xs text-surface-500">
        API Keys allow you to authenticate requests to our API and access your account
        programmatically.
      </p>
    </header>

    {#if data.apiKeys.length > 0}
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {#each data.apiKeys as apiKey (apiKey.id)}
              {@const form = deleteApiKey.for(apiKey.id).enhance((f) => {
                const confirmed = window.confirm(
                  'Are you sure you want to delete this API key? This action cannot be undone.'
                );
                if (!confirmed) return;
                f.submit();
              })}
              <tr>
                <td>{apiKey.name}</td>
                <td>{apiKey.createdAt.toLocaleDateString()}</td>
                <td class="text-right">
                  <form {...form}>
                    <button
                      name="id"
                      value={apiKey.id}
                      type="submit"
                      class="btn-icon btn-icon-sm preset-tonal-error">
                      <TrashIcon />
                    </button>
                  </form>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <div class="card preset-outlined-surface-200-800 p-2">
        <p class="text-sm text-surface-500">No API Keys have been registered yet!</p>
      </div>
    {/if}
  </section>

  <section class="space-y-4">
    <header>
      <div class="flex items-baseline justify-between">
        <h2 class="h3">Registered Apps</h2>
        <button class="btn preset-tonal btn-sm" onclick={() => (showCreateAppModal = true)}>
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
          {@const href = resolve('/(protected)/(settings)/developer/app-[id]', { id: app.id })}
          <li>
            <a
              {href}
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
      <div class="card preset-outlined-surface-200-800 p-2">
        <p class="text-sm text-surface-500">No applications have been registered yet!</p>
      </div>
    {/if}
  </section>
</div>
