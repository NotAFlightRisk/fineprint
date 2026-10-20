<script lang="ts">
  import { page } from '$app/state';
  import { site } from '#lib/site.ts';

  let { status, providers = [] }: { status: number; providers?: { id: string; name: string }[] } =
    $props();

  const bug = $derived(encodeURIComponent(`[Bug]: ${status} on ${page.url.pathname}`));

  const copy = $derived(
    status === 404
      ? {
          title: 'Page not found',
          heading: 'Nothing here',
          text: "There's no page at this address. It might have moved, or the link has a typo.",
          ask: 'Suggest a VPN',
          why: 'Not on the list yet? Ask for it on GitHub.',
          href: `${site.repo}/issues/new?template=new-provider.yml`
        }
      : {
          title: 'Something broke',
          heading: 'Something broke',
          text: "That's on us. Give it a refresh, and if it keeps happening, let us know.",
          ask: 'Report it',
          why: "Say what you were doing, and we'll look into it.",
          href: `${site.repo}/issues/new?template=bug_report.yml&title=${bug}`
        }
  );
</script>

<svelte:head>
  <title>{copy.title} - {site.name}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<section class="intro">
  <h1>{copy.heading}</h1>
  <p>{copy.text}</p>
</section>

<section class="section" aria-labelledby="next">
  <div class="lead">
    <h2 id="next">Where next</h2>
  </div>
  <ul class="ways">
    <li>
      <a href="/">The comparison</a>
      <p>Every provider we cover, side by side, with a source for every claim.</p>
    </li>
    {#if providers.length}
      <li>
        <span>Provider pages</span>
        <p class="providers">
          {#each providers as { id, name } (id)}<a href="/{id}">{name}</a>{/each}
        </p>
      </li>
    {/if}
    <li>
      <a href="/methodology">How grading works</a>
      <p>Every criterion, and the rule behind each grade.</p>
    </li>
    <li>
      <a href={copy.href} target="_blank" rel="noopener external">{copy.ask}</a>
      <p>{copy.why}</p>
    </li>
  </ul>
</section>

<style>
  .intro {
    display: grid;
    gap: var(--space-4);
    padding-bottom: var(--space-7);

    & p {
      max-width: 36ch;
      font-size: var(--text-md);
      color: var(--text-muted);
    }
  }

  .ways {
    margin: 0;
    padding: 0;
    list-style: none;

    & li {
      display: grid;
      grid-template-columns: 14rem 1fr;
      gap: var(--space-1) var(--space-4);
      padding-block: var(--space-3);
      border-bottom: var(--rule-thin) solid var(--rule-faint);

      @media (max-width: 40rem) {
        grid-template-columns: 1fr;
      }
    }

    & li > :first-child {
      font-weight: 600;
    }

    & p {
      color: var(--text-muted);
    }

    & a {
      color: var(--text);
    }
  }

  .providers {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1) var(--space-4);
  }
</style>
