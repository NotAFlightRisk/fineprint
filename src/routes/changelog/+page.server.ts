import { labelsOf } from '#lib/data/changes.ts';
import { changelog, data } from '#lib/server/data.ts';

// keeps the page light, since every provider's own page has its whole history
const LIMIT = 500;

export const load = () => {
  const { categories } = data();
  const entries = changelog();
  return {
    entries: entries.slice(0, LIMIT),
    total: entries.length,
    labels: labelsOf(categories),
    topics: categories.map(({ id, label }) => ({ id, label }))
  };
};
