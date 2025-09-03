<script lang="ts">
  import { authClient } from '$lib/auth-client';
  import ActionCard from '$lib/ui/cards/ActionCard.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  async function handleConsent() {
    const result = await authClient.oauth2.consent({
      consent_code: data.consent_code,
      accept: true
    });

    if (result.error) {
      return alert('An error occurred while processing your consent. Please try again later.');
    }

    window.location.assign(result.data.redirectURI);
  }
</script>

<main class="flex h-screen w-full items-center justify-center">
  <ActionCard
    title="App Consent"
    subtitle="An application is requesting access to your Taskmaster Account. If you don't consent, you may close this window.">
    {#snippet body()}
      <div>
        <p class="text-sm">
          The application called <strong>&quot;{data.client.name}&quot;</strong>
          is requesting access to your Taskmaster account. Please review the permissions it is requesting
          and confirm if you wish to proceed.
        </p>
        <p class="mt-4 mb-2">Requested Scopes:</p>
        <pre class="rounded border border-surface-200-800 p-2">{data.scope}</pre>
      </div>
    {/snippet}
    {#snippet actions()}
      <button class="btn preset-filled" onclick={handleConsent}>I Consent</button>
    {/snippet}
  </ActionCard>
</main>
