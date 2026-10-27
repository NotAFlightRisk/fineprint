import { eyes } from '#lib/data/countries.ts';
import { grade } from '#lib/data/grade.ts';
import { loadCriteria, loadProviders } from '#lib/data/load.ts';
import type { Category, Criterion, Dataset, Entry, Price, Provider, Ref, Value } from '#lib/data/types.ts';

export const staleAfterDays = 180;

type Raw = { name: string; icon: string; checked: string; criteria: RawCriteria; refs?: RawRefs };
type RawCriteria = Record<string, Record<string, unknown>>;
type RawRefs = Record<string, Ref>;

export const isLong = (raw: unknown): raw is Partial<Entry> & { value: Value } =>
  typeof raw === 'object' && raw !== null && !Array.isArray(raw) && 'value' in raw;

export const entryOf = (raw: unknown) => (isLong(raw) ? raw : { value: (raw ?? null) as Value });

function derive(criteria: Record<string, Entry>, criterion: Criterion): Partial<Entry> | undefined {
  const hq = criteria['jurisdiction.hq']?.value as string | null;
  const best = criteria['pricing.best']?.value as Price | null;
  const devices = criteria['features.connections']?.value;
  switch (criterion.id) {
    case 'jurisdiction.eyes':
      return hq ? { value: eyes(hq) } : undefined;
    case 'pricing.per_connection':
      if (best && devices === 'unlimited')
        return { value: null, grade: 'na', note: 'Unlimited devices, so there is no per-device price.' };
      if (!best || typeof devices !== 'number') return undefined;
      return {
        value: { amount: Math.round((best.amount / devices) * 100) / 100, currency: best.currency }
      };
  }
}

export function unify(categories: Category[], id: string, raw: Raw, today: Date): Provider {
  const criteria: Record<string, Entry> = {};
  const all = categories.flatMap((category) => category.criteria);
  const serious = new Set(all.filter((criterion) => criterion.serious).map(({ id }) => id));
  for (const criterion of all) {
    const given = raw.criteria[criterion.category]?.[criterion.key];
    const entry: Partial<Entry> | undefined = criterion.derived
      ? derive(criteria, criterion)
      : given === undefined
        ? { value: criterion.default }
        : entryOf(given);
    if (entry?.value === undefined) continue;
    const value = entry.value;
    criteria[criterion.id] = {
      sources: [],
      ...entry,
      value,
      grade: 'grade' in entry ? (entry.grade ?? null) : (grade(criterion, value, today) ?? null)
    };
  }

  const age = today.getTime() - new Date(raw.checked).getTime();
  return {
    id,
    name: raw.name,
    icon: raw.icon,
    checked: raw.checked,
    stale: age > staleAfterDays * 864e5,
    criteria,
    refs: raw.refs ?? {},
    // serious ones first, then in the order the site shows them
    flags: Object.keys(criteria)
      .filter((key) => criteria[key].grade === 'bad')
      .sort((a, b) => Number(serious.has(b)) - Number(serious.has(a)))
  };
}

export function dataset(today = new Date()): Dataset {
  const categories = loadCriteria();
  const providers = loadProviders()
    .map(({ id, raw }) => unify(categories, id, raw as Raw, today))
    .sort((a, b) => a.name.localeCompare(b.name));
  return { built: today.toISOString().slice(0, 10), categories, providers };
}
