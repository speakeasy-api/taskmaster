<script lang="ts">
  import { defaults, superForm } from 'sveltekit-superforms';
  import { zod } from 'sveltekit-superforms/adapters';
  import { SignUpSchema } from './data.schema.js';

  const { form, errors, enhance, submitting, message } = superForm(defaults(zod(SignUpSchema)), {
    resetForm: false,
    clearOnSubmit: 'errors-and-message'
  });
</script>

<svelte:head>
  <title>Sign Up - Task Master</title>
</svelte:head>

<h1 class="text-center text-2xl font-bold">Sign Up</h1>

<form class="space-y-4" method="POST" use:enhance>
  {#if $message}
    <div class="card preset-filled-error-50-950 p-2 text-sm">
      <span>{$message}</span>
    </div>
  {/if}

  <label class="label">
    <span class="label-text">Full Name</span>
    <input
      type="text"
      name="name"
      class="input"
      class:input-error={$errors.name}
      placeholder="Your full name"
      bind:value={$form.name}
      disabled={$submitting}
      required />
    {#if $errors.name}
      <span class="text-sm text-error-500">{$errors.name}</span>
    {/if}
  </label>

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

  <label class="label">
    <span class="label-text">Confirm Password</span>
    <input
      type="password"
      name="confirmPassword"
      class="input"
      class:input-error={$errors.confirmPassword}
      placeholder="Re-enter your password"
      bind:value={$form.confirmPassword}
      disabled={$submitting}
      required />
    {#if $errors.confirmPassword}
      <span class="text-sm text-error-500">{$errors.confirmPassword}</span>
    {/if}
  </label>

  <button class="btn w-full preset-filled" type="submit" disabled={$submitting}>
    {$submitting ? 'Creating Account...' : 'Sign Up'}
  </button>

  <div class="text-center">
    <p class="text-sm text-gray-600">
      Already have an account?
      <a href="/sign-in" class="underline hover:text-primary-600">Sign in</a>
    </p>
  </div>
</form>
