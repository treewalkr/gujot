<script lang="ts">
  import { CURRENCIES, Money } from "@gujot/shared";

  let { data } = $props();

  const format = (amount: number, currency: Parameters<typeof Money.of>[1]) =>
    Money.of(amount, currency).format();
</script>

<svelte:head>
  <title>GuJot</title>
</svelte:head>

<main>
  <h1>GuJot</h1>
  <nav>
    <a href="/account">Account</a>
  </nav>
  <p>
    Backend service:
    <strong data-testid="backend-service">{data.status.service}</strong>
    (<span>{data.status.status}</span>)
  </p>

  <section>
    <h2>Ledger</h2>
    <ul data-testid="entries">
      {#each data.entries as entry (entry.id)}
        <li>
          <span data-testid="entry-amount">{format(entry.amount, entry.currency)}</span>
          {entry.label}
        </li>
      {/each}
    </ul>

    <form method="POST" data-testid="add-entry">
      <label>
        Amount
        <input name="amount" type="number" step="0.01" required />
      </label>
      <label>
        Currency
        <select name="currency">
          {#each CURRENCIES as currency}
            <option value={currency}>{currency}</option>
          {/each}
        </select>
      </label>
      <label>
        Label
        <input name="label" type="text" required />
      </label>
      <button type="submit">Add</button>
    </form>
  </section>
</main>
