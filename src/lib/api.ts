import type { Category, Provider } from '#lib/data/types.ts';

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
