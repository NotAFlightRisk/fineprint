import { error } from '@sveltejs/kit';
import { data } from '#lib/server/data.ts';
import { drawPage } from '#lib/server/og.ts';

export const prerender = true;

// one per page, named as ogPage() in site.ts names them
export const entries = () => [
  { page: 'index' },
  { page: 'methodology' },
  { page: 'contributing' },
  { page: 'search' },
  ...data().providers.map(({ id }) => ({ page: id }))
];

export const GET = async ({ params }) => {
  const image = await drawPage(params.page);
  if (!image) error(404, 'No image for that page');
  return new Response(image, { headers: { 'Content-Type': 'image/png' } });
};
