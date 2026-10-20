<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { loadPlausible } from '#lib/plausible.ts';
  import { site } from '#lib/site.ts';
  import '../app.css';

  let { children } = $props();

  const nav = [
    { href: '/', label: 'Compare' },
    { href: '/methodology', label: 'Methodology' },
    { href: `${site.repo}/blob/main/.github/CONTRIBUTING.md`, label: 'Contribute' }
  ];

  onMount(() => loadPlausible());
</script>

<a class="skip" href="#main">Skip to content</a>

<header class="masthead">
  <a class="wordmark" href="/">fine<span>print</span></a>
  <nav aria-label="Main">
    {#each nav as { href, label } (href)}
      <a {href} aria-current={page.url.pathname === href ? 'page' : undefined}>{label}</a>
    {/each}
  </nav>
</header>

<main id="main">
  {@render children()}
</main>

<footer class="colophon">
  <p>
    No sponsors, no affiliate links, no rankings for sale. Every value comes from a source you can
    check, and anyone can correct it.
  </p>
  <ul>
    <li><a href="/methodology">How grading works</a></li>
    <li><a href="/api/providers.json">Data as JSON</a></li>
    <li><a href={site.repo}>Source on GitHub</a></li>
  </ul>
</footer>

<style>
  .skip {
    position: absolute;
    left: var(--pad);
    top: -10rem;
    padding: var(--space-2) var(--space-3);
    background: var(--text);
    color: var(--surface);

    &:focus {
      top: var(--space-2);
    }
  }

  .masthead,
  main,
  .colophon {
    max-width: var(--page);
    margin-inline: auto;
    padding-inline: var(--pad);
  }

  .masthead {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-2) var(--space-5);
    padding-block: var(--space-4);
    border-top: var(--rule-heavy) solid var(--rule);
    border-bottom: var(--rule-thin) solid var(--rule);
  }

  .wordmark {
    font-size: var(--text-md);
    font-weight: 700;
    letter-spacing: -0.04em;
    text-decoration: none;

    & span {
      font-weight: 400;
    }
  }

  nav {
    display: flex;
    gap: var(--space-5);
    font-size: var(--text-sm);

    & a {
      text-decoration: none;

      &:hover,
      &[aria-current='page'] {
        text-decoration: underline;
      }
    }
  }

  main {
    padding-block: var(--space-6) var(--space-8);
  }

  .colophon {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
    gap: var(--space-5);
    padding-block: var(--space-5) var(--space-7);
    border-top: var(--rule-heavy) solid var(--rule);
    font-size: var(--text-sm);
    color: var(--text-muted);

    & p {
      max-width: 44ch;
    }

    & ul {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2) var(--space-5);
      margin: 0;
      padding: 0;
      list-style: none;
      justify-self: end;
    }
  }
</style>
