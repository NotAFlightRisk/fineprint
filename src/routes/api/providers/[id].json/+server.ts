import { error, json } from '@sveltejs/kit';
import { data } from '#lib/server/data.ts';

export const prerender = true;

export const entries = () => data().providers.map(({ id }) => ({ id }));

export const GET = ({ params }) => {
  const provider = data().providers.find(({ id }) => id === params.id);
  if (!provider) error(404, 'No provider with that id');
  return json(provider);
};
