import { data, stats } from '#lib/server/data.ts';
import { absolute } from '#lib/site.ts';

export const prerender = true;

// lastmod only where there's a real date to give
export const GET = () => {
  const pages = [
    { path: '/', modified: stats().updated },
    { path: '/methodology' },
    { path: '/contributing' },
    ...data().providers.map(({ id, checked }) => ({ path: `/${id}`, modified: checked }))
  ];
  const urls = pages
    .map(
      ({ path, modified }) =>
        `<url><loc>${absolute(path)}</loc>${modified ? `<lastmod>${modified}</lastmod>` : ''}</url>`
    )
    .join('');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    { headers: { 'Content-Type': 'application/xml' } }
  );
};
