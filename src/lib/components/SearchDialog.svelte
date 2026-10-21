<script lang="ts">
  import { beforeNavigate } from '$app/navigation';
  import { searchIndex } from '#lib/api.svelte.ts';
  import Highlight from '#lib/components/Highlight.svelte';
  import { excerpt, parse, search } from '#lib/search.ts';

  let { open = $bindable() }: { open: boolean } = $props();

  let dialog = $state<HTMLDialogElement>();
  let query = $state('');
  let active = $state(0);

  const limit = 8;
  const steps: Record<string, number> = { ArrowDown: 1, ArrowUp: -1 };
  const terms = $derived(parse(query).terms);
  const results = $derived(searchIndex.current ? search(searchIndex.current, query) : []);
  const shown = $derived(results.slice(0, limit));

  $effect(() => {
    if (open) {
      dialog?.showModal();
      searchIndex.load();
    } else dialog?.close();
  });

  function move(event: KeyboardEvent) {
    if (event.isComposing) return;
    const step = steps[event.key];
    if (step && shown.length) {
      event.preventDefault();
      active = (active + step + shown.length) % shown.length;
      document.getElementById(`search-result-${active}`)?.scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'Enter') document.getElementById(`search-result-${active}`)?.click();
  }

  function reset() {
    open = false;
    query = '';
    active = 0;
  }

  beforeNavigate(() => (open = false));
</script>

<dialog
  bind:this={dialog}
  aria-label="Search"
  onclose={reset}
  onclick={({ target }) =>
    (target === dialog || (target as Element).closest('a')) && (open = false)}
>
  <label>
    <svg viewBox="0 0 24 24" aria-hidden="true"
      ><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></svg
    >
    <input
      type="text"
      role="combobox"
      aria-label="Search providers"
      aria-expanded={shown.length > 0}
      aria-controls="search-results"
      aria-activedescendant={shown.length ? `search-result-${active}` : undefined}
      aria-autocomplete="list"
      placeholder="Search"
      autocomplete="off"
      spellcheck="false"
      bind:value={query}
      oninput={() => (active = 0)}
      onkeydown={move}
    />
  </label>
  <div id="search-results" role="listbox" aria-label="Results">
    {#each shown as result, index (result.summary.id)}
      {@const match = result.matches[0]}
      <a
        id="search-result-{index}"
        role="option"
        aria-selected={index === active}
        tabindex="-1"
        href={match?.fact.href ?? `/${result.summary.id}`}
        onpointermove={() => (active = index)}
      >
        <img src="/icons/{result.summary.icon}" alt="" width="24" height="24" />
        <span class="name"><Highlight text={result.summary.name} {terms} /></span>
        <span class="match">
          {#if match}
            <Highlight
              text="{match.fact.label}: {match.detail
                ? excerpt(match.detail, terms)
                : match.fact.text}"
              {terms}
            />
          {:else}
            {result.summary.where.join(' · ')}
          {/if}
        </span>
      </a>
    {/each}
  </div>
  {#if results.length > limit}
    <a class="all" href="/search?q={encodeURIComponent(query.trim())}"
      >All {results.length} results</a
    >
  {:else if searchIndex.failed}
    <p>Search didn't load</p>
  {:else if terms.length && searchIndex.current && !results.length}
    <p>No results</p>
  {/if}
</dialog>

<style>
  dialog {
    width: min(36rem, 100% - 2rem);
    max-height: min(32rem, 100% - 8rem);
    margin: 12vh auto auto;
    padding: 0;
    overflow: hidden;
    border: var(--rule-thin) solid var(--rule);
    background: var(--surface-raised);
    color: var(--text);
    box-shadow: 0 1rem 3rem -1rem var(--shadow);
    transition:
      opacity var(--quick) var(--ease),
      scale var(--quick) var(--ease);

    &[open] {
      display: flex;
      flex-direction: column;
    }

    &::backdrop {
      background: rgb(0 0 0 / 0.4);
    }

    @starting-style {
      opacity: 0;
      scale: 0.98;
    }

    & > * + * {
      border-top: var(--rule-thin) solid var(--rule-faint);
    }
  }

  label {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding-inline: var(--space-4);

    & svg {
      flex: none;
      width: 1.25rem;
      height: 1.25rem;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
    }
  }

  input {
    flex: 1;
    min-width: 0;
    padding-block: var(--space-4);
    border: 0;
    outline: none;
    background: none;
    font-size: var(--text-md);
  }

  [role='listbox'] {
    overflow-y: auto;

    &:empty {
      display: none;
    }
  }

  [role='option'] {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    column-gap: var(--space-3);
    padding: var(--space-2) var(--space-4);
    text-decoration: none;

    &[aria-selected='true'] {
      background: var(--surface-hover);
      box-shadow: inset var(--rule-heavy) 0 var(--rule);
    }

    & img {
      grid-row: span 2;
    }
  }

  .name {
    font-weight: 600;
  }

  .match {
    overflow: hidden;
    font-size: var(--text-sm);
    color: var(--text-muted);
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .all,
  p {
    padding: var(--space-3) var(--space-4);
    font-size: var(--text-sm);
  }

  .all {
    font-weight: 600;
    text-decoration: none;
    outline-offset: -2px;

    &::after {
      content: ' →' / '';
    }

    &:hover {
      text-decoration: underline;
    }
  }

  p {
    color: var(--text-muted);
  }
</style>
