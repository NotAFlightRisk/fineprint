import { data } from '#lib/server/data.js';

export const load = () => {
  const { categories, providers } = data();
  return { categories, providers };
};
