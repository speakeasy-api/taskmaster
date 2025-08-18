<script lang="ts">
  import { Modal } from '@skeletonlabs/skeleton-svelte';
  import TextInput from '$lib/ui/inputs/TextInput.svelte';
  import { defaults, superForm } from 'sveltekit-superforms';
  import { zod } from 'sveltekit-superforms/adapters';
  import type { ComponentProps } from 'svelte';
  import { CreateTaskRequest } from '$lib/remote-fns/projects.schemas';
  import { createTask } from '$lib/remote-fns/projects.remote';
  import { invalidateAll } from '$app/navigation';

  type Props = {
    open?: boolean;
    onClose?: () => void;
    projectId: string;
  };

  let { open = $bindable(false), onClose = () => {}, projectId }: Props = $props();

  const { form, errors, enhance, submitting, message, reset, tainted } = superForm(
    defaults(zod(CreateTaskRequest), {
      defaults: {
        get project_id() {
          // note: this doesn't really work...
          return projectId;
        },
        title: '',
        description: ''
      }
    }),
    {
      validators: zod(CreateTaskRequest),
      SPA: true,
      resetForm: true,
      onUpdate: async ({ form }) => {
        if (!form.valid) return;

        await createTask({
          title: form.data.title,
          description: form.data.description,
          project_id: projectId
        });
        await invalidateAll();
        reset();
        handleClose();
      },
      clearOnSubmit: 'errors-and-message'
    }
  );

  function handleClose() {
    open = false;
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
      <p class="h4">New Task</p>
      <p class="text-xs text-surface-500">
        Create a new task by giving it a title and description.
      </p>
    </header>

    <form method="POST" use:enhance class="space-y-4 px-4">
      <input type="hidden" name="project_id" value={projectId} />

      {#if $message}
        <div class="alert rounded-lg border border-success-200 bg-success-50 p-3 text-success-800">
          <span class="font-medium">{$message}</span>
        </div>
      {/if}

      <TextInput
        label="Task Title"
        placeholder="My awesome task"
        name="title"
        status={$errors.title ? 'error' : undefined}
        bind:value={$form.title}
        disabled={$submitting}
        required>
        {#snippet error()}
          <span class="mt-1 text-sm text-error-600">{$errors.title}</span>
        {/snippet}
      </TextInput>

      <label class="label">
        Description
        <textarea
          name="description"
          class="textarea placeholder:text-surface-400-600"
          class:input-error={$errors.description}
          placeholder="What needs to be done?"
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
        <button type="submit" class="btn preset-filled" disabled={$submitting || !$tainted}>
          {$submitting ? 'Creating...' : 'Create Task'}
        </button>
      </footer>
    </form>
  {/snippet}
</Modal>
