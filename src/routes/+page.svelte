<script lang="ts">
  import { onMount } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';
  import { fade } from 'svelte/transition';
  import GradeMark, { gradeNames } from '#lib/components/GradeMark.svelte';
  import ProviderCard from '#lib/components/ProviderCard.svelte';
  import ProviderTable from '#lib/components/ProviderTable.svelte';
  import Seo from '#lib/components/Seo.svelte';
  import { site } from '#lib/site.js';
  import { byId } from '#lib/summary.js';

  let { data } = $props();

  const criteria = $derived(byId(data.categories));
  const sources = $derived(
    data.providers.reduce((total, provider) => total + Object.keys(provider.refs).length, 0)
  );

  const calm = new MediaQuery('prefers-reduced-motion: reduce');
  const appear = $derived({ duration: calm.current ? 0 : 180 });

  const views = ['cards', 'table'] as const;
  let view = $state<(typeof views)[number]>('cards');

  onMount(() => {
    try {
      const saved = localStorage.getItem('view');
      if (saved === 'table') view = saved;
    } catch {}
  });

  function show(next: typeof view) {
    view = next;
    try {
      localStorage.setItem('view', next);
    } catch {}
  }
</script>

<Seo title="{site.name} - the unsponsored VPN comparison" description={site.description} path="/" />

<section class="intro">
  <h1>The VPN fine print, side by side</h1>
  <p>
    {data.providers.length} providers measured on {criteria.size} things that matter for privacy, backed
    by {sources} sources. Nobody pays to be here, and every grade follows
    <a href="/methodology">the same published rules</a>.
  </p>
</section>

<div class="bar">
  <div class="toggle" role="group" aria-label="View">
    {#each views as option (option)}
      <button type="button" aria-pressed={view === option} onclick={() => show(option)}>
        {option === 'cards' ? 'Cards' : 'Table'}
      </button>
    {/each}
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
    {#each data.providers as provider (provider.id)}
      <ProviderCard
        {provider}
        {criteria}
        flag={data.flags[provider.criteria['jurisdiction.hq'].value as string]}
      />
    {/each}
  </div>
{:else}
  <div in:fade={appear}>
    <ProviderTable
      providers={data.providers}
      categories={data.categories}
      {criteria}
      flags={data.flags}
    />
  </div>
{/if}

<style>
  .intro {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: var(--space-4) var(--space-5);
    padding-bottom: var(--space-7);

    & h1 {
      grid-column: 1 / span 8;
      font-size: var(--text-display);
      letter-spacing: -0.04em;
      line-height: 0.95;
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
</style>
