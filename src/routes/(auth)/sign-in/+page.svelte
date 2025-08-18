<script lang="ts">
  import { authClient } from '$lib/auth-client.js';
  import { defaults, setMessage, superForm } from 'sveltekit-superforms';
  import { zod } from 'sveltekit-superforms/adapters';
  import { SignInSchema } from './data.schema.js';
  import { goto } from '$app/navigation';

  const { form, errors, enhance, submitting, message } = superForm(defaults(zod(SignInSchema)), {
    validators: zod(SignInSchema),
    resetForm: false,
    SPA: true,
    onUpdate: async ({ form }) => {
      if (!form.valid) return;

      const { data, error } = await authClient.signIn.email({
        email: form.data.email,
        password: form.data.password
      });

      if (data) {
        await goto('/projects');
        return;
      }

      if (error.status === 401) {
        setMessage(form, 'Unauthorized: Invalid email or password.');
      } else {
        setMessage(form, `An unexpected error occurred: ${error.message}`);
      }
    },
    clearOnSubmit: 'errors-and-message'
  });
</script>

<svelte:head>
  <title>Sign In - Task Master</title>
</svelte:head>

<h1 class="text-center text-2xl font-bold">Sign In</h1>

<form class="space-y-4" method="POST" use:enhance>
  {#if $message}
    <div class="card preset-filled-error-50-950 p-2 text-sm">
      <span>{$message}</span>
    </div>
  {/if}

  <label class="label">
    <span class="label-text">Email Address</span>
    <input
      type="email"
      name="email"
      class="input"
      class:input-error={$errors.email}
      placeholder="you@email.com"
      bind:value={$form.email}
      disabled={$submitting}
      required />
    {#if $errors.email}
      <span class="text-sm text-error-500">{$errors.email}</span>
    {/if}
  </label>

  <label class="label">
    <span class="label-text">Password</span>
    <input
      type="password"
      name="password"
      class="input"
      class:input-error={$errors.password}
      placeholder="Enter a strong password"
      bind:value={$form.password}
      disabled={$submitting}
      required />
    {#if $errors.password}
      <span class="text-sm text-error-500">{$errors.password}</span>
    {/if}
  </label>

  <button class="btn w-full preset-filled" type="submit" disabled={$submitting}>
    {$submitting ? 'Signing In...' : 'Sign In'}
  </button>

  <div class="text-center">
    <p class="text-sm text-gray-600">
      Don't have an account?
      <a href="/sign-up/email" class="underline hover:text-primary-600">Sign up</a>
    </p>
  </div>
</form>
