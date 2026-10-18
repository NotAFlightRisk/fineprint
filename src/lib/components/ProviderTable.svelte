<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';
  import type { Category, Criterion, Entry, Provider } from '#lib/data/types.js';
  import { showEntry } from '#lib/format.js';
  import { checklist, checks } from '#lib/summary.js';
  import { compare, toCsv, download } from '#lib/table.js';
  import { tip } from '#lib/tip.js';
  import Flag from './Flag.svelte';
  import GradeMark from './GradeMark.svelte';

  let {
    providers,
    categories,
    criteria,
    flags
  }: {
    providers: Provider[];
    categories: Category[];
    criteria: Map<string, Criterion>;
    flags: Record<string, string>;
  } = $props();

  let query = $state('');
  let sort = $state<{ id: string; direction: 1 | -1 }>({ id: 'name', direction: 1 });
  let active = $state<string>();
  const required = new SvelteSet<string>();
  const hidden = new SvelteSet<string>();

  const shown = $derived(categories.filter((category) => !hidden.has(category.id)));
  const columns = $derived(shown.flatMap((category) => category.criteria));

  const rows = $derived.by(() => {
    const words = query.trim().toLowerCase();
    const list = providers.filter((provider) => {
      if (words && !provider.name.toLowerCase().includes(words)) return false;
      const passed = checklist(provider, criteria);
      return [...required].every((id) => passed.find((check) => check.id === id)?.grade === 'good');
    });
    const { id, direction } = sort;
    return list.toSorted((a, b) =>
      id === 'name'
        ? direction * a.name.localeCompare(b.name)
        : id === 'flags'
          ? direction * (a.flags.length - b.flags.length)
          : compare(criteria.get(id)!, a.criteria[id], b.criteria[id], direction)
    );
  });

  const sortBy = (id: string) =>
    (sort = { id, direction: sort.id === id ? (-sort.direction as 1 | -1) : 1 });
  const ariaSort = (id: string) =>
    sort.id === id ? (sort.direction === 1 ? 'ascending' : 'descending') : undefined;
  const toggle = (set: SvelteSet<string>, id: string) =>
    set.has(id) ? set.delete(id) : set.add(id);

  const long = (text: string) => text.length > 60;
  const cellTip = (entry: Entry | undefined, text: string) =>
    entry &&
    [long(text) && text, entry.evidence && `Evidence: ${entry.evidence}`, entry.note]
      .filter(Boolean)
      .join('\n');

  const stamp = () => new Date().toISOString().slice(0, 10);
  const exportCsv = () => download(`fineprint-${stamp()}.csv`, 'text/csv', toCsv(rows, columns));
  const exportJson = () =>
    download(`fineprint-${stamp()}.json`, 'application/json', JSON.stringify(rows, null, 2));
</script>

{#snippet heading(id: string, label: string, description?: string)}
  <button type="button" onclick={() => sortBy(id)} {@attach tip(description)}>
    {label}
    {#if sort.id === id}
      <svg viewBox="0 0 16 16" aria-hidden="true" class:down={sort.direction === -1}
        ><path d="M8 13V3M4 7l4-4 4 4" /></svg
      >
    {/if}
  </button>
{/snippet}

<section class="tools" aria-label="Table controls">
  <label class="search">
    <span class="visually-hidden">Find a provider</span>
    <input type="search" placeholder="Find a provider" bind:value={query} />
  </label>

  <fieldset class="chips">
    <legend>Must have</legend>
    {#each checks as check (check.id)}
      <button
        type="button"
        aria-pressed={required.has(check.id)}
        onclick={() => toggle(required, check.id)}>{check.label}</button
      >
    {/each}
  </fieldset>

  <details class="columns">
    <summary>
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5" /></svg>
      Columns <span>{shown.length} of {categories.length}</span>
    </summary>
    <fieldset>
      <legend class="visually-hidden">Show categories</legend>
      {#each categories as category (category.id)}
        <label>
          <input
            type="checkbox"
            checked={!hidden.has(category.id)}
            onchange={() => toggle(hidden, category.id)}
          />
          {category.label}
        </label>
      {/each}
    </fieldset>
  </details>

  <div class="export">
    <span>Download</span>
    <button type="button" onclick={exportCsv}>CSV</button>
    <button type="button" onclick={exportJson}>JSON</button>
  </div>
</section>

<p class="count" role="status">
  Showing {rows.length} of {providers.length} providers
  {#if rows.length < providers.length}
    <button type="button" class="reset" onclick={() => ((query = ''), required.clear())}>
      Clear filters
    </button>
  {/if}
</p>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div class="scroller" role="region" aria-label="Comparison table" tabindex="0">
  <table onpointerleave={() => (active = undefined)}>
    <caption class="visually-hidden">
      Every provider against every criterion. Column headers sort.
    </caption>
    <colgroup>
      <col />
      <col />
      {#each columns as column (column.id)}
        <col class:active={active === column.id} />
      {/each}
    </colgroup>
    <thead>
      <tr class="groups">
        <th rowspan="2" scope="col" aria-sort={ariaSort('name')}>
          {@render heading('name', 'Provider')}
        </th>
        <th rowspan="2" scope="col" aria-sort={ariaSort('flags')}>
          {@render heading('flags', 'Red flags', 'How many things graded red')}
        </th>
        {#each shown as category (category.id)}
          <th colspan={category.criteria.length} scope="colgroup">{category.label}</th>
        {/each}
      </tr>
      <tr>
        {#each columns as column (column.id)}
          <th scope="col" aria-sort={ariaSort(column.id)}>
            {@render heading(column.id, column.label, column.description)}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each rows as provider (provider.id)}
        <tr>
          <th scope="row">
            <a href="/{provider.id}">
              <img src="/icons/{provider.icon}" alt="" width="20" height="20" />
              {provider.name}
            </a>
          </th>
          <td class="flags" class:none={!provider.flags.length}>{provider.flags.length}</td>
          {#each columns as column (column.id)}
            {@const entry = provider.criteria[column.id]}
            {@const text = showEntry(column, entry)}
            {@const note = cellTip(entry, text)}
            {@const source = entry?.sources[0] && provider.refs[entry.sources[0]]}
            <td
              onpointerenter={() => (active = column.id)}
              onfocusin={() => (active = column.id)}
              onfocusout={() => (active = undefined)}
              class:missing={!entry}
            >
              <span class="cell">
                {#if entry && entry.grade !== 'info'}
                  <GradeMark grade={entry.grade} />
                {/if}
                {#if column.type === 'country' && typeof entry?.value === 'string'}
                  <Flag src={flags[entry.value]} />
                {/if}
                {#if note}
                  <button type="button" class="plain noted text" {@attach tip(note)}>{text}</button>
                {:else}
                  <span class="text">{text}</span>
                {/if}
                {#if source}
                  <a class="source" href={source.url} target="_blank" rel="noopener external">
                    <svg viewBox="0 0 16 16" aria-hidden="true"
                      ><path d="M6 3.5H3.5v9h9V10M9 3.5h3.5V7M12.5 3.5 7 9" /></svg
                    >
                    <span class="visually-hidden">Source: {source.title} (opens in a new tab)</span>
                  </a>
                {/if}
              </span>
            </td>
          {/each}
        </tr>
      {:else}
        <tr>
          <td class="empty" colspan={columns.length + 2}>
            Nothing passes all of those. Try fewer must-haves.
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .tools {
    display: flex;
    flex-wrap: wrap;
    align-items: start;
    gap: var(--space-3) var(--space-5);
    font-size: var(--text-sm);
  }

  input[type='search'] {
    width: 14rem;
    padding: var(--space-2) var(--space-3);
    border: var(--rule-thin) solid var(--rule);
    border-radius: 0;
    background: var(--surface);
  }

  fieldset {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    border: 0;
  }

  .chips {
    min-inline-size: 0;

    @media (max-width: 40rem) {
      flex-wrap: nowrap;
      overflow-x: auto;
      width: 100%;

      & button {
        flex: none;
      }
    }
  }

  .chips legend {
    float: left;
    margin-right: var(--space-2);
    padding-block: var(--space-1);
    color: var(--text-muted);

    @media (max-width: 40rem) {
      float: none;
      padding-block: 0 var(--space-2);
    }
  }

  .tools button {
    padding: var(--space-1) var(--space-3);
    border: var(--rule-thin) solid var(--rule);
    background: var(--surface);
    cursor: pointer;

    &:hover {
      background: var(--surface-hover);
    }

    &[aria-pressed='true'] {
      background: var(--text);
      color: var(--surface);
    }
  }

  .columns {
    & summary {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-1) var(--space-3);
      border: var(--rule-thin) solid var(--rule);
      list-style: none;
      cursor: pointer;

      &::-webkit-details-marker {
        display: none;
      }

      & svg {
        width: 0.875rem;
        height: 0.875rem;
        fill: none;
        stroke: currentColor;
        stroke-width: 2;
        transition: rotate var(--quick) var(--ease);
      }

      & span {
        color: var(--text-muted);
      }
    }

    &[open] summary svg {
      rotate: 90deg;
    }

    & fieldset {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
      gap: var(--space-1) var(--space-4);
      min-width: min(34rem, 80vw);
      padding: var(--space-3) 0;
    }

    & label {
      display: flex;
      gap: var(--space-2);
    }
  }

  .export {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-left: auto;

    & span {
      color: var(--text-muted);
    }
  }

  .count {
    display: flex;
    align-items: baseline;
    gap: var(--space-3);
    margin-block: var(--space-4) var(--space-2);
    font-size: var(--text-sm);
    color: var(--text-muted);
  }

  .reset {
    border: 0;
    padding: 0;
    background: none;
    text-decoration: underline;
    color: var(--text);
    cursor: pointer;
  }

  .scroller {
    overflow: auto;
    max-height: 80vh;
    scrollbar-color: var(--rule-faint) transparent;
    scrollbar-width: thin;
    border-top: var(--rule-heavy) solid var(--rule);
  }

  table {
    border-collapse: separate;
    border-spacing: 0;
    font-size: var(--text-sm);
  }

  col {
    transition: background-color var(--quick) var(--ease);

    &.active {
      background: var(--surface-sunken);
    }
  }

  th,
  td {
    padding: var(--space-2) var(--space-3);
    border-bottom: var(--rule-thin) solid var(--rule-faint);
    text-align: left;
    vertical-align: top;
  }

  thead th {
    position: sticky;
    top: 0;
    z-index: 2;
    background: var(--surface);
    font-weight: 600;
    white-space: nowrap;
    border-bottom-color: var(--rule);

    & button {
      padding: 0;
      border: 0;
      background: none;
      font-weight: inherit;
      text-align: left;

      &:hover {
        text-decoration: underline;
      }
    }

    & svg {
      width: 0.75rem;
      height: 0.75rem;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;

      &.down {
        rotate: 180deg;
      }
    }
  }

  .groups th {
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    border-left: var(--rule-thin) solid var(--rule-faint);
  }

  thead tr + tr th {
    top: calc(var(--text-xs) * 1.5 + var(--space-2) * 2 + var(--rule-thin));
  }

  th:first-child {
    position: sticky;
    left: 0;
    z-index: 1;
    background: var(--surface);
    border-right: var(--rule-thin) solid var(--rule);
  }

  thead th:first-child {
    z-index: 3;
  }

  tbody tr {
    & > * {
      transition: background-color var(--quick) var(--ease);
    }

    &:is(:hover, :focus-within) > * {
      background-color: color-mix(in srgb, var(--surface-sunken) 60%, transparent);
    }
  }

  tbody th a {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-weight: 600;
    white-space: nowrap;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  .flags {
    font-weight: 600;
    color: var(--bad);

    &.none {
      color: var(--text-muted);
      font-weight: 400;
    }
  }

  .cell {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
    width: max-content;
    min-width: 8rem;
    max-width: 18rem;
  }

  .text {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    overflow: hidden;
  }

  .missing {
    color: var(--text-muted);
  }

  .source {
    color: var(--text-muted);

    &:hover {
      color: var(--text);
    }

    & svg {
      width: 0.875rem;
      height: 0.875rem;
      vertical-align: -0.1em;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.5;
    }
  }

  .empty {
    padding-block: var(--space-6);
    color: var(--text-muted);
  }
</style>
