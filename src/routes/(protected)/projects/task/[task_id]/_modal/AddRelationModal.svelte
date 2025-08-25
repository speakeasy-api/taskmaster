<script lang="ts">
  import ActionCard from '$lib/ui/cards/ActionCard.svelte';
  import { Combobox, Modal } from '@skeletonlabs/skeleton-svelte';
  import { getTasks, addRelationForm } from './AddRelationModal.remote';
  import { resource, watch } from 'runed';
  import { page } from '$app/state';

  type Props = {
    projectId: string;
    excludeTaskIds?: string[];
    open?: boolean;
  };

  let { projectId, excludeTaskIds = [], open = $bindable(false) }: Props = $props();

  let relatedTaskIdInputRef: HTMLInputElement;

  watch(
    () => open,
    (open) => {
      if (open) {
        tasksResource.refetch();
      }
    }
  );

  const tasksResource = resource(
    [],
    async () => {
      const tasks = await getTasks({ projectId, excludeTaskIds });
      return tasks.map((task) => ({
        label: task.title,
        value: task.id
      }));
    },
    { lazy: true }
  );

  const addRelationFormProps = addRelationForm.enhance(async ({ data, submit, form }) => {
    const depType = data.get('dependency_type') as string;
    if (depType.endsWith(':invert')) {
      data.set('task_id', data.get('related_task_id') as string);
      data.set('related_task_id', page.params.task_id!);
      data.set('dependency_type', depType.replace(':invert', ''));
    } else {
      data.set('task_id', page.params.task_id!);
    }

    await submit();

    if (addRelationForm.result?.success) {
      form.reset();
      handleClose();
    }
  });

  function handleClose() {
    open = false;
  }
</script>

<Modal {open} onOpenChange={handleClose}>
  {#snippet content()}
    <ActionCard title="Add Dependency" subtitle="Add a related item to this task.">
      {#snippet body()}
        <form id="add-relation-form" {...addRelationFormProps}>
          <label for="task_dependency" class="block text-sm font-medium">Related Task</label>

          <input
            bind:this={relatedTaskIdInputRef}
            type="hidden"
            id="related_task_id"
            name="related_task_id" />
          <Combobox
            data={tasksResource.current ?? []}
            onValueChange={(value) => {
              relatedTaskIdInputRef.value = value.value[0];
            }}
            multiple={false}
            placeholder="Select a task"
            disabled={tasksResource.loading}
            required />

          <label for="dependency_type" class="mt-4 block text-sm font-medium">Relation Type</label>
          <select id="dependency_type" name="dependency_type" class="input w-full" required>
            <option value="" disabled selected>Select a dependency type</option>
            <option value="relates_to">Relates To</option>
            <option value="blocks">Blocks</option>
            <option value="blocks:invert">Is Blocked By</option>
            <option value="duplicates">Duplicates</option>
            <option value="duplicates:invert">Is Duplicated By</option>
          </select>
        </form>
      {/snippet}
      {#snippet actions()}
        <button class="btn preset-tonal" onclick={handleClose}>Close</button>
        <button form="add-relation-form" type="submit" class="btn preset-filled">Add</button>
      {/snippet}
    </ActionCard>
  {/snippet}
</Modal>
