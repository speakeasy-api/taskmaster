<script>
  import { resolve } from '$app/paths';
</script>

<svelte:head>
  <title>Taskmaster</title>
</svelte:head>

<div class="flex min-h-screen flex-col items-center justify-center">
  <header class="flex flex-col items-center gap-y-4 py-8 text-center">
    <h1 class="h1">Taskmaster</h1>
    <p class="max-w-md text-surface-500">A simple task management app.</p>
    <div class="flex gap-x-4">
      <a href={resolve('/sign-in')} class="btn preset-filled">Sign In</a>
      <a href={resolve('/docs')} class="btn preset-tonal">Docs</a>
    </div>
  </header>
</div>
