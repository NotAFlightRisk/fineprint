<script lang="ts">
  import { absolute, ogPage, ogSize, schemaIds, site } from '#lib/site.js';

  let {
    title,
    description,
    path,
    crumb,
    modified,
    about,
    schema = []
  }: {
    /** what the page is, without the site name */
    title: string;
    description: string;
    path: string;
    /** short name for the breadcrumb, on every page but the home page */
    crumb?: string;
    modified?: string;
    /** the thing the page is about, as a schema.org node with an @id */
    about?: { '@id': string };
    schema?: object[];
  } = $props();

  const home = absolute('/');
  const url = $derived(absolute(path));
  const image = $derived(absolute(`/og/${ogPage(path)}.png`));

  const graph = $derived([
    {
      '@type': 'WebSite',
      '@id': schemaIds.website,
      url: home,
      name: site.name,
      description: site.description,
      inLanguage: 'en-GB',
      publisher: { '@id': schemaIds.publisher }
    },
    {
      '@type': 'Organization',
      '@id': schemaIds.publisher,
      name: site.name,
      url: home,
      logo: absolute('/logo.png'),
      sameAs: [site.repo]
    },
    {
      '@type': 'WebPage',
      '@id': url,
      url,
      name: title,
      description,
      inLanguage: 'en-GB',
      isPartOf: { '@id': schemaIds.website },
      primaryImageOfPage: { '@type': 'ImageObject', url: image, ...ogSize },
      dateModified: modified,
      about: about && { '@id': about['@id'] }
    },
    crumb && {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: site.name, item: home },
        { '@type': 'ListItem', position: 2, name: crumb, item: url }
      ]
    },
    about,
    ...schema
  ]);

  const json = $derived(
    JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': graph.filter(Boolean)
    }).replaceAll('<', '\\u003c')
  );
</script>

<svelte:head>
  <title>{title} - {site.name}</title>
  <meta name="description" content={description} />
  <meta name="robots" content="max-image-preview:large" />
  <link rel="canonical" href={url} />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content={site.name} />
  <meta property="og:locale" content="en_GB" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={url} />
  <meta property="og:image" content={image} />
  <meta property="og:image:width" content={String(ogSize.width)} />
  <meta property="og:image:height" content={String(ogSize.height)} />
  <meta property="og:image:alt" content={description} />
  <meta name="twitter:card" content="summary_large_image" />
  {@html `<script type="application/ld+json">${json}</script>`}
</svelte:head>
