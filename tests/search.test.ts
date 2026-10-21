import { describe, expect, it } from 'vitest';
import { dataset } from '#lib/data/build.ts';
import {
  buildIndex,
  filter,
  highlight,
  order,
  parse,
  readFilters,
  score,
  suggestions,
  writeFilters
} from '#lib/search.ts';

const { providers, categories } = dataset(new Date('2026-10-18'));
const index = buildIndex(providers, categories);
const search = (q: string, must: string[] = []) =>
  order(filter(score(index, q), must), 'relevance', index.lookup);

describe('search', () => {
  it('finds providers through typos and nicknames', () => {
    expect(search('mulvad')[0].provider.name).toBe('Mullvad VPN');
    expect(search('expresvpn')[0].provider.name).toBe('ExpressVPN');
    expect(search('pia')[0].provider.name).toBe('Private Internet Access');
  });

  it("shows a provider's summary when it's what was searched for", () => {
    expect(search('mullvad')[0].matches).toEqual([]);
  });

  it('leaves out words that match nothing, rather than finding nothing', () => {
    expect(score(index, 'monero xyzzy').live).toEqual([true, false]);
    const ids = (q: string) => search(q).map(({ provider }) => provider.id);
    expect(ids('monero xyzzy')).toEqual(ids('monero'));
  });

  it('only keeps providers that pass every must-have', () => {
    const kept = search('wireguard', ['audited', 'open']);
    expect(kept.length).toBeGreaterThan(0);
    for (const { summary } of kept) {
      const passed = summary.checks.filter((check) => check.grade === 'good');
      expect(passed.map(({ id }) => id)).toEqual(expect.arrayContaining(['audited', 'open']));
    }
  });

  it('finds something for every suggestion', () => {
    for (const suggestion of suggestions) expect(search(suggestion).length).toBeGreaterThan(0);
  });

  it('marks the word being typed, and whole phrases as one', () => {
    expect(highlight('Port forwarding', parse('port forw').terms)).toEqual([
      { text: 'Port forw', hit: true },
      { text: 'arding', hit: false }
    ]);
  });

  it('keeps only known filters in the address', () => {
    const params = new URLSearchParams('q=+kill+switch&sort=nope&must=open&must=junk');
    expect(writeFilters(readFilters(params))).toBe('?q=kill+switch&must=open');
  });
});
