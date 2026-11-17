<script lang="ts">
  import type { Snapshot } from '@sveltejs/kit';
  import Changes from '#lib/components/Changes.svelte';
  import Seo from '#lib/components/Seo.svelte';
  import { site } from '#lib/site.ts';

  let { data } = $props();
  const { entries, total, labels, topics } = $derived(data);

  let q = $state('');
  let topic = $state('');

  const shown = $derived.by(() => {
    const name = q.trim().toLowerCase();
    return entries.flatMap((entry) => {
      if (!entry.name.toLowerCase().includes(name)) return [];
      if (!topic) return [entry];
      if (topic === 'added') return entry.added ? [entry] : [];
      const changes = entry.changes?.filter(({ key }) => key.startsWith(`${topic}.`));
      return changes?.length ? [{ ...entry, changes }] : [];
    });
  });

  const clear = () => ((q = ''), (topic = ''));

  export const snapshot: Snapshot<{ q: string; topic: string }> = {
    capture: () => ({ q, topic }),
    restore: (saved) => ({ q, topic } = saved)
  };
</script>

<Seo
  title="Changelog: every change to the VPN data"
  description="Every change to fineprint's VPN data, newest first: what changed, when, and the pull request behind it."
  path="/changelog"
  crumb="Changelog"
  modified={entries[0]?.date}
/>

<section class="preface">
  <h1>Changelog</h1>
  <div class="prose">
    <p>
      Every change to a provider's data, newest first. Each one links to the pull request behind it,
      where you'll find the sources and the reasoning.
    </p>
  </div>
</section>

<section class="section" aria-labelledby="changes">
  <div class="lead">
    <h2 id="changes">All changes</h2>
    <p role="status">{shown.length} of {entries.length} shown</p>
    <search class="filters">
      <label>
        <span>Provider</span>
        <input
          type="search"
          placeholder="Any"
          autocomplete="off"
          spellcheck="false"
          bind:value={q}
        />
      </label>
      <label>
        <span>Changed</span>
        <span class="select">
          <select bind:value={topic}>
            <option value="">Anything</option>
            <option value="added">New providers</option>
            {#each topics as { id, label } (id)}
              <option value={id}>{label}</option>
            {/each}
          </select>
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 6 8 10.5 12.5 6" /></svg>
        </span>
      </label>
    </search>
  </div>
  <div class="list">
    {#if shown.length}
      <Changes entries={shown} {labels} named />
    {:else}
      <p class="empty">
        Nothing matches that.
        <button type="button" onclick={clear}>Clear filters</button>
      </p>
    {/if}
    {#if total > entries.length}
      <p class="more">
        That's the latest {entries.length}. Each provider's page has its whole history, and all {total}
        are in
        <a
          href="{site.repo}/blob/main/.github/changelog.json"
          target="_blank"
          rel="noopener external">the changelog file</a
        >.
      </p>
    {/if}
  </div>
</section>

<style>
  .lead {
    align-self: start;

    @media (min-width: 56rem) {
      position: sticky;
      top: var(--space-4);
    }
  }

  .filters {
    display: grid;
    gap: var(--space-3);
    margin-top: var(--space-3);

    & label {
      display: grid;
      gap: var(--space-1);
      font-size: var(--text-sm);

      & > span:first-child {
        color: var(--text-muted);
      }
    }

    & input,
    & select {
      width: 100%;
      padding: var(--space-1) var(--space-2);
      border: var(--rule-thin) solid var(--rule);
      border-radius: 0;
      background: var(--surface);
    }

    & input::placeholder {
      color: var(--text-muted);
      opacity: 1;
    }
  }

  .select {
    position: relative;
    display: flex;

    & select {
      appearance: none;
      padding-right: var(--space-6);
      cursor: pointer;
    }

    & svg {
      position: absolute;
      top: 50%;
      right: var(--space-2);
      width: 0.875rem;
      height: 0.875rem;
      translate: 0 -50%;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      pointer-events: none;
    }
  }

  .list {
    display: grid;
    align-content: start;
    gap: var(--space-4);
  }

  .empty,
  .more {
    font-size: var(--text-sm);
    color: var(--text-muted);
  }

  .empty button {
    padding: 0;
    border: 0;
    background: none;
    text-decoration: underline;
    text-underline-offset: 0.2em;
    cursor: pointer;
  }
</style>
