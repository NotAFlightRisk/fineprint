import { data } from '#lib/server/data.js';
import { site } from '#lib/site.js';

export const GET = () => {
  const { built, providers } = data();
  const pages = [
    { path: '', modified: built },
    { path: '/methodology', modified: built },
    ...providers.map(({ id, checked }) => ({ path: `/${id}`, modified: checked }))
  ];
  const urls = pages
    .map(
      ({ path, modified }) =>
        `<url><loc>${site.url}${path}</loc><lastmod>${modified}</lastmod></url>`
    )
    .join('');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    { headers: { 'Content-Type': 'application/xml' } }
  );
};
