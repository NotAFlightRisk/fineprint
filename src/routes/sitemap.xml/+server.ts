import { data, stats } from '#lib/server/data.js';
import { absolute } from '#lib/site.js';

export const prerender = true;

// lastmod only where there's a real date, as a build date on every page teaches crawlers to ignore it
export const GET = () => {
  const pages = [
    { path: '/', modified: stats().updated },
    { path: '/methodology' },
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
