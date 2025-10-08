<script lang="ts">
  import { resolve } from '$app/paths';
  import { taskStatusEnum } from '$lib/db/schemas/schema';
  import { snakeToTitleCase } from '$lib/util';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import TrashIcon from '@lucide/svelte/icons/trash';
  import type { PageProps } from './$types';
  import CreateTaskModal from './_modals/CreateTaskModal.svelte';
  import { deleteProject, deleteTask, updateTaskStatus } from './page.remote';

  let { data, params }: PageProps = $props();

  const activeTasks = $derived(data.project.task.filter((task) => task.status !== 'canceled'));
  const completedTasks = $derived(data.project.task.filter((task) => task.status === 'done'));
  const progress = $derived.by(() => {
    const totalTasks = data.project.task.length;
    const completedCount = completedTasks.length;
    return totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  });

  const deleteProjectFormProps = deleteProject.enhance(({ submit }) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this application? This action cannot be undone.'
    );

    if (!confirmed) return;

    return submit();
  });

  let openCreateTaskModal = $state(false);
</script>

<svelte:head>
  <title>{data.project.name} - Taskmaster</title>
</svelte:head>

{#snippet statCard(title: string, value: number | string)}
  <div class="card preset-outlined-surface-200-800 p-4">
    <p class="text-xs text-surface-500 uppercase">{title}</p>
    <p class="text-right text-3xl font-bold">{value}</p>
  </div>
{/snippet}

{#snippet actionRight(task: { id: string; status: string | null })}
  <svelte:boundary>
    {#snippet pending()}
      <div>Loading...</div>
    {/snippet}
    <form {...updateTaskStatus.for(task.id)} onchange={(e) => e.currentTarget.requestSubmit()}>
      <input type="hidden" name="id" value={task.id} />
      <select name="status" class="select w-fit grow-0 py-1 text-xs" value={task.status}>
        <option value={null}>No Status</option>
        {#each taskStatusEnum.enumValues as statusOption (statusOption)}
          <option value={statusOption}>{snakeToTitleCase(statusOption)}</option>
        {/each}
      </select>
    </form>
  </svelte:boundary>
  <form>
    <button
      name="id"
      value={task.id}
      class="btn-icon preset-filled-error-500 p-1"
      {...deleteTask.buttonProps}>
      <TrashIcon size={12} />
    </button>
  </form>
{/snippet}

<div class="flex w-lg flex-col gap-6">
  <header class="space-y-2">
    <div>
      <p class="h2 capitalize">{data.project.name}</p>
      <p class="text-xs text-surface-500">
        Project ID: <code>{data.project.id}</code>
      </p>
    </div>
    <div>
      <form {...deleteProjectFormProps}>
        <input type="hidden" name="id" value={data.project.id} />
        <button class="btn preset-filled-error-500 btn-sm">
          <TrashIcon size={12} />
          Delete Project
        </button>
      </form>
    </div>
  </header>

  <section class="grid grid-cols-3 gap-2">
    {@render statCard('Total', activeTasks.length)}
    {@render statCard('Completed', completedTasks.length)}
    {@render statCard('Progress', `${progress}%`)}
  </section>

  <section class="space-y-4">
    <header class="flex items-baseline justify-between">
      <h2 class="h3">Tasks</h2>
      <button class="btn preset-tonal btn-sm" onclick={() => (openCreateTaskModal = true)}>
        <PlusIcon size={12} />
        Create
      </button>
    </header>

    {#if data.project.task.length > 0}
      <ul class="space-y-4">
        {#each data.project.task as task (task.id)}
          {@const href = resolve('/(protected)/projects/task/[task_id]', { task_id: task.id })}
          <li class="flex flex-col justify-between card preset-outlined-surface-200-800 p-4">
            <div>
              <a {href} class="font-semibold hover:underline">
                {task.title}
              </a>
              <p class="text-xs text-surface-500">{task.description}</p>
            </div>
            <div class="mt-1 flex items-center justify-end gap-1">
              {@render actionRight(task)}
            </div>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="text-sm text-surface-500">No tasks available for this project.</p>
    {/if}
  </section>
</div>

<CreateTaskModal projectId={params.project_id} bind:open={openCreateTaskModal} />
