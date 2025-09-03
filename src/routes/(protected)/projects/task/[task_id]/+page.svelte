<script lang="ts">
  import { resolve } from '$app/paths';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import RelationDropdownMenu from './_components/RelationDropdownMenu.svelte';
  import AddRelationModal from './_modal/AddRelationModal.svelte';
  import { unifyDependencies } from './_utils.js';

  let { data } = $props();

  let dependencyModalOpen = $state(false);
  const dependencies = $derived(unifyDependencies(data.task));
  let idCopied = $state(false);

  const projectHref = resolve('/(protected)/projects/project/[project_id]', {
    project_id: data.task.project_id
  });

  function handleCopyTaskId() {
    window.navigator.clipboard.writeText(data.task.id);
    idCopied = true;
    setTimeout(() => {
      idCopied = false;
    }, 2000);
  }
</script>

<svelte:head>
  <title>{data.task.title} - Taskmaster</title>
</svelte:head>

<div class="grid h-full grid-cols-[1fr_auto_auto] gap-6">
  <div class="flex flex-col gap-6">
    <header class="space-y-2">
      <div>
        <ol class="mb-4 flex items-center gap-4 text-xs">
          <li>
            <a class="opacity-60 hover:underline" href={projectHref}>{data.task.project.name}</a>
          </li>
          <li class="opacity-50" aria-hidden={true}>&rsaquo;</li>
          <li class="capitalize">{data.task.title}</li>
        </ol>
        <p class="h2 capitalize">{data.task.title}</p>
        <p class="mt-1 text-xs text-surface-500">
          <span>Task ID:</span>
          <button class="btn preset-tonal btn-sm px-1 py-0.5" onclick={handleCopyTaskId}>
            {data.task.id}
          </button>
          <span class="px-1 py-0.5 text-xs transition-opacity" class:opacity-0={!idCopied}>
            Copied!
          </span>
        </p>
      </div>
    </header>
    <section>
      <p class="whitespace-pre-wrap">{data.task.description}</p>
    </section>
  </div>

  <div class="vr"></div>

  <div class="max-w-md min-w-xs space-y-4">
    <header class="space-y-2">
      <div class="flex items-center justify-between">
        <p class="h4 capitalize">Related</p>
        <button
          class="btn preset-tonal btn-sm"
          onclick={() => (dependencyModalOpen = !dependencyModalOpen)}>
          <PlusIcon class="h-4 w-4" />
          <span>Add</span>
        </button>
      </div>
    </header>
    {#each dependencies as depGroup (depGroup.label)}
      <section class="space-y-2">
        <header class="flex items-center justify-between">
          <p class="font-bold">{depGroup.label}</p>
        </header>

        <ul class="space-y-2">
          {#each depGroup.items as dependency (dependency.id)}
            <li class="">
              <a
                href={resolve('/(protected)/projects/task/[task_id]', { task_id: dependency.id })}
                class="group flex items-center justify-between card preset-outlined-surface-200-800 p-0 pl-2 text-xs font-semibold hover:underline">
                {dependency.title}
                <RelationDropdownMenu
                  triggerClass="invisible group-hover:visible rounded-none"
                  relationId={dependency.id}
                  value={depGroup.dataValue} />
              </a>
            </li>
          {/each}
        </ul>

        {#if depGroup.items.length === 0}
          <div class="w-full rounded text-sm text-surface-500">
            {depGroup.emptyMessage}
          </div>
        {/if}
      </section>
    {/each}
  </div>
</div>

<AddRelationModal
  projectId={data.task.project_id}
  excludeTaskIds={[
    data.task.id,
    ...data.task.dependencies.map((d) => d.depends_on_task_id),
    ...data.task.dependents.map((d) => d.task_id)
  ]}
  bind:open={dependencyModalOpen} />
