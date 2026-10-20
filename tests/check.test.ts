import { Ajv2020 } from 'ajv/dist/2020.js';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { check } from '#lib/data/check.ts';
import { loadCriteria, loadProviders, readProvider } from '#lib/data/load.ts';
import { providerSchema } from '#lib/data/schema.ts';

const categories = loadCriteria();
const today = new Date('2026-10-18');
const problemsIn = (file: string) =>
  check(categories, [readProvider(file)], { icons: 'tests/fixtures/icons', today });
const broken = problemsIn('tests/fixtures/broken.yml');
const said = (path: string) => broken.filter((problem) => problem.path === path);

describe('validator', () => {
  it('passes a well formed provider', () => {
    expect(problemsIn('tests/fixtures/good.yml')).toEqual([]);
  });

  it('names unknown keys and suggests real ones', () => {
    expect(said('colour')[0].message).toMatch(/use one of name, icon/);
    expect(said('vibes')[0].message).toMatch(/use one of identity/);
  });

  it('says which option was wrong and lists the right ones', () => {
    expect(said('logging.dns.value')[0].message).toBe(
      '"nope" isn\'t an option - use one of none, temporary, aggregate, yes'
    );
  });

  it('refuses derived values entered by hand', () => {
    expect(said('jurisdiction.eyes')[0].message).toMatch(/worked out for you/);
  });

  it('needs a note to override a grade, and only warns when it matches', () => {
    expect(said('logging.traffic.grade')[0].message).toMatch(/needs a note/);
    expect(said('logging.timestamps.grade')[0].warning).toBe(true);
  });

  it('catches citations of refs that do not exist, and refs nobody cites', () => {
    expect(said('logging.dns.sources[1]')[0].message).toMatch(/"missing"/);
    expect(said('refs.unused')[0].warning).toBe(true);
  });

  it('points at the line the problem is on', () => {
    expect(said('jurisdiction.hq')[0].line).toBe(10);
  });

  it('refuses records dated in the future', () => {
    expect(said('transparency.audits[1].date')[0].message).toMatch(/in the future/);
  });

  it('flags missing required criteria', () => {
    expect(said('logging')[0].message).toMatch(/needs policy/);
  });

  it('finds no errors in the real data', () => {
    const errors = check(categories, loadProviders(), {
      icons: resolve('static/icons'),
      today: new Date()
    }).filter((problem) => !problem.warning);
    expect(errors).toEqual([]);
  });
});

describe('editor schema', () => {
  const validate = new Ajv2020({ allErrors: true, strict: false }).compile(
    providerSchema(categories)
  );

  it('accepts every real provider file', () => {
    for (const { file, raw } of loadProviders()) expect(validate(raw), file).toBe(true);
  });

  it('rejects the broken fixture', () => {
    expect(validate(readProvider('tests/fixtures/broken.yml').raw)).toBe(false);
  });
});
