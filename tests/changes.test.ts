import { describe, expect, it } from 'vitest';
import { unify } from '#lib/data/build.ts';
import { changeText, diff } from '#lib/data/changes.ts';
import { loadCriteria, readProvider } from '#lib/data/load.ts';
import { byId } from '#lib/summary.ts';

const categories = loadCriteria();
const criteria = byId(categories);
const { raw } = readProvider('tests/fixtures/good.yml');

// the fixture with one edit made, as it'd read on the site
const variant = (edit: (raw: any) => void = () => {}) => {
  const copy = structuredClone(raw) as any;
  edit(copy);
  return unify(categories, 'good', copy, new Date('2026-10-18'));
};
const before = variant();

describe('changelog diff', () => {
  it('records a new value as it read before and after, with its new grade', () => {
    const after = variant(
      (raw) => (raw.criteria.logging.dns = { value: 'yes', sources: ['policy'] })
    );
    expect(diff(criteria, before, after)?.changes).toEqual([
      { key: 'logging.dns', from: 'Not logged (verified)', to: 'Logged', grade: 'bad' }
    ]);
  });

  it('lists what joined and left a set, ignoring the order', () => {
    const platforms = (list: string[]) =>
      variant((raw) => (raw.criteria.clients = { platforms: list }));
    const change = diff(criteria, platforms(['ios', 'windows']), platforms(['android', 'ios']))
      ?.changes?.[0];
    expect(change).toMatchObject({
      key: 'clients.platforms',
      added: ['Android'],
      removed: ['Windows']
    });
    expect(changeText(change!)).toBe('added Android, dropped Windows');
    expect(
      diff(criteria, platforms(['ios', 'windows']), platforms(['windows', 'ios']))
    ).toBeUndefined();
  });

  it('notes a reworded note or an edited record without a before and after', () => {
    const after = variant((raw) => {
      raw.criteria.logging.traffic.note = 'Gone when you disconnect.';
      raw.criteria.transparency.audits[0].auditor = 'Cure53 GmbH';
    });
    expect(diff(criteria, before, after)?.changes).toEqual([
      { key: 'logging.traffic', grade: 'good' },
      { key: 'transparency.audits', grade: 'good' }
    ]);
  });

  it('notes an edited source on everything that cites it', () => {
    const after = variant((raw) => (raw.refs.policy.url = 'https://good.example/legal/privacy'));
    expect(diff(criteria, before, after)?.changes?.map(({ key }) => key)).toEqual([
      'logging.traffic',
      'logging.dns'
    ]);
  });

  it('skips a file whose edits never reach the site', () => {
    const after = variant((raw) => (raw.refs.spare = { url: 'https://x.example', title: 'Spare' }));
    expect(diff(criteria, before, after)).toBeUndefined();
  });

  it('marks a full recheck, a new provider and a removed one', () => {
    const named = { id: 'good', name: 'Good VPN' };
    const rechecked = variant((raw) => (raw.checked = '2026-11-01'));
    expect(diff(criteria, before, rechecked)).toEqual({ ...named, checked: true });
    expect(diff(criteria, undefined, before)).toEqual({ ...named, added: true });
    expect(diff(criteria, before)).toEqual({ ...named, removed: true });
  });
});
