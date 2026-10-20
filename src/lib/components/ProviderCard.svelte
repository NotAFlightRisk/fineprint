<script lang="ts">
  import Checklist from '#lib/components/Checklist.svelte';
  import External from '#lib/components/External.svelte';
  import Flag from '#lib/components/Flag.svelte';
  import { redFlags, type Summary } from '#lib/summary.ts';
  import { tip } from '#lib/tip.ts';

  let { summary }: { summary: Summary } = $props();
  const { id, name, icon, website, hq, where, checks, flags, price } = $derived(summary);
</script>

<article class="card">
  <header>
    <a class="title" href="/{id}">
      <img src="/icons/{icon}" alt="" width="32" height="32" />
      <h2>{name}</h2>
    </a>
    <External href={website} label="{name} website" />
  </header>

  <p class="where"><Flag code={hq} />{where.join(' · ')}</p>

  <div class="checks">
    <Checklist {checks} />
  </div>

  <footer>
    <span>{price ? `From ${price}` : 'Price unknown'}</span>
    {#if flags.length}
      <button type="button" class="noted flags" {@attach tip(flags.join('\n'))}>
        {redFlags(flags.length)}
      </button>
    {:else}
      <span class="none">{redFlags(0)}</span>
    {/if}
    <a class="more" href="/{id}">Full picture<span class="visually-hidden"> of {name}</span></a>
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
    padding-top: var(--space-3);
    border-top: var(--rule-thin) solid var(--rule-faint);
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
