<script lang="ts">
  import { resolve } from '$app/paths';
  import PasswordInput from '$lib/ui/inputs/PasswordInput.svelte';
  import TextInput from '$lib/ui/inputs/TextInput.svelte';
  import { defaults, superForm } from 'sveltekit-superforms';
  import { zod } from 'sveltekit-superforms/adapters';
  import { SignUpSchema } from './page.schemas.js';

  const { form, errors, enhance, submitting, message } = superForm(defaults(zod(SignUpSchema)), {
    resetForm: false,
    clearOnSubmit: 'errors-and-message'
  });
</script>

<svelte:head>
  <title>Sign Up - Taskmaster</title>
</svelte:head>

<h1 class="text-center text-2xl font-bold">Sign Up</h1>

<form class="space-y-4" method="POST" use:enhance>
  {#if $message}
    <div class="card preset-filled-error-50-950 p-2 text-sm">
      <span>{$message}</span>
    </div>
  {/if}

  <TextInput
    label="Full Name"
    name="name"
    placeholder="Your full name"
    bind:value={$form.name}
    disabled={$submitting}
    required>
    {#snippet error()}
      <span class="text-sm text-error-500">{$errors.name}</span>
    {/snippet}
  </TextInput>

  <TextInput
    type="email"
    label="Email"
    name="email"
    placeholder="you@email.com  "
    bind:value={$form.email}
    disabled={$submitting}
    required>
    {#snippet error()}
      <span class="text-sm text-error-500">{$errors.email}</span>
    {/snippet}
  </TextInput>

  <PasswordInput
    label="Password"
    name="password"
    placeholder="Enter a strong password"
    bind:value={$form.password}
    disabled={$submitting}
    required>
    {#snippet error()}
      <span class="text-sm text-error-500">{$errors.password}</span>
    {/snippet}
  </PasswordInput>

  <PasswordInput
    label="Confirm Password"
    name="confirmPassword"
    placeholder="Re-enter your password"
    bind:value={$form.confirmPassword}
    disabled={$submitting}
    required>
    {#snippet error()}
      <span class="text-sm text-error-500">{$errors.confirmPassword}</span>
    {/snippet}
  </PasswordInput>

  <button class="btn w-full preset-filled" type="submit" disabled={$submitting}>
    {$submitting ? 'Creating Account...' : 'Sign Up'}
  </button>

  <div class="text-center">
    <p class="text-sm text-gray-600">
      Already have an account?
      <a href={resolve('/sign-in')} class="underline hover:text-primary-600">Sign in</a>
    </p>
  </div>
</form>
