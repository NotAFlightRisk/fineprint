<script lang="ts">
  import type { Criterion, Provider } from '#lib/data/types.js';
  import { formatValue } from '#lib/format.js';
  import { checklist, flagged, located } from '#lib/summary.js';
  import { tip } from '#lib/tip.js';
  import External from './External.svelte';
  import GradeMark from './GradeMark.svelte';

  let { provider, criteria }: { provider: Provider; criteria: Map<string, Criterion> } = $props();

  const best = $derived(provider.criteria['pricing.best']);
  const flags = $derived(flagged(provider, criteria));
</script>

<article class="card">
  <header>
    <a class="title" href="/{provider.id}">
      <img src="/icons/{provider.icon}" alt="" width="32" height="32" />
      <h2>{provider.name}</h2>
    </a>
    <External
      href={provider.criteria['identity.website'].value as string}
      label="{provider.name} website"
    />
  </header>

  <p class="where">{located(provider, criteria)}</p>

  <ul class="checks">
    {#each checklist(provider, criteria) as check (check.id)}
      <li>
        <GradeMark grade={check.grade} />
        <button type="button" class="plain" {@attach tip(check.tip)}>{check.label}</button>
      </li>
    {/each}
  </ul>

  <footer>
    <span>
      {#if best?.value}From {formatValue(criteria.get('pricing.best')!, best.value)}{:else}Price
        unknown{/if}
    </span>
    {#if flags.length}
      <button type="button" class="plain flags" {@attach tip(flags.join('\n'))}>
        {flags.length} red flag{flags.length === 1 ? '' : 's'}
      </button>
    {:else}
      <span class="none">No red flags</span>
    {/if}
    <a class="more" href="/{provider.id}"
      >Full picture<span class="visually-hidden"> of {provider.name}</span></a
    >
  </footer>
</article>

<style>
  .card {
    display: grid;
    grid-template-rows: auto auto 1fr auto;
    gap: var(--space-4);
    padding-top: var(--space-4);
    border-top: var(--rule-heavy) solid var(--rule);
  }

  header {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .title {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    text-decoration: none;

    &:hover h2 {
      text-decoration: underline;
      text-decoration-thickness: 2px;
    }
  }

  img {
    border-radius: 0;
  }

  h2 {
    font-size: var(--text-lg);
  }

  .where {
    font-size: var(--text-sm);
    color: var(--text-muted);
  }

  .checks {
    display: grid;
    gap: var(--space-2);
    margin: 0;
    padding: var(--space-3) 0 0;
    border-top: var(--rule-thin) solid var(--rule-faint);
    list-style: none;

    & li {
      display: flex;
      gap: var(--space-2);
      align-items: baseline;
    }
  }

  footer {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-2) var(--space-4);
    padding-top: var(--space-3);
    border-top: var(--rule-thin) solid var(--rule-faint);
    font-size: var(--text-sm);
  }

  .flags {
    color: var(--bad);
    font-weight: 600;
  }

  .none {
    color: var(--text-muted);
  }

  .more {
    margin-left: auto;
    font-weight: 600;
  }
</style>
