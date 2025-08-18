<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { cn } from '$lib/util';

  type Props = Omit<HTMLInputAttributes, 'type'> & {
    type?: 'text' | 'email';
    label: string;
    name: string;
    error?: Snippet;
    status?: 'error' | undefined;
  };

  let {
    type = 'text',
    label,
    error: errors,
    status,
    value = $bindable(),
    class: className,
    ...rest
  }: Props = $props();
</script>

<label class="label">
  {label}
  <input
    {type}
    class={cn('input placeholder:text-surface-400-600 read-only:bg-surface-100/50', className)}
    class:input-error={status === 'error'}
    {...rest}
    bind:value />
  {#if errors}
    {@render errors()}
  {/if}
</label>
