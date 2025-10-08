<script lang="ts">
  import ActionCard from '$lib/ui/cards/ActionCard.svelte';
  import TextInput from '$lib/ui/inputs/TextInput.svelte';
  import { Modal } from '@skeletonlabs/skeleton-svelte';
  import type { ComponentProps } from 'svelte';
  import { createApiKey } from './CreateApiKeyModal.remote';
  import { adjectives, animals, uniqueNamesGenerator } from 'unique-names-generator';

  type Props = {
    open?: boolean;
    onClose?: () => void;
    onSuccess?: () => void;
  };

  let { open = false, onClose = () => {}, onSuccess = () => {} }: Props = $props();

  let copied = $state(false);

  function handleClose() {
    onClose?.();
    onSuccess?.();
  }

  function copyToClipboard() {
    if (!createApiKey.result?.data?.key) throw new Error('No API key to copy');
    navigator.clipboard.writeText(createApiKey.result.data.key);
    copied = true;
  }

  const handleOpenStateChange: ComponentProps<typeof Modal>['onOpenChange'] = (e) => {
    if (!e.open) {
      handleClose();
    }
  };

  const defaultName = uniqueNamesGenerator({ dictionaries: [adjectives, animals], separator: '-' });

  createApiKey.fields.name.set(defaultName);
</script>

<Modal
  {open}
  onOpenChange={handleOpenStateChange}
  backdropClasses="backdrop-blur-xs backdrop-brightness-50">
  {#snippet content()}
    {#if !createApiKey.result || !createApiKey.result.success}
      {@render createView()}
    {:else}
      {@render successView(createApiKey.result.data!.name!, createApiKey.result.data!.key)}
    {/if}
  {/snippet}
</Modal>

{#snippet createView()}
  {@const submitting = !!createApiKey.pending}
  <ActionCard title="New API Key" subtitle="Generate a new API key to integrate with our services.">
    {#snippet body()}
      <form id="create-api-key-form" {...createApiKey} class="space-y-4">
        <TextInput
          label="API Key Name"
          placeholder="My awesome app"
          {...createApiKey.fields.name.as('text')}
          status={createApiKey.fields.name.issues() ? 'error' : undefined}
          disabled={submitting}
          defaultvalue={defaultName}
          autocomplete="off">
          {#snippet error()}
            <span class="mt-1 text-sm text-error-600">
              {createApiKey.fields.name.issues()?.map((i) => i.message)}
            </span>
          {/snippet}
        </TextInput>
      </form>
    {/snippet}

    {#snippet actions()}
      <footer class="mt-2 flex justify-end gap-3">
        <button type="button" class="btn preset-tonal" onclick={handleClose}>Cancel</button>
        <button
          form="create-api-key-form"
          type="submit"
          class="btn preset-filled"
          disabled={submitting}>
          {submitting ? 'Creating…' : 'Generate Key'}
        </button>
      </footer>
    {/snippet}
  </ActionCard>
{/snippet}

{#snippet successView(apiKeyName: string, apiKey: string)}
  <ActionCard
    title="API Key Created!"
    subtitle="Congratulations! Be sure to save this somewhere safe. You won't be able to see it again.">
    {#snippet body()}
      <div class="space-y-4">
        <TextInput name="api_key_name" label="API Key Name" value={apiKeyName} readonly />

        <TextInput name="api_key" label="API Key" value={apiKey} readonly />
      </div>
    {/snippet}

    {#snippet actions()}
      <button class="btn preset-outlined" onclick={copyToClipboard}>
        {copied ? 'Copied!' : 'Copy Secret'}
      </button>
      <button class="btn preset-tonal" onclick={handleClose}>Close</button>
    {/snippet}
  </ActionCard>
{/snippet}
