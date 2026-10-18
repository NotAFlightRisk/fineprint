import { data, flags } from '#lib/server/data.js';

export const load = () => {
  const { categories, providers } = data();
  return { categories, providers, flags: flags() };
};
