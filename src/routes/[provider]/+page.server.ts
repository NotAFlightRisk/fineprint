import { error } from '@sveltejs/kit';
import { data } from '#lib/server/data.ts';

export const entries = () => data().providers.map(({ id }) => ({ provider: id }));

export const load = ({ params }) => {
  const { categories, providers } = data();
  const provider = providers.find(({ id }) => id === params.provider);
  if (!provider) error(404, 'No provider by that name');
  return { categories, provider };
};
