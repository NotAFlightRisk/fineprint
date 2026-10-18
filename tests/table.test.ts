import { describe, expect, it } from 'vitest';
import { loadCriteria } from '../src/lib/data/load.ts';
import type { Entry } from '../src/lib/data/types.ts';
import { compare, toCsv } from '../src/lib/table.ts';

const criteria = new Map(loadCriteria().flatMap((c) => c.criteria.map((x) => [x.id, x])));
const entry = (value: Entry['value'], grade: Entry['grade']): Entry => ({
  value,
  grade,
  sources: []
});

describe('table sorting', () => {
  const best = criteria.get('pricing.best')!;
  const cheap = entry({ amount: 3, currency: 'USD' }, 'info');
  const dear = entry({ amount: 5, currency: 'EUR' }, 'info');

  it('keeps unknowns at the bottom whichever way it sorts', () => {
    for (const direction of [1, -1] as const) {
      expect(compare(best, undefined, cheap, direction)).toBeGreaterThan(0);
      expect(compare(best, entry(null, null), cheap, direction)).toBeGreaterThan(0);
    }
  });

  it('compares prices across currencies', () => {
    expect(compare(best, cheap, dear, 1)).toBeLessThan(0);
    expect(compare(best, cheap, dear, -1)).toBeGreaterThan(0);
  });

  it('puts better grades first', () => {
    const dns = criteria.get('logging.dns')!;
    expect(compare(dns, entry('none', 'good'), entry('yes', 'bad'), 1)).toBeLessThan(0);
  });
});

describe('csv export', () => {
  it('quotes cells with commas and quotes in them', () => {
    const provider = {
      id: 'x',
      name: 'Odd, "Name"',
      icon: 'x.svg',
      checked: '2026-10-18',
      stale: false,
      refs: {},
      flags: [],
      criteria: { 'account.payment': entry(['card', 'cash'], 'good') }
    };
    expect(toCsv([provider], [criteria.get('account.payment')!])).toBe(
      'Provider,Payment methods\n"Odd, ""Name""","Card, Cash by post"'
    );
  });
});
