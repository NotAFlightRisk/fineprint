<script lang="ts">
  import GradeMark from '#lib/components/GradeMark.svelte';
  import type { Criterion, Grade, Item, Ref } from '#lib/data/types.ts';
  import { formatDate, newestFirst, optionLabel } from '#lib/format.ts';

  let {
    criterion,
    items,
    refs,
    cited
  }: {
    criterion: Criterion;
    items: Item[];
    refs: Record<string, Ref>;
    cited: Map<string, number>;
  } = $props();

  const fields = $derived(
    Object.entries(criterion.fields ?? {}).filter(([name]) => name !== 'date' && name !== 'source')
  );
  const show = (name: string, value: string) =>
    optionLabel({ options: criterion.fields?.[name].options }, value);
  const marks: Record<string, Grade> = { well: 'good', poorly: 'bad', serious: 'bad', minor: 'ok' };
</script>

<ol class="timeline" class:undated={!criterion.fields?.date}>
  {#each newestFirst(items) as item, index (index)}
    <li>
      {#if item.date}<time datetime={item.date}>{formatDate(item.date, true)}</time>{/if}
      <p>
        {#each fields as [name, field] (name)}
          {#if name === 'handled' || name === 'severity'}
            <span class="marked">
              <GradeMark grade={marks[item[name]]} label="" />
              {show(name, item[name])}
            </span>
          {:else}
            <span class:tag={field.type === 'enum'}>{show(name, item[name])}</span>
          {/if}
        {/each}
        {#if item.source && refs[item.source]}
          <a href={refs[item.source].url} target="_blank" rel="noopener external"
            >Read it<span class="visually-hidden">: {refs[item.source].title}</span></a
          >
          <span class="visually-hidden">(source {cited.get(item.source)})</span>
        {/if}
      </p>
    </li>
  {/each}
</ol>

<style>
  .timeline {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;
    border-left: var(--rule-thin) solid var(--rule);

    & li {
      display: grid;
      grid-template-columns: 5.5rem 1fr;
      gap: var(--space-3);
      padding: var(--space-1) 0 var(--space-1) var(--space-3);
    }

    &.undated li {
      grid-template-columns: 1fr;
    }

    & time {
      font-weight: 600;
      font-size: var(--text-sm);
    }

    & p {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: var(--space-1) var(--space-3);
      font-size: var(--text-sm);
    }
  }

  .tag {
    color: var(--text-muted);
  }

  .marked {
    display: inline-flex;
    align-items: baseline;
    gap: var(--space-1);
  }
</style>
