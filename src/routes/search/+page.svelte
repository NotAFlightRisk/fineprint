<script lang="ts">
  import { onMount } from 'svelte';
  import { afterNavigate, goto } from '$app/navigation';
  import { searchIndex } from '#lib/api.svelte.ts';
  import MustHave from '#lib/components/MustHave.svelte';
  import SearchResult from '#lib/components/SearchResult.svelte';
  import Seo from '#lib/components/Seo.svelte';
  import SortBy from '#lib/components/SortBy.svelte';
  import {
    filter,
    order,
    parse,
    readFilters,
    score,
    sorts,
    suggestions,
    writeFilters,
    type Filters
  } from '#lib/search.ts';

  let { data } = $props();
  const { stats } = $derived(data);

  let filters = $state<Filters>(readFilters(new URLSearchParams()));
  let announced = $state('');
  let input = $state<HTMLInputElement>();
  let synced = false;

  const index = $derived(searchIndex.current);
  const idle = $derived(!parse(filters.q).terms.length && !filters.must.length);
  const scored = $derived(index && score(index, filters.q));
  const ignored = $derived(
    scored?.terms.filter((_, t) => !scored.live[t]).map(({ text }) => text) ?? []
  );
  const results = $derived(
    index && scored ? order(filter(scored, filters.must), filters.sort) : []
  );
  const unfiltered = $derived(scored && filters.must.length ? filter(scored, []) : []);

  const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;
  const quote = (words: string[]) => words.map((word) => `“${word}”`).join(' or ');
  const heading = $derived(
    `${results.length ? plural(results.length, 'result') : 'No results'}${filters.q.trim() ? ` for “${filters.q.trim()}”` : ''}`
  );

  function read() {
    filters = readFilters(new URL(location.href).searchParams);
    synced = true;
  }

  onMount(() => {
    read();
    searchIndex.load();
  });

  afterNavigate(({ type }) => {
    if (type === 'goto') return;
    read();
    if (type !== 'popstate' && !filters.q && matchMedia('(pointer: fine)').matches) input?.focus();
  });

  $effect(() => {
    const search = writeFilters(filters);
    if (synced && search !== location.search)
      goto(search || location.pathname, { shallow: true, replace: true });
  });

  $effect(() => {
    const text = idle
      ? ''
      : searchIndex.failed
        ? "The search didn't load."
        : index
          ? heading
          : 'Loading';
    const timer = setTimeout(() => (announced = text), 600);
    return () => clearTimeout(timer);
  });

  function submit(event: SubmitEvent) {
    event.preventDefault();
    if (matchMedia('(pointer: coarse)').matches) input?.blur();
  }

  function clear() {
    filters.q = '';
    input?.focus();
  }

  const clearFilters = () => (filters.must = []);

  function shortcut(event: KeyboardEvent) {
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
    if ((event.target as Element).closest('input, select, textarea, [contenteditable]')) return;
    event.preventDefault();
    input?.select();
  }
</script>

<svelte:window onkeydown={shortcut} />

{#snippet tries()}
  <ul class="suggestions">
    {#each suggestions as suggestion (suggestion)}
      <li><a href="?q={encodeURIComponent(suggestion.toLowerCase())}">{suggestion}</a></li>
    {/each}
  </ul>
{/snippet}

<Seo
  title="Search every VPN, value and source"
  description="Search {stats.providers} VPN providers on {stats.criteria} privacy criteria. Find who takes Monero, runs WireGuard or has been audited, with a source behind every value."
  path="/search"
  crumb="Search"
/>

<section class="preface">
  <h1>Search</h1>
</section>

<form class="box" role="search" onsubmit={submit}>
  <label for="query" class="visually-hidden">Search providers</label>
  <svg viewBox="0 0 24 24" aria-hidden="true"
    ><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></svg
  >
  <input
    id="query"
    type="search"
    placeholder="Try monero, wireguard or switzerland"
    autocomplete="off"
    autocapitalize="off"
    spellcheck="false"
    enterkeyhint="search"
    bind:value={filters.q}
    bind:this={input}
  />
  {#if filters.q}
    <button type="button" class="clear" onclick={clear}>Clear</button>
  {:else}
    <kbd aria-hidden="true">/</kbd>
  {/if}
</form>

<div class="tools">
  <MustHave bind:selected={filters.must} />
</div>

{#if idle}
  <section class="section try" aria-labelledby="try">
    <div class="lead">
      <h2 id="try">Try</h2>
      <p>Or anything you'd look for on a provider's page.</p>
    </div>
    {@render tries()}
  </section>
{:else}
  <section class="results" aria-labelledby="count">
    <header>
      <h2 id="count">{index ? heading : 'Searching'}</h2>
      {#if filters.must.length}
        <button type="button" class="link" onclick={clearFilters}>Clear filters</button>
      {/if}
      <div class="sort">
        <SortBy bind:value={filters.sort} options={sorts} />
      </div>
    </header>

    {#if ignored.length && results.length}
      <p class="note">Nothing matched {quote(ignored)}, so it's left out.</p>
    {/if}

    {#if searchIndex.failed}
      <p class="empty">
        The search didn't load.
        <button type="button" class="link" onclick={() => location.reload()}>Try again</button>
      </p>
    {:else if !index}
      <p class="empty">Loading every provider…</p>
    {:else if results.length}
      <ol>
        {#each results as result (result.provider.id)}
          <li><SearchResult {result} terms={scored?.terms ?? []} /></li>
        {/each}
      </ol>
    {:else if unfiltered.length}
      <p class="empty">
        {plural(unfiltered.length, 'result')} would show without the filters.
        <button type="button" class="link" onclick={clearFilters}>Clear filters</button>
      </p>
    {:else}
      <div class="empty">
        <p>Nothing matches. Check the spelling, or try one of these.</p>
        {@render tries()}
      </div>
    {/if}
  </section>
{/if}

<p class="visually-hidden" role="status">{announced}</p>

<style>
  .box {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding-inline: var(--space-4) var(--space-3);
    border: var(--rule-thin) solid var(--rule);
    background: var(--surface);

    &:has(input:focus-visible) {
      outline: calc(var(--rule-heavy) - var(--rule-thin)) solid var(--rule);
      outline-offset: calc(-1 * var(--rule-heavy));
    }

    & svg {
      flex: none;
      width: 1.5rem;
      height: 1.5rem;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
    }

    & input {
      flex: 1;
      min-width: 0;
      padding-block: var(--space-3);
      border: 0;
      border-radius: 0;
      outline: none;
      background: none;
      font-size: var(--text-lg);
      font-weight: 500;
      letter-spacing: -0.02em;

      @media (max-width: 40rem) {
        font-size: var(--text-md);
      }

      &::placeholder {
        color: var(--text-muted);
        opacity: 1;
      }

      &::-webkit-search-cancel-button {
        appearance: none;
      }
    }

    & kbd {
      padding: 0 var(--space-2);
      border: var(--rule-thin) solid var(--rule-faint);
      font-family: var(--mono);
      font-size: var(--text-sm);
      color: var(--text-muted);

      @media (pointer: coarse) {
        display: none;
      }
    }

    &:focus-within kbd {
      visibility: hidden;
    }
  }

  .clear,
  .link {
    padding: 0;
    border: 0;
    background: none;
    color: var(--text);
    font-size: var(--text-sm);
    text-decoration: underline;
    cursor: pointer;
  }

  .clear {
    padding: var(--space-2);
    text-decoration: none;
    color: var(--text-muted);

    &:hover {
      color: var(--text);
      text-decoration: underline;
    }
  }

  .tools {
    padding-block: var(--space-4) var(--space-6);
  }

  .sort {
    margin-left: auto;
  }

  .try {
    margin-top: var(--space-6);
  }

  .suggestions {
    display: flex;
    flex-wrap: wrap;
    align-content: start;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;

    & a {
      display: block;
      padding: var(--space-2) var(--space-4);
      border: var(--rule-thin) solid var(--rule);
      font-weight: 600;
      text-decoration: none;
      transition: background-color var(--quick) var(--ease);

      &:hover {
        background: var(--surface-hover);
      }
    }
  }

  .results > header {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-2) var(--space-4);
    padding-block: var(--space-4);
    border-top: var(--rule-heavy) solid var(--rule);

    & h2 {
      font-size: var(--text-lg);
    }
  }

  .note {
    margin-bottom: var(--space-3);
    font-size: var(--text-sm);
    color: var(--text-muted);
  }

  ol {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .empty {
    display: grid;
    gap: var(--space-4);
    padding-block: var(--space-5) var(--space-6);
    border-top: var(--rule-thin) solid var(--rule-faint);
    color: var(--text-muted);
  }
</style>
