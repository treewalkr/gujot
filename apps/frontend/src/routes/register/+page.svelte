<script lang="ts">
  let { form } = $props();
</script>

<svelte:head>
  <title>Register — GuJot</title>
</svelte:head>

<main>
  <h1>Register</h1>
  {#if form?.error}
    <p data-testid="register-error">{form.error}</p>
  {/if}
  <form method="POST" data-testid="register-form">
    <label>
      Email
      <input name="email" type="email" required value={form?.email ?? ""} />
    </label>
    <label>
      Password
      <input name="password" type="password" minlength="8" required />
    </label>
    <button type="submit">Register</button>
  </form>
  <p><a href="/login">Already have an account? Log in</a></p>
</main>
