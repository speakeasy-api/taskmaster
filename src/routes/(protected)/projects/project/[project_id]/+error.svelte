<script lang="ts">
  import { page } from '$app/state';
</script>

<div
  class="flex h-full flex-col items-center justify-center space-y-4 p-4 text-center text-surface-500">
  {#if page.status === 404}
    <h1 class="h6">404 - Not Found</h1>
    <p class="text-sm">This project doesn't exist, or you don't have access to it.</p>
  {:else if page.status === 500}
    <h1 class="h6">500 - Server Error</h1>
    <p class="text-sm">Something went wrong on our end. Please try again later.</p>
  {:else}
    <h1 class="h6">An unexpected error occurred</h1>
    <p class="text-sm">Please try again later.</p>
  {/if}
</div>
