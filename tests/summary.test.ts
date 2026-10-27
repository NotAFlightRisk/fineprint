import { describe, expect, it } from 'vitest';
import { unify } from '#lib/data/build.ts';
import { loadCriteria, readProvider } from '#lib/data/load.ts';
import { absolute, ogPage } from '#lib/site.ts';
import type { Entry, Grade, Value } from '#lib/data/types.ts';
import { byId, checks, completeness, redFlags, summarise, verdict } from '#lib/summary.ts';

const categories = loadCriteria();
const criteria = byId(categories);
const { raw } = readProvider('tests/fixtures/good.yml');
const provider = unify(categories, 'good', raw as never, new Date('2026-10-18'));

describe('criteria named in the code', () => {
  it('all still exist in criteria.yml', () => {
    const named = [
      ...checks.flatMap((check) => check.from),
      'features.connections',
      'identity.founded',
      'identity.legal_entity',
      'identity.website',
      'jurisdiction.eyes',
      'jurisdiction.hq',
      'pricing.best',
      'pricing.per_connection'
    ];
    expect(named.filter((id) => !criteria.has(id))).toEqual([]);
  });
});

describe('provider summary', () => {
  it('sums a provider up in a sentence that stands on its own', () => {
    expect(verdict(summarise(provider, criteria))).toBe(
      'Good VPN (Switzerland, Outside 14 Eyes) passes 1 of 6 privacy checks, with no red flags.'
    );
  });

  it('counts red flags in words', () => {
    expect([0, 1, 2].map(redFlags)).toEqual(['No red flags', '1 red flag', '2 red flags']);
    const said = (...flags: string[]) => verdict(summarise({ ...provider, flags }, criteria));
    expect(said('jurisdiction.eyes')).toMatch(/with 1 serious red flag\.$/);
    expect(said('account.email')).toMatch(/with 1 minor red flag\.$/);
    expect(said('jurisdiction.eyes', 'account.email', 'account.payment')).toMatch(
      /with 1 serious and 2 minor red flags\.$/
    );
  });

  it('counts the serious red flags', () => {
    const flagged = { ...provider, flags: ['jurisdiction.eyes', 'account.email'] };
    expect(summarise(flagged, criteria).serious).toBe(1);
  });

  it('counts each other red flag on its own, at its own severity', () => {
    const value = [
      { summary: 'Sells your IP', severity: 'minor', source: 'policy' },
      { summary: 'Reads your mail', severity: 'serious', source: 'policy' }
    ];
    const summary = summarise(
      {
        ...provider,
        flags: ['account.email', 'other.concerns'],
        criteria: { ...provider.criteria, 'other.concerns': { value, grade: 'bad', sources: [] } }
      },
      criteria
    );
    expect(summary.flags).toEqual([
      'Other red flags: Reads your mail',
      'Email: Not checked',
      'Other red flags: Sells your IP'
    ]);
    expect(summary.serious).toBe(1);
  });

  it('reads no other red flags as none, without counting it as research done', () => {
    expect(provider.criteria['other.concerns']).toMatchObject({ value: [], grade: 'good' });
    expect(provider.flags).toEqual([]);
    const { 'other.concerns': _, ...rest } = provider.criteria;
    expect(completeness({ ...provider, criteria: rest }, criteria)).toBe(
      completeness(provider, criteria)
    );
  });
});

describe('completeness', () => {
  const asked = [...criteria.values()].filter((criterion) => !criterion.derived);
  const known = (entries: Record<string, Entry>) =>
    completeness({ ...provider, criteria: entries }, criteria);
  const every = (value: Value, grade: Grade) =>
    Object.fromEntries(asked.map(({ id }) => [id, { value, grade, sources: [] }]));

  it("counts Doesn't apply as known, but not Unknown or Not checked", () => {
    expect(known(every(true, 'good'))).toBe(100);
    expect(known(every(null, 'na'))).toBe(100);
    expect(known(every(null, null))).toBe(0);
    expect(known({})).toBe(0);
  });
});

describe('addresses', () => {
  it('gives pages no trailing slash, and the home page just the one', () => {
    expect(absolute('/')).toBe('https://fineprint.peng.ly/');
    expect(absolute('/mullvad')).toBe('https://fineprint.peng.ly/mullvad');
  });

  it('names each social image after its page', () => {
    expect(ogPage('/')).toBe('index');
    expect(ogPage('/mullvad')).toBe('mullvad');
  });
});
