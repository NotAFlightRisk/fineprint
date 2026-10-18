import { countries, currencies } from './countries.ts';
import type { Criterion, Field } from './types.ts';

export interface Slip {
  at: (string | number)[];
  message: string;
}

type Spec = Pick<Criterion, 'options' | 'fields'> & { type: Criterion['type'] | Field['type'] };

const show = (value: unknown) => JSON.stringify(value);
const isDate = (value: unknown) =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  new Date(value).toISOString().startsWith(value);

const oneOf = (allowed: string[], value: unknown) =>
  allowed.includes(value as string)
    ? undefined
    : `${show(value)} isn't an option - use one of ${allowed.join(', ')}`;

const listOf = (value: unknown, each: (item: unknown) => string | undefined): Slip[] => {
  if (!Array.isArray(value)) return [{ at: [], message: 'should be a list, like [a, b]' }];
  const slips = value.flatMap((item, index) => {
    const message = each(item);
    return message ? [{ at: [index], message }] : [];
  });
  if (new Set(value).size !== value.length)
    slips.push({ at: [], message: 'lists something twice' });
  return slips;
};

const scalar: Partial<Record<Spec['type'], (value: unknown, spec: Spec) => string | undefined>> = {
  bool: (value) => (typeof value === 'boolean' ? undefined : 'should be true or false'),
  int: (value) =>
    Number.isInteger(value) && Number(value) >= 0 ? undefined : 'should be a whole number',
  limit: (value) =>
    value === 'unlimited' || (Number.isInteger(value) && Number(value) > 0)
      ? undefined
      : 'should be a whole number, or unlimited',
  text: (value) => (typeof value === 'string' && value.trim() ? undefined : 'should be some text'),
  url: (value) =>
    typeof value === 'string' && URL.canParse(value) && value.startsWith('https://')
      ? undefined
      : 'should be a full https:// link',
  date: (value) => (isDate(value) ? undefined : 'should be a date, like 2026-10-18'),
  country: (value) =>
    countries.includes(value as string)
      ? undefined
      : `${show(value)} isn't a country code - use two letters, like SE or GB`,
  enum: (value, spec) => oneOf(Object.keys(spec.options ?? {}), value),
  price: (value) => {
    const { amount, currency, ...extra } = (value ?? {}) as Record<string, unknown>;
    if (typeof value !== 'object' || Array.isArray(value) || Object.keys(extra).length)
      return 'should be { amount: 5, currency: EUR }';
    if (typeof amount !== 'number' || !/^\d+(\.\d{1,2})?$/.test(String(amount)))
      return 'amount should be a number with up to two decimal places';
    if (!currencies.includes(currency as string))
      return `${show(currency)} isn't a currency code - use three letters, like EUR or USD`;
  }
};

const record = (spec: Spec) => (item: unknown) => {
  if (typeof item !== 'object' || item === null || Array.isArray(item)) return 'should be a record';
  const fields = spec.fields ?? {};
  const known = [...Object.keys(fields), 'source'];
  const stray = Object.keys(item).find((key) => !known.includes(key));
  if (stray) return `has an unknown field "${stray}" - records take ${known.join(', ')}`;
  for (const [name, field] of Object.entries(fields)) {
    const value = (item as Record<string, unknown>)[name];
    if (value === undefined) return `is missing "${name}"`;
    const message = scalar[field.type]?.(value, field);
    if (message) return `${name} ${message}`;
  }
};

export function slips(value: unknown, spec: Spec): Slip[] {
  if (value === null) return [];
  const options = Object.keys(spec.options ?? {});
  const message = (text?: string) => (text ? [{ at: [], message: text }] : []);
  switch (spec.type) {
    case 'list':
      return listOf(value, (item) => scalar.text!(item, spec));
    case 'countries':
      return listOf(value, (item) => scalar.country!(item, spec));
    case 'set':
      return listOf(value, (item) => oneOf(options, item));
    case 'records':
      return listOf(value, record(spec));
    default:
      return message(scalar[spec.type]!(value, spec));
  }
}
