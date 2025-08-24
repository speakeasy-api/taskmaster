<script lang="ts">
  import { resolve } from '$app/paths';
  import type { taskDepedencyTypeEnum } from '$lib/db/schemas/schema.js';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import type { InferEnum } from 'drizzle-orm';
  import { normalizeDependencyType, unifyDependencies } from './_utils.js';
  import AddRelationModal from './_modal/AddRelationModal.svelte';

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

{#snippet dependencyBadge(type: InferEnum<typeof taskDepedencyTypeEnum>, invert: boolean = false)}
  <p
    class="badge rounded-full text-xs"
    class:preset-tonal={type.toLowerCase().includes('relate')}
    class:preset-tonal-error={type.toLowerCase().includes('block')}
    class:preset-tonal-warning={type.toLowerCase().includes('duplicate')}>
    {normalizeDependencyType({ type, invert })}
  </p>
{/snippet}

<div class="flex w-lg flex-col gap-6">
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

  <section class="space-y-4">
    <header class="flex items-center justify-between">
      <p class="font-bold">Related Tasks</p>
      <button
        class="chip-icon preset-tonal"
        onclick={() => (dependencyModalOpen = !dependencyModalOpen)}>
        <PlusIcon />
      </button>
    </header>

    {#each dependencies as dependency (dependency.id)}
      <li class="flex flex-col justify-between card preset-outlined-surface-200-800 p-2">
        <div class="flex items-center justify-between">
          <a href={dependency.href} class="font-semibold hover:underline">{dependency.title}</a>
          {@render dependencyBadge(dependency.type, dependency.invert)}
        </div>
      </li>
    {/each}

    {#if data.task.dependencies.length === 0 && data.task.dependents.length === 0}
      <p class="text-sm text-surface-500">No related tasks. Such loneliness.</p>
    {/if}
  </section>
</div>

<AddRelationModal
  projectId={data.task.project_id}
  excludeTaskIds={[
    data.task.id,
    ...data.task.dependencies.map((d) => d.depends_on_task_id),
    ...data.task.dependents.map((d) => d.task_id)
  ]}
  open={dependencyModalOpen} />
