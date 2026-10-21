import type { Category, Provider } from '#lib/data/types.ts';
import { buildIndex, type Index } from '#lib/search.ts';

async function json<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`${path} answered ${response.status}`);
  return response.json();
}

export async function loadData() {
  const [{ providers }, { categories }] = await Promise.all([
    json<{ providers: Provider[] }>('/api/providers.json'),
    json<{ categories: Category[] }>('/api/criteria.json')
  ]);
  return { providers, categories };
}

let index = $state.raw<Index>();
let failed = $state(false);
let loading: Promise<void> | undefined;

export const searchIndex = {
  get current() {
    return index;
  },
  get failed() {
    return failed;
  },
  load: () =>
    (loading ??= loadData().then(
      ({ providers, categories }) => void (index = buildIndex(providers, categories)),
      () => void (failed = true)
    ))
};
