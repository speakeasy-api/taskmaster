<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLInputAttributes, HTMLLabelAttributes } from 'svelte/elements';
  import { cn } from '$lib/util';
  import EyeIcon from '@lucide/svelte/icons/eye';
  import EyeClosedIcon from '@lucide/svelte/icons/eye-off';

  type Props = Omit<HTMLInputAttributes, 'type'> & {
    label: string;
    name: string;
    error?: Snippet;
    status?: 'error' | undefined;
    labelClass?: HTMLLabelAttributes['class'];
  };

  let {
    label,
    error: errors,
    status,
    value = $bindable(),
    class: className,
    ...rest
  }: Props = $props();

  let showing = $state(false);
</script>

<label class="label">
  {label}
  <div class="flex items-center space-x-2">
    <input
      type={showing ? 'text' : 'password'}
      class={cn('input placeholder:text-surface-400-600 read-only:bg-surface-100/50', className)}
      class:input-error={status === 'error'}
      {...rest}
      bind:value />
    <button
      type="button"
      class="btn-icon border-0 bg-surface-50-950 outline outline-surface-200-800"
      onclick={() => (showing = !showing)}>
      {#if showing}
        <EyeClosedIcon />
      {:else}
        <EyeIcon />
      {/if}
    </button>
  </div>

  {#if errors}
    {@render errors()}
  {/if}
</label>
