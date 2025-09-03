<script module lang="ts">
  import { z } from 'zod';

  export const FrontMatter = z.object({
    title: z.string()
  });
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';

  let { children, ...rest }: { children: Snippet } = $props();

  const frontMatter = $derived.by(() => {
    const result = FrontMatter.safeParse(rest);
    if (!result.success) {
      throw new Error('Invalid front matter', { cause: JSON.stringify(result.error.flatten()) });
    }
    return result.data;
  });
</script>

<svelte:head>
  <title>{frontMatter.title} - Taskmaster API Docs</title>
</svelte:head>

<article id="article-root" class="prose ml-4 dark:prose-invert">
  <header>
    <h1 class="mt-6">{frontMatter.title}</h1>
    <hr class="my-2!" />
    <div>{@render children()}</div>
  </header>
</article>
