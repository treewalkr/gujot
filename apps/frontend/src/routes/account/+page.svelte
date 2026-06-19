<script lang="ts">
  let { data } = $props();
</script>

<svelte:head>
  <title>Account — GuJot</title>
</svelte:head>

<main>
  <h1>Account</h1>
  <p>
    Signed in as
    <strong data-testid="user-email">{data.user.email}</strong>
  </p>
  <form method="POST" action="?/logout" data-testid="logout-form">
    <button type="submit">Log out</button>
  </form>
  <p><a href="/">Home</a></p>
</main>
