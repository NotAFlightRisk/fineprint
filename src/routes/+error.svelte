<script lang="ts">
  import { page } from '$app/state';
  import { site } from '#lib/site.js';
</script>

<svelte:head>
  <title>{page.status === 404 ? 'Page not found' : 'Something broke'} - {site.name}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<section class="error">
  <h1>{page.status === 404 ? 'Nothing here' : 'Something broke'}</h1>
  <p>
    {page.status === 404
      ? "That page doesn't exist, or the provider's been renamed."
      : "That's on us. Give it a refresh, and if it keeps happening, let us know on GitHub."}
  </p>
  <a href="/">Back to the comparison</a>
</section>

<style>
  .error {
    display: grid;
    gap: var(--space-4);
    max-width: 40rem;
    padding-block: var(--space-6) var(--space-8);

    & h1 {
      font-size: var(--text-display);
      letter-spacing: -0.04em;
    }

    & p {
      color: var(--text-muted);
    }

    & a {
      font-weight: 600;
    }
  }
</style>
