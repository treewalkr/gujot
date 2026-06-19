<script lang="ts">
  let { form } = $props();
</script>

<svelte:head>
  <title>Log in — GuJot</title>
</svelte:head>

<main>
  <h1>Log in</h1>
  {#if form?.error}
    <p data-testid="login-error">{form.error}</p>
  {/if}
  <form method="POST" data-testid="login-form">
    <label>
      Email
      <input name="email" type="email" required value={form?.email ?? ""} />
    </label>
    <label>
      Password
      <input name="password" type="password" required />
    </label>
    <button type="submit">Log in</button>
  </form>
  <p><a href="/register">Need an account? Register</a></p>
</main>
