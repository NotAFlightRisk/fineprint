import type { Summary } from '#lib/summary.ts';

export const sorts = { flags: 'Fewest red flags', price: 'Cheapest', name: 'A to Z' };
export type Sort = keyof typeof sorts;

export interface Filters {
  q: string;
  must: string[];
  sort: Sort;
}

export const sortBy: Record<Sort, (a: Summary, b: Summary) => number> = {
  flags: (a, b) => a.flags.length - b.flags.length || a.serious - b.serious,
  price: (a, b) => (a.usd ?? Infinity) - (b.usd ?? Infinity) || 0,
  name: (a, b) => a.name.localeCompare(b.name)
};

export const passes = (summary: Summary, must: string[]) =>
  must.every((id) => summary.checks.some((check) => check.id === id && check.grade === 'good'));

export function applyFilters(summaries: Summary[], { q, must, sort }: Filters) {
  const words = q.trim().toLowerCase();
  return summaries
    .filter((summary) => summary.name.toLowerCase().includes(words) && passes(summary, must))
    .toSorted((a, b) => sortBy[sort](a, b) || sortBy.name(a, b));
}
