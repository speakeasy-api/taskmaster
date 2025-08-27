<script lang="ts">
  import { Modal } from '@skeletonlabs/skeleton-svelte';
  import TextInput from '$lib/ui/inputs/TextInput.svelte';
  import { defaults, superForm } from 'sveltekit-superforms';
  import { zod } from 'sveltekit-superforms/adapters';
  import type { ComponentProps } from 'svelte';
  import { goto } from '$app/navigation';
  import { CreateProjectRequest } from './CreateProjectModal.schemas';
  import { createProject } from './CreateProjectModal.remote';
  import { resolve } from '$app/paths';

  type Props = {
    open?: boolean;
    onClose?: () => void;
  };

  let { open = false, onClose = () => {} }: Props = $props();

  const { form, errors, enhance, submitting, message } = superForm(
    defaults(zod(CreateProjectRequest)),
    {
      validators: zod(CreateProjectRequest),
      SPA: true,
      resetForm: true,
      onUpdate: async ({ form }) => {
        const result = await createProject({
          name: form.data.name,
          description: form.data.description
        });

        await goto(
          resolve('/(protected)/projects/project/[project_id]', { project_id: result.id }),
          { invalidateAll: true }
        );
        handleClose();
      },
      clearOnSubmit: 'errors-and-message'
    }
  );

  function handleClose() {
    onClose?.();
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
  contentBase="card p-4 space-y-4 shadow-xl w-lg preset-outlined-surface-200-800 bg-surface-50-950"
  backdropClasses="backdrop-blur-xs backdrop-brightness-50">
  {#snippet content()}
    <header class="p-4 pb-2">
      <p class="h4">New Project</p>
      <p class="text-xs text-surface-500">
        Start a new project by giving it a name and optional description.
      </p>
    </header>

    <form method="POST" use:enhance class="space-y-4 px-4">
      {#if $message}
        <div class="alert rounded-lg border border-success-200 bg-success-50 p-3 text-success-800">
          <span class="font-medium">{$message}</span>
        </div>
      {/if}

      <TextInput
        label="Project Name"
        placeholder="My awesome project"
        name="name"
        status={$errors.name ? 'error' : undefined}
        bind:value={$form.name}
        disabled={$submitting}
        required>
        {#snippet error()}
          <span class="mt-1 text-sm text-error-600">{$errors.name}</span>
        {/snippet}
      </TextInput>

      <label class="label">
        Description
        <textarea
          name="description"
          class="textarea placeholder:text-surface-400-600"
          class:input-error={$errors.description}
          placeholder="What is this project about?"
          bind:value={$form.description}
          disabled={$submitting}
          rows="3">
        </textarea>
        {#if $errors.description}
          <span class="mt-1 text-sm text-error-600">{$errors.description}</span>
        {/if}
      </label>

      <footer class="mt-2 flex justify-end gap-3">
        <button type="button" class="btn preset-tonal" onclick={handleClose}>Cancel</button>
        <button type="submit" class="btn preset-filled" disabled={$submitting}>
          {$submitting ? 'Creating…' : 'Create Project'}
        </button>
      </footer>
    </form>
  {/snippet}
</Modal>
