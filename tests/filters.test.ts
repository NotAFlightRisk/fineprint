import { describe, expect, it } from 'vitest';
import { unify } from '#lib/data/build.ts';
import { loadCriteria, readProvider } from '#lib/data/load.ts';
import { applyFilters, type Filters } from '#lib/filters.ts';
import { byId, summarise } from '#lib/summary.ts';

const categories = loadCriteria();
const criteria = byId(categories);
const { raw } = readProvider('tests/fixtures/good.yml');
const provider = unify(categories, 'good', raw as never, new Date('2026-10-18'));
const summary = (name: string, flags: string[] = []) =>
  summarise({ ...provider, id: name, name, flags }, criteria);

const none: Filters = { q: '', must: [], sort: 'flags' };
const names = (list: ReturnType<typeof summary>[], filters: Partial<Filters> = {}) =>
  applyFilters(list, { ...none, ...filters }).map(({ name }) => name);

describe('homepage filters', () => {
  it('puts fewest red flags first, then fewest serious ones', () => {
    const list = [
      summary('Two, one serious', ['jurisdiction.eyes', 'account.email']),
      summary('Two, minor', ['account.email', 'account.payment']),
      summary('One, serious', ['jurisdiction.eyes']),
      summary('None')
    ];
    expect(names(list)).toEqual(['None', 'One, serious', 'Two, minor', 'Two, one serious']);
  });

  it('keeps providers with no price at the end when cheapest first', () => {
    const priced = summary('Priced');
    const list = [{ ...priced, name: 'Unpriced', usd: undefined }, priced];
    expect(names(list, { sort: 'price' })).toEqual(['Priced', 'Unpriced']);
  });

  it('finds by name and keeps only providers with every must-have', () => {
    const list = [summary('Alpha VPN'), summary('Beta VPN')];
    expect(names(list, { q: ' beta ' })).toEqual(['Beta VPN']);
    const passed = list[0].checks.find((check) => check.grade === 'good')!.id;
    const failed = list[0].checks.find((check) => check.grade !== 'good')!.id;
    expect(names(list, { must: [passed] })).toEqual(['Alpha VPN', 'Beta VPN']);
    expect(names(list, { must: [passed, failed] })).toEqual([]);
  });
});
