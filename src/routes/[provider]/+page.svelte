<script lang="ts">
  import Flag from '#lib/components/Flag.svelte';
  import GradeMark from '#lib/components/GradeMark.svelte';
  import Records from '#lib/components/Records.svelte';
  import Seo from '#lib/components/Seo.svelte';
  import type { Item } from '#lib/data/types.js';
  import { formatDate, formatValue, showEntry } from '#lib/format.js';
  import { editUrl, historyUrl, site } from '#lib/site.js';
  import { byId, checklist, located } from '#lib/summary.js';
  import { tip } from '#lib/tip.js';

  let { data } = $props();
  const { provider, categories, flags } = $derived(data);

  const criteria = $derived(byId(categories));
  const website = $derived(provider.criteria['identity.website'].value as string);
  const checks = $derived(checklist(provider, criteria));
  const where = $derived(located(provider, criteria));

  const cited = $derived.by(() => {
    const order = new Map<string, number>();
    for (const category of categories)
      for (const { id } of category.criteria)
        for (const ref of provider.criteria[id]?.sources ?? [])
          if (!order.has(ref)) order.set(ref, order.size + 1);
    for (const ref of Object.keys(provider.refs))
      if (!order.has(ref)) order.set(ref, order.size + 1);
    return order;
  });

  const backs = (ref: string) =>
    Object.entries(provider.criteria)
      .filter(([, entry]) => entry.sources.includes(ref))
      .map(([id]) => criteria.get(id)!.label);

  const passes = $derived(checks.filter((check) => check.grade === 'good').map((c) => c.label));
  const description = $derived(
    `${provider.name}, based in ${where}. ${passes.length ? `${passes.join(', ')}. ` : ''}${provider.flags.length} red flag${provider.flags.length === 1 ? '' : 's'}. Logging, audits, payment, apps and pricing, every claim sourced.`
  );

  const schema = $derived({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: provider.name,
        legalName: provider.criteria['identity.legal_entity']?.value ?? undefined,
        url: website,
        logo: `${site.url}/icons/${provider.icon}`,
        foundingDate: provider.criteria['identity.founded']?.value?.toString(),
        address: {
          '@type': 'PostalAddress',
          addressCountry: provider.criteria['jurisdiction.hq'].value
        }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: site.name, item: site.url },
          {
            '@type': 'ListItem',
            position: 2,
            name: provider.name,
            item: `${site.url}/${provider.id}`
          }
        ]
      }
    ]
  });
</script>

<Seo
  title="{provider.name} VPN fine print - {site.name}"
  {description}
  path="/{provider.id}"
  {schema}
/>

<article>
  <header class="head">
    <div class="name">
      <h1><img src="/icons/{provider.icon}" alt="" width="64" height="64" />{provider.name}</h1>
      <p>
        <a href={website} target="_blank" rel="noopener external"
          >{formatValue(criteria.get('identity.website')!, website)}</a
        >
        <span aria-hidden="true">·</span>
        <Flag src={flags[provider.criteria['jurisdiction.hq'].value as string]} />{where}
      </p>
    </div>
    <p class="checked" class:stale={provider.stale}>
      Checked <time datetime={provider.checked}>{formatDate(provider.checked)}</time>
      {#if provider.stale}<span>, so some of this may be out of date</span>{/if}
    </p>
  </header>

  <nav class="strip" aria-label="Categories">
    {#each categories as category (category.id)}
      <a href="#{category.id}">
        <span>{category.label}</span>
        <span class="marks" aria-hidden="true">
          {#each category.criteria as { id } (id)}
            <i data-grade={provider.criteria[id]?.grade ?? 'unknown'}></i>
          {/each}
        </span>
      </a>
    {/each}
  </nav>

  <section class="summary" aria-labelledby="summary">
    <h2 id="summary">Summary</h2>
    <div class="facts">
      <ul class="checks">
        {#each checks as check (check.id)}
          <li>
            <GradeMark grade={check.grade} />
            <button type="button" class="plain noted" {@attach tip(check.tip)}>{check.label}</button
            >
          </li>
        {/each}
      </ul>
      <div class="flags">
        <h3>{provider.flags.length || 'No'} red flag{provider.flags.length === 1 ? '' : 's'}</h3>
        {#if provider.flags.length}
          <ul>
            {#each provider.flags as id (id)}
              {@const criterion = criteria.get(id)!}
              <li>
                <GradeMark grade="bad" />
                <span
                  ><a href="#{id}">{criterion.label}</a>: {formatValue(
                    criterion,
                    provider.criteria[id].value
                  )}</span
                >
              </li>
            {/each}
          </ul>
        {:else}
          <p>Nothing graded red. Have a read below anyway, the details matter.</p>
        {/if}
      </div>
    </div>
  </section>

  {#each categories as category (category.id)}
    <section class="category" id={category.id} aria-labelledby="{category.id}-title">
      <div class="lead">
        <h2 id="{category.id}-title">{category.label}</h2>
        <p>{category.description}</p>
      </div>
      <dl>
        {#each category.criteria as criterion (criterion.id)}
          {@const entry = provider.criteria[criterion.id]}
          <div class="row" id={criterion.id}>
            <dt>
              <button type="button" class="plain" {@attach tip(criterion.description)}
                >{criterion.label}</button
              >
            </dt>
            <dd>
              <p class="value">
                {#if entry?.grade !== 'info'}<GradeMark grade={entry?.grade} />{/if}
                {#if criterion.type === 'country' && typeof entry?.value === 'string'}
                  <Flag src={flags[entry.value]} />
                {/if}
                <span class:unknown={!entry || entry.value === null}
                  >{showEntry(criterion, entry)}</span
                >
                {#if entry?.evidence}<span class="evidence">{entry.evidence}</span>{/if}
                {#each entry?.sources ?? [] as ref (ref)}
                  <a class="cite" href="#ref-{ref}" {@attach tip(provider.refs[ref].title)}
                    ><span class="visually-hidden">Source </span>{cited.get(ref)}</a
                  >
                {/each}
              </p>
              {#if entry?.note}<p class="note">{entry.note}</p>{/if}
              {#if criterion.type === 'records' && Array.isArray(entry?.value) && entry.value.length}
                <Records {criterion} items={entry.value as Item[]} refs={provider.refs} {cited} />
              {/if}
            </dd>
          </div>
        {/each}
      </dl>
    </section>
  {/each}

  <section class="category" aria-labelledby="sources">
    <div class="lead">
      <h2 id="sources">Sources</h2>
      <p>Everything above, and where it came from.</p>
    </div>
    <ol class="refs">
      {#each cited as [ref, number] (ref)}
        <li id="ref-{ref}">
          <span class="number">{number}</span>
          <div>
            <a href={provider.refs[ref].url} target="_blank" rel="noopener external"
              >{provider.refs[ref].title}</a
            >
            <p>{provider.refs[ref].url.replace(/^https:\/\//, '')}</p>
            {#if backs(ref).length}<p>Backs {backs(ref).join(', ')}</p>{/if}
          </div>
        </li>
      {/each}
    </ol>
  </section>

  <section class="category contribute" aria-labelledby="contribute">
    <div class="lead">
      <h2 id="contribute">Spotted something?</h2>
      <p>
        This page is built from one YAML file. Fix it on GitHub and the checks will tell you if
        anything's off.
      </p>
    </div>
    <p class="actions">
      <a href={editUrl(provider.id)} target="_blank" rel="noopener">Suggest an edit</a>
      <a href={historyUrl(provider.id)} target="_blank" rel="noopener">History</a>
      <a
        href="{site.repo}/issues/new?template=correction.yml&title={encodeURIComponent(
          `${provider.name}: `
        )}"
        target="_blank"
        rel="noopener">Report a mistake</a
      >
    </p>
  </section>
</article>

<style>
  .head {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: end;
    gap: var(--space-4) var(--space-5);
    padding-bottom: var(--space-5);

    & h1 {
      display: flex;
      align-items: center;
      gap: 0.2em;
      font-size: var(--text-display);
      letter-spacing: -0.04em;
      line-height: 0.95;
    }

    & img {
      width: 0.85em;
      height: 0.85em;
    }

    & .name p {
      margin-top: var(--space-3);
      color: var(--text-muted);
    }

    @media (max-width: 40rem) {
      grid-template-columns: 1fr;
    }
  }

  .checked {
    font-size: var(--text-sm);
    color: var(--text-muted);

    &.stale {
      color: var(--ok);
      font-weight: 600;
    }
  }

  .strip {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(6.5rem, 1fr));
    border-top: var(--rule-heavy) solid var(--rule);
    border-bottom: var(--rule-thin) solid var(--rule);
    background: var(--surface);

    @media (min-width: 56rem) {
      position: sticky;
      top: 0;
      z-index: 2;
    }

    & a {
      display: grid;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-3) var(--space-3) 0;
      font-size: var(--text-sm);
      font-weight: 600;
      text-decoration: none;

      &:hover span:first-child {
        text-decoration: underline;
      }
    }
  }

  .marks {
    display: flex;
    gap: 2px;

    & i {
      width: 0.5rem;
      height: 0.5rem;
      background: var(--grade, transparent);
      box-shadow: inset 0 0 0 var(--rule-thin) var(--grade, var(--rule-faint));

      &[data-grade='good'] {
        --grade: var(--good);
      }
      &[data-grade='ok'] {
        --grade: var(--ok);
      }
      &[data-grade='bad'] {
        --grade: var(--bad);
      }
      &[data-grade='info'] {
        --grade: var(--info);
      }
      &[data-grade='na'] {
        --grade: var(--na);
      }
    }
  }

  .summary {
    display: grid;
    grid-template-columns: 3fr 9fr;
    gap: var(--space-5);
    padding-block: var(--space-6);

    & h2 {
      font-size: var(--text-xl);
    }

    @media (max-width: 56rem) {
      grid-template-columns: 1fr;
    }
  }

  .facts {
    display: grid;
    grid-template-columns: minmax(9rem, 2fr) 5fr;
    gap: var(--space-5) var(--space-4);

    @media (max-width: 40rem) {
      grid-template-columns: 1fr;
    }
  }

  .checks,
  .flags ul {
    display: grid;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;

    & li {
      display: flex;
      align-items: baseline;
      gap: var(--space-2);
    }
  }

  .flags {
    display: grid;
    align-content: start;
    gap: var(--space-3);

    & h3 {
      font-size: var(--text-md);
      color: var(--bad);
    }

    & p {
      color: var(--text-muted);
    }
  }

  .category {
    display: grid;
    grid-template-columns: 3fr 9fr;
    gap: var(--space-4) var(--space-5);
    padding-block: var(--space-4) var(--space-6);
    border-top: var(--rule-heavy) solid var(--rule);
    scroll-margin-top: var(--space-4);

    @media (min-width: 56rem) {
      scroll-margin-top: var(--space-8);
    }

    @media (max-width: 56rem) {
      grid-template-columns: 1fr;
    }
  }

  .lead {
    display: grid;
    align-content: start;
    gap: var(--space-2);

    & h2 {
      font-size: var(--text-lg);
    }

    & p {
      max-width: 30ch;
      color: var(--text-muted);
      font-size: var(--text-sm);
    }
  }

  dl {
    margin: 0;
  }

  .row {
    display: grid;
    grid-template-columns: minmax(9rem, 2fr) 5fr;
    gap: var(--space-1) var(--space-4);
    padding-block: var(--space-3);
    border-bottom: var(--rule-thin) solid var(--rule-faint);
    scroll-margin-top: var(--space-6);

    @media (min-width: 56rem) {
      scroll-margin-top: calc(var(--space-8) + var(--space-4));
    }

    &:target {
      background: var(--surface-sunken);
    }

    @media (max-width: 40rem) {
      grid-template-columns: 1fr;
    }
  }

  dt {
    font-weight: 600;
  }

  dd {
    display: grid;
    gap: var(--space-2);
    margin: 0;
  }

  .value {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-1) var(--space-2);
  }

  .unknown {
    color: var(--text-muted);
  }

  .evidence {
    padding: 0 var(--space-2);
    border: var(--rule-thin) solid var(--rule-faint);
    font-size: var(--text-xs);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
  }

  .cite {
    font-size: var(--text-xs);
    min-width: 1.25rem;
    padding-inline: var(--space-1);
    text-align: center;
    text-decoration: none;
    border: var(--rule-thin) solid var(--rule-faint);

    &:hover {
      border-color: var(--rule);
    }
  }

  .note {
    max-width: 68ch;
    font-size: var(--text-sm);
    color: var(--text-muted);
  }

  .refs {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(24rem, 100%), 1fr));
    gap: var(--space-4) var(--space-5);
    margin: 0;
    padding: 0;
    list-style: none;

    & li {
      display: grid;
      grid-template-columns: 2rem 1fr;
      gap: var(--space-3);
      scroll-margin-top: var(--space-6);

      &:target {
        background: var(--surface-sunken);
      }
    }

    & .number {
      font-weight: 600;
    }

    & a {
      font-weight: 600;
    }

    & p {
      font-size: var(--text-sm);
      color: var(--text-muted);
      overflow-wrap: anywhere;
    }
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    align-content: start;
    gap: var(--space-3);

    & a {
      padding: var(--space-2) var(--space-4);
      border: var(--rule-thin) solid var(--rule);
      font-weight: 600;
      text-decoration: none;

      &:first-child {
        background: var(--text);
        color: var(--surface);
      }

      &:hover {
        text-decoration: underline;
      }
    }
  }
</style>
