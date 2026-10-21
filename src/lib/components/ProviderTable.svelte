<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';
  import External from '#lib/components/External.svelte';
  import Flag from '#lib/components/Flag.svelte';
  import GradeMark from '#lib/components/GradeMark.svelte';
  import type { Category, Entry, Provider } from '#lib/data/types.ts';
  import { sortBy, type Sort } from '#lib/filters.ts';
  import { showEntry } from '#lib/format.ts';
  import { byId, type Summary } from '#lib/summary.ts';
  import { compare, toCsv, download } from '#lib/table.ts';
  import { tip } from '#lib/tip.ts';

  let {
    summaries,
    providers,
    categories,
    order
  }: { summaries: Summary[]; providers: Provider[]; categories: Category[]; order: Sort } =
    $props();

  const criteria = $derived(byId(categories));
  const lookup = $derived(new Map(providers.map((provider) => [provider.id, provider])));
  const columnFor: Record<Sort, string> = { flags: 'flags', price: 'pricing.best', name: 'name' };

  // follows the chosen order until a header is clicked
  let sort = $derived<{ id: string; direction: 1 | -1 }>({ id: columnFor[order], direction: 1 });
  let active = $state<string>();
  const hidden = new SvelteSet<string>();

  const shown = $derived(categories.filter((category) => !hidden.has(category.id)));
  const columns = $derived(shown.flatMap((category) => category.criteria));

  const rows = $derived.by(() => {
    const { id, direction } = sort;
    return summaries
      .map((summary) => ({ summary, provider: lookup.get(summary.id)! }))
      .toSorted((a, b) =>
        id === 'name' || id === 'flags'
          ? direction * sortBy[id](a.summary, b.summary)
          : compare(criteria.get(id)!, a.provider.criteria[id], b.provider.criteria[id], direction)
      );
  });

  const sortOn = (id: string) =>
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
  const listed = () => rows.map(({ provider }) => provider);
  const exportCsv = () =>
    download(`fineprint-${stamp()}.csv`, 'text/csv', toCsv(listed(), columns));
  const exportJson = () =>
    download(`fineprint-${stamp()}.json`, 'application/json', JSON.stringify(listed(), null, 2));
</script>

<!-- the sort buttons keep their tooltips but skip the ⓘ, which would crowd the header -->
{#snippet heading(id: string, label: string, description?: string)}
  <button type="button" onclick={() => sortOn(id)} {@attach tip(description)}>
    {label}
    {#if sort.id === id}
      <svg viewBox="0 0 16 16" aria-hidden="true" class:down={sort.direction === -1}
        ><path d="M8 13V3M4 7l4-4 4 4" /></svg
      >
    {/if}
  </button>
{/snippet}

<section class="tools" aria-label="Table controls">
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
          {@render heading(
            'flags',
            'Red flags',
            'How many things graded red. Red if any are serious, orange if not'
          )}
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
      {#each rows as { summary, provider } (provider.id)}
        <tr>
          <th scope="row">
            <a href="/{provider.id}">
              <img src="/icons/{provider.icon}" alt="" width="20" height="20" />
              {provider.name}
            </a>
          </th>
          <td
            class="flags"
            class:none={!summary.flags.length}
            data-grade={summary.serious ? 'bad' : 'ok'}
          >
            {#if summary.flags.length}
              <button type="button" class="noted" {@attach tip(summary.flags.join('\n'))}>
                {summary.flags.length}
              </button>
            {:else}
              0
            {/if}
          </td>
          {#each columns as column (column.id)}
            {@const entry = provider.criteria[column.id]}
            {@const text = showEntry(column, entry)}
            {@const note = cellTip(entry, text)}
            {@const source =
              column.type === 'url' && typeof entry?.value === 'string'
                ? { url: entry.value, title: text }
                : entry?.sources[0] && provider.refs[entry.sources[0]]}
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
                  <Flag code={entry.value} />
                {/if}
                {#if note}
                  <button type="button" class="noted text" {@attach tip(note)}>{text}</button>
                {:else}
                  <span class="text">{text}</span>
                {/if}
                {#if source}
                  <External href={source.url} label="Source: {source.title}" />
                {/if}
              </span>
            </td>
          {/each}
        </tr>
      {:else}
        <tr>
          <td class="empty" colspan={columns.length + 2}> Nothing matches. Try fewer filters. </td>
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
    margin-bottom: var(--space-4);
    font-size: var(--text-sm);
  }

  .export button {
    padding: var(--space-1) var(--space-3);
    border: var(--rule-thin) solid var(--rule);
    background: var(--surface);
    cursor: pointer;

    &:hover {
      background: var(--surface-hover);
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
      margin: 0;
      border: 0;
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

    &[scope='colgroup'] {
      border-left: var(--rule-thin) solid var(--rule-faint);
    }
  }

  thead tr + tr th {
    top: calc(var(--text-xs) * 1.5 + var(--space-2) * 2 + var(--rule-thin));
  }

  /* the provider column stays put while the rest scrolls past */
  .groups th:first-child,
  tbody th {
    position: sticky;
    left: 0;
    z-index: 1;
    background: var(--surface);
    border-right: var(--rule-thin) solid var(--rule);
  }

  .groups th:first-child {
    z-index: 3;
  }

  tbody tr {
    & > * {
      transition: background-color var(--quick) var(--ease);
    }

    &:is(:hover, :focus-within) > * {
      background-color: color-mix(in srgb, var(--surface-sunken) 60%, var(--surface));
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

    @media (max-width: 40rem) {
      white-space: normal;
    }
  }

  .flags {
    font-weight: 600;
    color: var(--grade);

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

  .empty {
    padding-block: var(--space-6);
    color: var(--text-muted);
  }
</style>
