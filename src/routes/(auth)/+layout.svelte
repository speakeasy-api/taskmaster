<script lang="ts">
  import type { LayoutProps } from './$types';

  let { children }: LayoutProps = $props();
</script>

<div class="flex min-h-screen items-center justify-center p-4">
  <div class="w-full max-w-md space-y-6 card preset-outlined-surface-200-800 p-8">
    {@render children()}
  </div>
</div>
