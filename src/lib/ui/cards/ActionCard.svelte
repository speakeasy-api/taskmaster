<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    title: string;
    subtitle: string;
    body: Snippet;
    actions: Snippet;
  };

  let { title, subtitle, body, actions }: Props = $props();
</script>

<div class="w-lg card preset-outlined-surface-200-800 bg-surface-50-950">
  <header class="p-6 pb-2">
    <p class="h4">{title}</p>
    <p class="text-xs text-surface-500">
      {subtitle}
    </p>
  </header>

  <div class="p-6 py-0">
    {@render body()}
  </div>

  <footer class="flex justify-end gap-3 p-6 pt-6">
    {@render actions()}
  </footer>
</div>
