<script lang="ts">
  import '../app.css';
  import favicon from '$lib/assets/favicon.svg';
  import { AppState } from './app.state.svelte';
  import { Toaster } from '@skeletonlabs/skeleton-svelte';
  import { onMount } from 'svelte';

  let { children } = $props();

  AppState.init();
  const toaster = AppState.getToaster();

  onMount(() => {
    window.cookieStore.addEventListener('change', handleMessageReceived);

    return () => {
      window.cookieStore.removeEventListener('change', handleMessageReceived);
    };
  });

  // A CookieChangeEvent handler for receiving flash messages via cookies
  const handleMessageReceived = async (event: CookieChangeEvent) => {
    if (event.changed.length === 0) return;

    const cookies = await window.cookieStore.getAll();
    const messageCookies = cookies.filter((c) => c.name!.startsWith('_message-'));
    const values: FlashMessage[] = messageCookies.map((c) =>
      JSON.parse(decodeURIComponent(c.value!))
    );

    for (const value of values) {
      toaster.create({
        type: 'info',
        ...value
      });
    }

    messageCookies.forEach((c) => {
      window.cookieStore.delete(c.name!);
    });
  };
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}

<Toaster {toaster} overlap={true} placement="bottom-end" max={5} />
