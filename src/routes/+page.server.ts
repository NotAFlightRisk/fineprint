import { data, stats } from '#lib/server/data.js';
import { byId, summarise } from '#lib/summary.js';

// Just what the cards need: the table fetches the full data itself, if it's opened
export const load = () => {
  const { categories, providers } = data();
  const criteria = byId(categories);
  return { summaries: providers.map((provider) => summarise(provider, criteria)), stats: stats() };
};
