import { resolve } from 'node:path';
import { dataset } from '#lib/data/build.ts';
import type { Dataset } from '#lib/data/types.ts';

let cached: Dataset | undefined;
export const data = () => (cached ??= dataset());

export const flagFile = (code: string) =>
  resolve(`node_modules/flag-icons/flags/4x3/${code.toLowerCase()}.svg`);

export function stats() {
  const { categories, providers } = data();
  return {
    providers: providers.length,
    criteria: categories.reduce((total, category) => total + category.criteria.length, 0),
    sources: providers.reduce((total, provider) => total + Object.keys(provider.refs).length, 0),
    updated: providers.reduce((latest, { checked }) => (checked > latest ? checked : latest), '')
  };
}
