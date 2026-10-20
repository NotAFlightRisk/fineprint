import { describe, expect, it } from 'vitest';
import { unify } from '#lib/data/build.ts';
import { loadCriteria, readProvider } from '#lib/data/load.ts';
import { absolute, ogPage } from '#lib/site.ts';
import { byId, checks, redFlags, summarise, verdict } from '#lib/summary.ts';

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
    const flagged = { ...provider, flags: ['jurisdiction.eyes'] };
    expect(verdict(summarise(flagged, criteria))).toMatch(/with 1 red flag\.$/);
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
