<script lang="ts">
  import { onMount } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';
  import { fade } from 'svelte/transition';
  import { loadData } from '#lib/api.ts';
  import GradeMark from '#lib/components/GradeMark.svelte';
  import ProviderCard from '#lib/components/ProviderCard.svelte';
  import Seo from '#lib/components/Seo.svelte';
  import { gradeNames } from '#lib/marks.ts';
  import { absolute, schemaIds } from '#lib/site.ts';

  let { data } = $props();
  const { summaries, stats } = $derived(data);

  const calm = new MediaQuery('prefers-reduced-motion: reduce');
  const appear = $derived({ duration: calm.current ? 0 : 180 });

  let view = $state<'cards' | 'table'>('cards');
  let table = $state<ReturnType<typeof loadTable>>();

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
  <ul class="key" aria-label="Grade key">
    {#each ['good', 'ok', 'bad', 'info', 'na'] as const as grade (grade)}
      <li><GradeMark {grade} label="" /> {gradeNames[grade]}</li>
    {/each}
    <li><GradeMark grade={null} label="" /> Unknown</li>
  </ul>
</div>

{#if view === 'cards'}
  <div class="cards" in:fade={appear}>
    {#each summaries as summary (summary.id)}
      <ProviderCard {summary} />
    {/each}
  </div>
{:else}
  {#await table}
    <p class="status" role="status">Loading the table…</p>
  {:then loaded}
    {#if loaded}
      <div in:fade={appear}>
        <loaded.ProviderTable providers={loaded.providers} categories={loaded.categories} />
      </div>
    {/if}
  {:catch}
    <p class="status" role="status">
      The table didn't load. <button type="button" onclick={() => location.reload()}
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

  .toggle {
    display: flex;

    & button {
      padding: var(--space-2) var(--space-5);
      border: var(--rule-thin) solid var(--rule);
      background: var(--surface);
      font-weight: 600;
      cursor: pointer;
      transition: background-color var(--quick) var(--ease);

      & + button {
        border-left: 0;
      }

      &:hover {
        background: var(--surface-hover);
      }

      &[aria-pressed='true'] {
        background: var(--text);
        color: var(--surface);
      }
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
    padding-block: var(--space-6);
    color: var(--text-muted);

    & button {
      padding: 0;
      border: 0;
      background: none;
      color: var(--text);
      text-decoration: underline;
      cursor: pointer;
    }
  }
</style>
