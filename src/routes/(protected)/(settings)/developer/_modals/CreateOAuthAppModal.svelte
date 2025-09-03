<script lang="ts">
  import ActionCard from '$lib/ui/cards/ActionCard.svelte';
  import TextInput from '$lib/ui/inputs/TextInput.svelte';
  import { Modal } from '@skeletonlabs/skeleton-svelte';
  import type { ComponentProps } from 'svelte';
  import { defaults, superForm } from 'sveltekit-superforms';
  import { zod } from 'sveltekit-superforms/adapters';
  import { registerOAuthApp } from './CreateOAuthAppModal.remote';
  import { RegisterOAuthAppRequest } from './CreateOAuthAppModal.schemas';

  type Props = {
    open?: boolean;
    onClose?: () => void;
    onSuccess?: () => void;
  };

  let { open = false, onClose = () => {}, onSuccess = () => {} }: Props = $props();

  let credentials = $state<{ clientId: string; clientSecret: string } | null>(null);
  let copied = $state(false);

  const { form, errors, enhance, submitting, message, formId } = superForm(
    defaults(zod(RegisterOAuthAppRequest)),
    {
      validators: zod(RegisterOAuthAppRequest),
      SPA: true,
      resetForm: true,
      onUpdate: async ({ form }) => {
        if (!form.valid) return;
        const result = await registerOAuthApp(form.data);
        credentials = { clientId: result.client_id, clientSecret: result.client_secret! };
      },
      clearOnSubmit: 'errors-and-message'
    }
  );

  function handleClose() {
    credentials = null;
    onClose?.();
    onSuccess?.();
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(credentials!.clientSecret ?? '');
    copied = true;
  }

  const handleOpenStateChange: ComponentProps<typeof Modal>['onOpenChange'] = (e) => {
    if (!e.open) {
      handleClose();
    }
  };
</script>

<Modal
  {open}
  onOpenChange={handleOpenStateChange}
  backdropClasses="backdrop-blur-xs backdrop-brightness-50">
  {#snippet content()}
    {#if !credentials}
      {@render createView()}
    {:else}
      {@render successView()}
    {/if}
  {/snippet}
</Modal>

{#snippet createView()}
  <ActionCard
    title="New OAuth Application"
    subtitle="Create a new OAuth application to enable secure user authorization for your integration.">
    {#snippet body()}
      <form id={$formId} class="space-y-4" method="POST" use:enhance>
        {#if $message}
          <div
            class="alert rounded-lg border border-success-200 bg-success-50 p-3 text-success-800">
            <span class="font-medium">{$message}</span>
          </div>
        {/if}

        <TextInput
          label="Application Name"
          placeholder="My awesome app"
          name="name"
          status={$errors.name ? 'error' : undefined}
          bind:value={$form.name}
          disabled={$submitting}
          required
          autocomplete="off">
          {#snippet error()}
            <span class="mt-1 text-sm text-error-600">{$errors.name}</span>
          {/snippet}
        </TextInput>

        <TextInput
          label="Redirect URL"
          placeholder="https://example.com/callback"
          name="redirectUrl"
          status={$errors.redirectUrl ? 'error' : undefined}
          bind:value={$form.redirectUrl}
          disabled={$submitting}
          autocomplete="off"
          required>
          {#snippet error()}
            <span class="mt-1 text-sm text-error-600">{$errors.redirectUrl}</span>
          {/snippet}
        </TextInput>
      </form>
    {/snippet}

    {#snippet actions()}
      <footer class="mt-2 flex justify-end gap-3">
        <button type="button" class="btn preset-tonal" onclick={handleClose}>Cancel</button>
        <button form={$formId} type="submit" class="btn preset-filled" disabled={$submitting}>
          {$submitting ? 'Creating…' : 'Create Application'}
        </button>
      </footer>
    {/snippet}
  </ActionCard>
{/snippet}

{#snippet successView()}
  <ActionCard
    title="App Created!"
    subtitle="Congratulations! Be sure to save the Client Secret somewhere safe. You won't be able to see it again.">
    {#snippet body()}
      <div class="space-y-4">
        <TextInput name="clientId" label="Client ID" value={credentials!.clientId ?? ''} readonly />

        <TextInput
          name="clientSecret"
          label="Client Secret"
          value={credentials!.clientSecret ?? ''}
          readonly />
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
