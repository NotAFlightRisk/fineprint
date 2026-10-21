<script lang="ts">
  import type { Snapshot } from '@sveltejs/kit';
  import { onMount } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';
  import { fade } from 'svelte/transition';
  import { loadData } from '#lib/api.svelte.ts';
  import GradeMark from '#lib/components/GradeMark.svelte';
  import MustHave from '#lib/components/MustHave.svelte';
  import ProviderCard from '#lib/components/ProviderCard.svelte';
  import Seo from '#lib/components/Seo.svelte';
  import SortBy from '#lib/components/SortBy.svelte';
  import { applyFilters, sorts, type Filters } from '#lib/filters.ts';
  import { gradeNames } from '#lib/marks.ts';
  import { absolute, schemaIds } from '#lib/site.ts';

  let { data } = $props();
  const { summaries, stats } = $derived(data);

  const calm = new MediaQuery('prefers-reduced-motion: reduce');
  const appear = $derived({ duration: calm.current ? 0 : 180 });

  let view = $state<'cards' | 'table'>('cards');
  let table = $state<ReturnType<typeof loadTable>>();

  let filters = $state<Filters>({ q: '', must: [], sort: 'flags' });
  let open = $state(false);
  const shown = $derived(applyFilters(summaries, filters));
  const active = $derived(filters.must.length + Number(Boolean(filters.q.trim())));
  const clear = () => ((filters.q = ''), (filters.must = []));

  export const snapshot: Snapshot<{ filters: Filters; open: boolean }> = {
    capture: () => ({ filters: $state.snapshot(filters), open }),
    restore: (saved) => ({ filters, open } = saved)
  };

  // the table and every value it shows only load once someone asks for it
  async function loadTable() {
    const [{ default: ProviderTable }, loaded] = await Promise.all([
      import('#lib/components/ProviderTable.svelte'),
      loadData()
    ]);
    return { ProviderTable, ...loaded };
  }

  function prepare() {
    if (table) return;
    table = loadTable();
    // a failed preload shows if the table's opened, rather than as an uncaught error
    table.catch(() => {});
  }

  function show(next: typeof view) {
    view = next;
    if (next === 'table') prepare();
    try {
      localStorage.setItem('view', next);
    } catch {}
  }

  onMount(() => {
    try {
      if (localStorage.getItem('view') === 'table') show('table');
    } catch {}
  });

  const schema = $derived([
    {
      '@type': 'ItemList',
      name: 'VPN providers compared',
      numberOfItems: summaries.length,
      itemListElement: summaries.map(({ id, name }, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name,
        url: absolute(`/${id}`)
      }))
    },
    {
      '@type': 'Dataset',
      name: 'fineprint VPN comparison data',
      description: `${stats.providers} VPN providers graded on ${stats.criteria} privacy criteria, covering logging, jurisdiction, audits, payment, apps and pricing. Every value comes with its grade, evidence, notes and sources.`,
      url: absolute('/'),
      license: 'https://opensource.org/license/mit',
      isAccessibleForFree: true,
      creator: { '@id': schemaIds.publisher },
      dateModified: stats.updated,
      distribution: ['providers', 'criteria'].map((name) => ({
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: absolute(`/api/${name}.json`)
      }))
    }
  ]);
</script>

<Seo
  title="Unsponsored VPN comparison, every claim sourced"
  description="Compare {stats.providers} VPNs on {stats.criteria} privacy criteria, from logging and audits to payment and apps. No sponsors or affiliate links, and a source for every claim."
  path="/"
  modified={stats.updated}
  {schema}
/>

<section class="intro">
  <h1>The VPN fine&nbsp;print, side by side</h1>
  <p>
    {stats.providers} providers measured on {stats.criteria} things that matter for privacy, backed by
    {stats.sources} sources. Nobody pays to be here, and every grade follows
    <a href="/methodology">the same published rules</a>.
  </p>
</section>

<div class="bar">
  <div class="controls">
    <div class="toggle" role="group" aria-label="View">
      <button type="button" aria-pressed={view === 'cards'} onclick={() => show('cards')}>
        Cards
      </button>
      <button
        type="button"
        aria-pressed={view === 'table'}
        onclick={() => show('table')}
        onpointerenter={prepare}
        onfocus={prepare}
      >
        Table
      </button>
    </div>
    <button
      type="button"
      class="reveal"
      aria-expanded={open}
      aria-controls="filters"
      onclick={() => (open = !open)}
    >
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5" /></svg>
      Filters
      {#if active}
        <span class="badge">{active}<span class="visually-hidden"> on</span></span>
      {/if}
    </button>
    <p class="count">
      <span role="status">{active ? `${shown.length} of ${summaries.length} providers` : ''}</span>
      {#if active}
        <button type="button" class="link" onclick={clear}>Clear filters</button>
      {/if}
    </p>
  </div>
  <ul class="key" aria-label="Grade key">
    {#each ['good', 'ok', 'bad', 'info', 'na'] as const as grade (grade)}
      <li><GradeMark {grade} label="" /> {gradeNames[grade]}</li>
    {/each}
    <li><GradeMark grade={null} label="" /> Unknown</li>
  </ul>
  <div class="filters" id="filters" hidden={!open}>
    <label class="find">
      <span>Find</span>
      <input type="search" placeholder="Provider name" bind:value={filters.q} />
    </label>
    <MustHave bind:selected={filters.must} />
    <SortBy bind:value={filters.sort} options={sorts} />
  </div>
</div>

{#if view === 'cards'}
  <div class="cards" in:fade={appear}>
    {#each shown as summary (summary.id)}
      <ProviderCard {summary} />
    {:else}
      <p class="status">Nothing matches. Try fewer filters.</p>
    {/each}
  </div>
{:else}
  {#await table}
    <p class="status" role="status">Loading the table…</p>
  {:then loaded}
    {#if loaded}
      <div in:fade={appear}>
        <loaded.ProviderTable
          summaries={shown}
          providers={loaded.providers}
          categories={loaded.categories}
          order={filters.sort}
        />
      </div>
    {/if}
  {:catch}
    <p class="status" role="status">
      The table didn't load. <button type="button" class="link" onclick={() => location.reload()}
        >Try again</button
      >
    </p>
  {/await}
{/if}

<style>
  .intro {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: var(--space-4) var(--space-5);
    padding-bottom: var(--space-7);

    & h1 {
      grid-column: 1 / span 8;
    }

    & p {
      grid-column: 9 / -1;
      align-self: end;
      max-width: 34ch;
      color: var(--text-muted);
    }

    @media (max-width: 56rem) {
      & h1,
      & p {
        grid-column: 1 / -1;
      }
    }
  }

  .bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding-block: var(--space-3);
    margin-bottom: var(--space-5);
    border-top: var(--rule-thin) solid var(--rule);
    border-bottom: var(--rule-thin) solid var(--rule);
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3) var(--space-4);
  }

  .toggle {
    display: flex;
  }

  .toggle button,
  .reveal {
    padding: var(--space-2) var(--space-5);
    border: var(--rule-thin) solid var(--rule);
    background: var(--surface);
    font-weight: 600;
    cursor: pointer;
    transition: background-color var(--quick) var(--ease);

    &:hover {
      background: var(--surface-hover);
    }
  }

  .toggle button {
    & + button {
      border-left: 0;
    }

    &[aria-pressed='true'] {
      background: var(--text);
      color: var(--surface);
    }
  }

  .reveal {
    display: flex;
    align-items: center;
    gap: var(--space-2);

    & svg {
      width: 0.875rem;
      height: 0.875rem;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      transition: rotate var(--quick) var(--ease);
    }

    &[aria-expanded='true'] svg {
      rotate: 90deg;
    }
  }

  .badge {
    min-width: 1.25rem;
    padding-inline: var(--space-1);
    background: var(--text);
    color: var(--surface);
    font-size: var(--text-xs);
    line-height: 1.25rem;
    text-align: center;
  }

  .count {
    display: flex;
    align-items: baseline;
    gap: var(--space-3);
    font-size: var(--text-sm);
    color: var(--text-muted);
  }

  .link {
    padding: 0;
    border: 0;
    background: none;
    color: var(--text);
    text-decoration: underline;
    cursor: pointer;
  }

  .filters {
    --label-width: 5rem;
    --control-width: 14rem;
    display: grid;
    flex-basis: 100%;
    grid-template-columns: minmax(0, 1fr);
    justify-items: start;
    gap: var(--space-3);
    min-width: 0;
    padding-top: var(--space-3);
    border-top: var(--rule-thin) solid var(--rule-faint);
    font-size: var(--text-sm);

    &[hidden] {
      display: none;
    }
  }

  .find {
    display: flex;
    align-items: center;
    gap: var(--space-2);

    & span {
      min-width: var(--label-width);
      color: var(--text-muted);
    }

    & input {
      width: var(--control-width);
      padding: var(--space-1) var(--space-2);
      border: var(--rule-thin) solid var(--rule);
      border-radius: 0;
      background: var(--surface);
    }
  }

  .key {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-4);
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--text-sm);
    color: var(--text-muted);

    & li {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
    gap: var(--space-7) var(--space-5);
  }

  .status {
    grid-column: 1 / -1;
    padding-block: var(--space-6);
    color: var(--text-muted);
  }
</style>
