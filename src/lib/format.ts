import { countryName } from '#lib/data/countries.ts';
import type { Criterion, Entry, Item, Price, Value } from '#lib/data/types.ts';

const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const month = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' });

export const formatDate = (iso: string, short = false) =>
  (short ? month : day).format(new Date(iso));

export const money = ({ amount, currency }: Price) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount);

const number = (value: number) =>
  value >= 10_000 ? new Intl.NumberFormat('en-GB').format(value) : String(value);

const units: Record<string, (value: number) => string> = {
  '%': (value) => `${value}%`,
  months: (value) => `${value} month${value === 1 ? '' : 's'}`,
  days: (value) => `${value} day${value === 1 ? '' : 's'}`
};

export const newestFirst = (items: Item[]) =>
  [...items].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

const shortUrl = (url: string) => url.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, '');

export const optionLabel = (criterion: Pick<Criterion, 'options'>, option: string) =>
  criterion.options?.[option] ?? option;

export function formatValue(criterion: Criterion, value: Value | undefined): string {
  if (value === undefined) return 'Not checked';
  if (value === null) return 'Unknown';
  const list = (items: string[]) => items.join(', ') || 'None';
  switch (criterion.type) {
    case 'bool':
      return value ? 'Yes' : 'No';
    case 'int':
      return (units[criterion.unit ?? ''] ?? number)(value as number);
    case 'limit':
      return value === 'unlimited' ? 'Unlimited' : String(value);
    case 'url':
      return shortUrl(value as string);
    case 'date':
      return formatDate(value as string);
    case 'country':
      return countryName(value as string);
    case 'countries':
      return list((value as string[]).map(countryName));
    case 'enum':
      return optionLabel(criterion, value as string);
    case 'set':
      return list((value as string[]).map((option) => optionLabel(criterion, option)));
    case 'list':
      return list(value as string[]);
    case 'price':
      return `${money(value as Price)}/mo`;
    case 'records': {
      const items = newestFirst(value as Item[]);
      if (!items.length) return 'None';
      const noun = criterion.label.toLowerCase().replace(/s$/, '');
      const latest = items[0].date ? `, latest ${formatDate(items[0].date, true)}` : '';
      return `${items.length} ${noun}${items.length === 1 ? '' : 's'}${latest}`;
    }
    default:
      return String(value);
  }
}

export const showEntry = (criterion: Criterion, entry: Entry | undefined) =>
  entry?.grade === 'na' && entry.value === null
    ? "Doesn't apply"
    : formatValue(criterion, entry?.value);
