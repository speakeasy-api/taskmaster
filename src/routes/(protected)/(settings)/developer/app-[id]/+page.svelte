<script lang="ts">
  import { resolve } from '$app/paths';
  import TextInput from '$lib/ui/inputs/TextInput.svelte';
  import type { PageProps } from './$types';
  import { deleteApp } from './page.remote';

  let { data }: PageProps = $props();

  let copied = $state(false);

  function handleCopyClientId() {
    window.navigator.clipboard.writeText(data.app.clientId!);
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 2000);
  }

  const deleteFormProps = deleteApp.enhance(({ submit }) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this application? This action cannot be undone.'
    );

    if (!confirmed) return;

    return submit();
  });
</script>

<svelte:head>
  <title>{data.app.name ?? 'App'} - Taskmaster</title>
</svelte:head>

<div class="flex w-lg flex-col gap-6">
  <header class="space-y-2">
    <div>
      <ol class="mb-4 flex items-center gap-4 text-xs">
        <li>
          <a class="opacity-60 hover:underline" href={resolve('/developer')}>Developer Dashboard</a>
        </li>
        <li class="opacity-50" aria-hidden={true}>&rsaquo;</li>
        <li>OAuth Application</li>
      </ol>
      <p class="h2 capitalize">{data.app.name ?? 'Unnamed App'}</p>
      <p class="mt-1 text-xs text-surface-500">
        <span>Client ID:</span>
        <button class="btn preset-tonal btn-sm px-1 py-0.5" onclick={handleCopyClientId}>
          {data.app.clientId}
        </button>
        <span class="px-1 py-0.5 text-xs transition-opacity" class:opacity-0={!copied}>
          Copied!
        </span>
      </p>
    </div>
  </header>

  <section class="card preset-outlined-surface-200-800">
    <header class="flex items-baseline justify-between p-6 pb-2">
      <h2 class="h5">Details</h2>
    </header>
    <article class="p-6 pt-0">
      <form class="space-y-4">
        <TextInput label="App Name" value={data.app.name} name="name" />
      </form>
    </article>
    <footer class="flex justify-end bg-surface-100/25 px-6 py-3">
      <button class="btn preset-filled">Save</button>
    </footer>
  </section>

  <section class="card preset-outlined-surface-200-800">
    <header class="flex items-baseline justify-between p-6 pb-2">
      <h2 class="h5">Danger Zone</h2>
    </header>
    <article class="p-6 pt-0">
      <form {...deleteFormProps}>
        <input type="hidden" name="id" value={data.app.id} />
        <button class="btn w-full preset-filled-error-500">Delete Application</button>
      </form>
    </article>
  </section>
</div>
