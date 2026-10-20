import { describe, expect, it } from 'vitest';
import { unify } from '#lib/data/build.ts';
import { grade } from '#lib/data/grade.ts';
import { loadCriteria, readProvider } from '#lib/data/load.ts';

const categories = loadCriteria();
const criteria = new Map(categories.flatMap((c) => c.criteria.map((x) => [x.id, x])));
const today = new Date('2026-10-18');
const gradeOf = (id: string, value: unknown) => grade(criteria.get(id)!, value as never, today);

describe('grading rules', () => {
  it('grades an enum by its options', () => {
    expect(gradeOf('logging.dns', 'none')).toBe('good');
    expect(gradeOf('logging.dns', 'aggregate')).toBe('ok');
    expect(gradeOf('logging.dns', 'yes')).toBe('bad');
  });

  it('leaves unknowns blank and ungraded criteria as info', () => {
    expect(gradeOf('logging.dns', null)).toBeNull();
    expect(gradeOf('infra.servers', 900)).toBe('info');
  });

  it('only counts a recent audit of the right scope as good', () => {
    const audit = (date: string, scope: string) => [{ date, auditor: 'Cure53', scope }];
    expect(gradeOf('transparency.audits', audit('2025-06-01', 'no_logs'))).toBe('good');
    expect(gradeOf('transparency.audits', audit('2025-06-01', 'apps'))).toBe('ok');
    expect(gradeOf('transparency.audits', audit('2023-06-01', 'no_logs'))).toBe('ok');
    expect(gradeOf('transparency.audits', [])).toBe('bad');
  });

  it('marks incidents bad only when one was handled poorly', () => {
    const incident = (handled: string) => ({ date: '2024-01-01', summary: 'Leak', handled });
    expect(gradeOf('transparency.incidents', [])).toBe('good');
    expect(gradeOf('transparency.incidents', [incident('well')])).toBe('good');
    expect(gradeOf('transparency.incidents', [incident('well'), incident('poorly')])).toBe('bad');
  });

  it('treats unlimited as more than any number', () => {
    expect(gradeOf('features.connections', 'unlimited')).toBe('good');
    expect(gradeOf('features.connections', 3)).toBe('ok');
    expect(gradeOf('features.connections', 1)).toBe('bad');
  });

  it('grades payment on whether any anonymous method is offered', () => {
    expect(gradeOf('account.payment', ['card', 'cash'])).toBe('good');
    expect(gradeOf('account.payment', ['card', 'bitcoin'])).toBe('ok');
    expect(gradeOf('account.payment', ['card', 'paypal'])).toBe('bad');
  });

  it('gives every option of every graded enum and bool a grade', () => {
    const ungraded = [...criteria.values()]
      .filter((c) => c.rules && (c.type === 'enum' || c.type === 'bool'))
      .flatMap((c) =>
        (c.type === 'bool' ? [true, false] : Object.keys(c.options!)).map((value) => ({
          id: c.id,
          value,
          grade: gradeOf(c.id, value)
        }))
      )
      .filter(({ grade }) => grade === undefined);
    expect(ungraded).toEqual([]);
  });
});

describe('unify', () => {
  const { raw } = readProvider('tests/fixtures/good.yml');
  const provider = unify(categories, 'good', raw as never, today);

  it('works out the eyes alliance from the headquarters', () => {
    expect(provider.criteria['jurisdiction.eyes']).toMatchObject({ value: 'none', grade: 'good' });
  });

  it('splits the cheapest price across devices', () => {
    expect(provider.criteria['pricing.per_connection'].value).toEqual({
      amount: 0.5,
      currency: 'EUR'
    });
  });

  it('keeps a hand-set grade over the rules', () => {
    expect(provider.criteria['logging.traffic'].grade).toBe('good');
  });

  it('expands shorthand values into full entries', () => {
    expect(provider.criteria['features.connections']).toEqual({
      value: 10,
      grade: 'good',
      sources: []
    });
  });

  it('flags a provider as stale six months after it was checked', () => {
    expect(provider.stale).toBe(false);
    expect(unify(categories, 'good', raw as never, new Date('2027-06-01')).stale).toBe(true);
  });
});

describe('dates near the edges', () => {
  it('counts back whole months from a leap day', () => {
    const audit = [{ date: '2026-02-28', auditor: 'Cure53', scope: 'no_logs' }];
    expect(grade(criteria.get('transparency.audits')!, audit, new Date('2028-02-29'))).toBe('good');
  });
});

describe('derived values that do not apply', () => {
  it('marks the per-device price n/a when devices are unlimited', () => {
    const { raw } = readProvider('tests/fixtures/good.yml');
    const unlimited = structuredClone(raw) as { criteria: { features: { connections: unknown } } };
    unlimited.criteria.features.connections = 'unlimited';
    expect(
      unify(categories, 'good', unlimited as never, today).criteria['pricing.per_connection']
    ).toMatchObject({ value: null, grade: 'na' });
  });
});
