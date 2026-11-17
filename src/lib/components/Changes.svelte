<script lang="ts">
  import GradeMark from '#lib/components/GradeMark.svelte';
  import { changeKey, changeText } from '#lib/data/changes.ts';
  import type { LogEntry } from '#lib/data/types.ts';
  import { formatDate } from '#lib/format.ts';
  import { site } from '#lib/site.ts';

  let {
    entries,
    labels,
    named = false
  }: { entries: LogEntry[]; labels: Record<string, string>; named?: boolean } = $props();

  const source = ({ pr, commit }: LogEntry) =>
    pr
      ? { href: `${site.repo}/pull/${pr}`, text: `#${pr}` }
      : { href: `${site.repo}/commit/${commit}`, text: commit };
</script>

<ol class="changes">
  {#each entries as entry (changeKey(entry))}
    {@const { href, text } = source(entry)}
    <li>
      <p class="when">
        <time datetime={entry.date}>{formatDate(entry.date)}</time>
        <a {href} target="_blank" rel="noopener external">{text}</a>
      </p>
      <div class="what">
        {#if named}
          {#if entry.removed}<strong>{entry.name}</strong>{:else}<a class="name" href="/{entry.id}"
              >{entry.name}</a
            >{/if}
        {/if}
        <ul>
          {#if entry.added}<li><span>Added to the comparison</span></li>{/if}
          {#if entry.removed}<li><span>Taken out of the comparison</span></li>{/if}
          {#each entry.changes ?? [] as change (change.key)}
            <li>
              {#if change.grade}<GradeMark grade={change.grade} />{/if}
              <span>
                <span class="label">{labels[change.key] ?? change.key}</span>
                {#if change.from !== undefined}
                  <del><span class="visually-hidden">was</span> {change.from}</del>
                  <ins><span class="visually-hidden">now</span> {change.to}</ins>
                {:else}
                  <span class="muted">{changeText(change)}</span>
                {/if}
              </span>
            </li>
          {/each}
          {#if entry.checked}<li><span class="muted">Rechecked in full</span></li>{/if}
        </ul>
      </div>
    </li>
  {/each}
</ol>

<style>
  .changes {
    display: grid;
    margin: 0;
    padding: 0;
    list-style: none;

    & > li {
      display: grid;
      grid-template-columns: minmax(7rem, 2fr) 7fr;
      gap: var(--space-1) var(--space-4);
      padding-block: var(--space-3);
      border-bottom: var(--rule-thin) solid var(--rule-faint);

      @media (max-width: 40rem) {
        grid-template-columns: 1fr;
      }
    }
  }

  .when {
    display: flex;
    flex-wrap: wrap;
    align-content: start;
    gap: 0 var(--space-3);
    font-size: var(--text-sm);

    & time {
      font-weight: 600;
    }

    & a {
      color: var(--text-muted);
    }
  }

  .what {
    display: grid;
    align-content: start;
    gap: var(--space-1);

    & .name,
    & strong {
      font-weight: 600;
    }

    & ul {
      display: grid;
      gap: var(--space-1);
      margin: 0;
      padding: 0;
      list-style: none;
      font-size: var(--text-sm);
    }

    & li {
      display: grid;
      grid-template-columns: var(--mark) 1fr;
      align-items: baseline;
      gap: var(--space-2);

      & > span {
        grid-column: 2;
      }
    }
  }

  .label {
    margin-right: var(--space-2);
    font-weight: 600;
  }

  del {
    margin-right: var(--space-1);
    color: var(--text-muted);
  }

  ins {
    text-decoration: none;
  }

  .muted {
    color: var(--text-muted);
  }
</style>
