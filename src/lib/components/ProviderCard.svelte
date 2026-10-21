<script lang="ts">
  import Checklist from '#lib/components/Checklist.svelte';
  import External from '#lib/components/External.svelte';
  import Flag from '#lib/components/Flag.svelte';
  import RedFlags from '#lib/components/RedFlags.svelte';
  import type { Summary } from '#lib/summary.ts';

  let { summary }: { summary: Summary } = $props();
  const { id, name, icon, website, hq, where, checks, flags, serious, price } = $derived(summary);
</script>

<article class="card">
  <header>
    <a class="title" href="/{id}">
      <img src="/icons/{icon}" alt="" width="32" height="32" />
      <h2>{name}</h2>
    </a>
    <External href={website} label="{name} website" />
    <p class="where"><Flag code={hq} />{where.join(' · ')}</p>
  </header>

  <div class="checks">
    <Checklist {checks} />
  </div>

  <footer>
    <div class="facts">
      <span>{price ? `From ${price}` : 'Price unknown'}</span>
      <RedFlags {flags} {serious} />
    </div>
    <a class="more" href="/{id}">Full picture<span class="visually-hidden"> of {name}</span></a>
  </footer>
</article>

<style>
  /* shares its row's tracks, so sections line up across cards */
  .card {
    display: grid;
    grid-row: span 3;
    grid-template-rows: subgrid;
    gap: var(--space-4);
    padding-top: var(--space-4);
    border-top: var(--rule-heavy) solid var(--rule);
  }

  header {
    display: grid;
    grid-template-columns: 1fr auto;
    align-content: start;
    align-items: start;
    gap: var(--space-4) var(--space-3);
  }

  .title {
    justify-self: start;
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
    grid-column: 1 / -1;
    font-size: var(--text-sm);
    color: var(--text-muted);
  }

  .checks {
    padding-top: var(--space-3);
    border-top: var(--rule-thin) solid var(--rule-faint);
  }

  footer {
    display: grid;
    gap: var(--space-3);
    padding-top: var(--space-3);
    border-top: var(--rule-thin) solid var(--rule-faint);
  }

  .facts {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-1) var(--space-4);
    font-size: var(--text-sm);
  }

  .more {
    display: flex;
    justify-content: space-between;
    padding: var(--space-2) var(--space-4);
    border: var(--rule-thin) solid var(--rule);
    font-weight: 600;
    text-decoration: none;
    transition: background-color var(--quick) var(--ease);

    &::after {
      content: '→' / '';
      transition: translate var(--quick) var(--ease);
    }

    &:hover {
      background: var(--surface-hover);

      &::after {
        translate: var(--space-1) 0;
      }
    }
  }
</style>
