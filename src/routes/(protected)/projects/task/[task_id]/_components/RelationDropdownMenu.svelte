<script lang="ts">
  import { cn } from '$lib/util.js';
  import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
  import CircleEllipsis from '@lucide/svelte/icons/circle-ellipsis';
  import CheckIcon from '@lucide/svelte/icons/check';
  import TrashIcon from '@lucide/svelte/icons/trash';
  import { DropdownMenu } from 'bits-ui';
  import {
    updateDependencyTypeForm,
    deleteTaskDependencyForm
  } from './RelationDropdownMenu.remote';
  import { page } from '$app/state';

  type Props = DropdownMenu.RootProps & {
    relationId: string;
    open?: boolean;
    value: string;
    triggerClass?: string;
  };

  type RadioItemProps = {
    label: string;
    value: string;
  };

  let { open = $bindable(false), value, relationId, triggerClass = '' }: Props = $props();

  const updateFormProps = updateDependencyTypeForm.for(relationId);
  const deleteFormProps = deleteTaskDependencyForm.for(relationId);
</script>

{#snippet radioItem(p: RadioItemProps)}
  <DropdownMenu.RadioItem
    value={p.value}
    class="hover:pointer flex w-full items-center gap-2 px-2 py-1 text-sm hover:cursor-pointer hover:preset-tonal">
    {#snippet children({ checked })}
      <button
        class="flex w-full items-center gap-2 disabled:cursor-not-allowed"
        name="dependency_type"
        value={p.value}
        disabled={updateFormProps.pending > 0 || value === p.value}
        {...updateFormProps.buttonProps}>
        <CheckIcon class={cn('invisible', checked && 'visible')} size={12} />
        {p.label}
      </button>
    {/snippet}
  </DropdownMenu.RadioItem>
{/snippet}

<DropdownMenu.Root>
  <DropdownMenu.Trigger class={cn('btn-icon btn-icon-sm preset-tonal', triggerClass)}>
    <CircleEllipsis class="inline align-middle" size={16} />
  </DropdownMenu.Trigger>
  <DropdownMenu.Portal>
    <form {...updateFormProps}>
      <input type="hidden" name="original_task_id" value={page.params.task_id} />
      <DropdownMenu.Content
        class="w-40 card preset-outlined-surface-200-800 bg-surface-50-950 p-1 shadow-xs"
        collisionPadding={12}
        sideOffset={8}>
        <DropdownMenu.RadioGroup {value}>
          <DropdownMenu.GroupHeading class="px-2 py-1 text-sm text-surface-500">
            <ArrowUpDownIcon class="inline align-middle" size={12} />
            Change Type
          </DropdownMenu.GroupHeading>
          <DropdownMenu.Separator class="border-b border-surface-200-800" />
          <input type="hidden" name="id" value={relationId} />
          {@render radioItem({ label: 'Blocks', value: 'blocks' })}
          {@render radioItem({ label: 'Blocked By', value: 'blocks:invert' })}
          {@render radioItem({ label: 'Relates To', value: 'relates_to' })}
          {@render radioItem({ label: 'Duplicates', value: 'duplicates' })}
          {@render radioItem({ label: 'Duplicated By', value: 'duplicates:invert' })}
        </DropdownMenu.RadioGroup>
        <DropdownMenu.Separator class="my-1 h-px bg-surface-200-800" />
        <DropdownMenu.Item
          class="hover:pointer px-2 py-1 text-sm hover:cursor-pointer hover:preset-tonal">
          <button class="flex w-full items-center gap-2" {...deleteFormProps.buttonProps}>
            <TrashIcon class="inline align-middle" size={12} />
            Remove Relation
          </button>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </form>
  </DropdownMenu.Portal>
</DropdownMenu.Root>
