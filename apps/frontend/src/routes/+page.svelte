<script lang="ts">
  let { data } = $props();
</script>

<svelte:head>
  <title>GuJot</title>
</svelte:head>

<main>
  <h1>GuJot</h1>
  <p>
    Backend service:
    <strong data-testid="backend-service">{data.backend.service}</strong>
    (<span>{data.backend.status}</span>)
  </p>
</main>
