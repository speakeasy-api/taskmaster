<script lang="ts">
  import { deleteUserAccount } from './page.remote';

  const deleteUserAccountProps = deleteUserAccount.enhance(({ submit }) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone!'
    );
    if (!confirmed) return;
    return submit();
  });
</script>

<svelte:head>
  <title>Account Settings</title>
</svelte:head>

<div class="flex w-lg flex-col gap-8">
  <header class="space-y-2">
    <div>
      <p class="h2 capitalize">Account Settings</p>
      <p class="text-xs text-surface-500">Manage your account information and preferences.</p>
    </div>
  </header>

  <!-- Danger Zone -->
  <section class="card preset-outlined-surface-200-800">
    <header class="flex items-baseline justify-between p-6 pb-2">
      <h2 class="h5">Danger Zone</h2>
    </header>
    <article class="p-6 pt-0">
      <form {...deleteUserAccountProps}>
        <button class="btn w-full preset-filled-error-500">Delete My Account</button>
      </form>
    </article>
  </section>
</div>
