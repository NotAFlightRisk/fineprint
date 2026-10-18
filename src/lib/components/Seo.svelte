<script lang="ts">
  import { site } from '#lib/site.js';

  let {
    title,
    description,
    path,
    schema
  }: { title: string; description: string; path: string; schema?: object } = $props();

  const url = $derived(new URL(path, site.url).href);
  const json = $derived(schema && JSON.stringify(schema).replaceAll('<', '\\u003c'));
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={url} />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content={site.name} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={url} />
  <meta property="og:image" content="{site.url}/og.png" />
  <meta name="twitter:card" content="summary_large_image" />
  {#if json}
    {@html `<script type="application/ld+json">${json}</script>`}
  {/if}
</svelte:head>
