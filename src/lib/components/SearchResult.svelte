<script lang="ts">
  import Flag from '#lib/components/Flag.svelte';
  import GradeMark from '#lib/components/GradeMark.svelte';
  import Highlight from '#lib/components/Highlight.svelte';
  import RedFlags from '#lib/components/RedFlags.svelte';
  import { excerpt, type Result, type Term } from '#lib/search.ts';
  import { verdict } from '#lib/summary.ts';

  let { result, terms }: { result: Result; terms: Term[] } = $props();
  const { summary, matches } = $derived(result);

  const limit = 5;
</script>

<article>
  <header>
    <h3>
      <a href="/{summary.id}">
        <img src="/icons/{summary.icon}" alt="" width="28" height="28" />
        <span><Highlight text={summary.name} {terms} /></span>
      </a>
    </h3>
    <p class="meta"><Flag code={summary.hq} />{summary.where.join(' · ')}</p>
    <p class="meta">
      <span>{summary.price ? `From ${summary.price}` : 'Price unknown'}</span>
      <RedFlags flags={summary.flags} serious={summary.serious} />
    </p>
  </header>
  {#if matches.length}
    <div class="body">
      <dl>
        {#each matches.slice(0, limit) as { fact, detail } (fact.id)}
          <div class="row">
            <dt><a href={fact.href}><Highlight text={fact.label} {terms} /></a></dt>
            <dd>
              <p class="value">
                {#if fact.grade !== 'info'}<GradeMark grade={fact.grade} />{/if}
                <span class:unknown={fact.grade === null}
                  ><Highlight text={fact.text} {terms} /></span
                >
              </p>
              {#if detail}
                <p class="detail"><Highlight text={excerpt(detail, terms)} {terms} /></p>
              {/if}
            </dd>
          </div>
        {/each}
      </dl>
      {#if matches.length > limit}
        <a class="more" href="/{summary.id}"
          >{matches.length - limit} more<span class="visually-hidden"> for {summary.name}</span></a
        >
      {/if}
    </div>
  {:else}
    <p class="body verdict">{verdict(summary)}</p>
  {/if}
</article>

<style>
  article {
    display: grid;
    grid-template-columns: 3fr 9fr;
    gap: var(--space-3) var(--space-5);
    padding-block: var(--space-4) var(--space-5);
    border-top: var(--rule-thin) solid var(--rule-faint);

    @media (max-width: 56rem) {
      grid-template-columns: 1fr;
    }
  }

  header {
    display: grid;
    align-content: start;
    gap: var(--space-1);
  }

  h3 {
    font-size: var(--text-md);
    letter-spacing: -0.02em;

    & a {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
        text-decoration-thickness: 2px;
      }
    }

    & img {
      flex: none;
    }
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-1) var(--space-3);
    font-size: var(--text-sm);
    color: var(--text-muted);
  }

  .body {
    display: grid;
    align-content: start;
    gap: var(--space-2);
  }

  dl {
    display: grid;
    gap: var(--space-2);
    margin: 0;
  }

  .row {
    display: grid;
    grid-template-columns: minmax(9rem, 2fr) 5fr;
    gap: var(--space-1) var(--space-4);

    @media (max-width: 40rem) {
      grid-template-columns: minmax(6.5rem, 2fr) 3fr;
      gap: var(--space-1) var(--space-3);
      font-size: var(--text-sm);
    }
  }

  dt {
    font-weight: 600;
  }

  dd {
    display: grid;
    gap: var(--space-1);
    margin: 0;
  }

  .value {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
  }

  .unknown,
  .verdict {
    color: var(--text-muted);
  }

  .detail {
    max-width: 68ch;
    font-size: var(--text-sm);
    color: var(--text-muted);
  }

  .verdict {
    max-width: 62ch;
  }

  .more {
    justify-self: start;
    font-size: var(--text-sm);
    font-weight: 600;
    text-decoration: none;

    &::after {
      content: ' →' / '';
    }

    &:hover {
      text-decoration: underline;
    }
  }
</style>
