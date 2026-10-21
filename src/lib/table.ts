import type { Criterion, Entry, Grade, Price, Provider, Value } from '#lib/data/types.ts';
import { formatValue, inUsd, showEntry } from '#lib/format.ts';

const rank: Record<string, number> = { good: 0, ok: 1, bad: 2, na: 3 };

function measure(criterion: Criterion, value: Value): number | string {
  if (criterion.type === 'price') return inUsd(value as Price);
  if (value === 'unlimited') return Infinity;
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 0 : 1;
  if (Array.isArray(value)) return -value.length;
  return formatValue(criterion, value);
}

const gradeRank = (grade: Grade) => (grade === null || grade === 'info' ? 4 : rank[grade]);

export function compare(
  criterion: Criterion,
  a: Entry | undefined,
  b: Entry | undefined,
  direction: 1 | -1
) {
  const known = (entry?: Entry) => entry !== undefined && entry.value !== null;
  if (!known(a) || !known(b)) return Number(!known(a)) - Number(!known(b));
  const byGrade = gradeRank(a!.grade) - gradeRank(b!.grade);
  if (byGrade) return direction * byGrade;
  const [x, y] = [measure(criterion, a!.value), measure(criterion, b!.value)];
  return direction * (typeof x === 'number' ? x - (y as number) : x.localeCompare(y as string));
}

const quote = (cell: string) => (/[",\n]/.test(cell) ? `"${cell.replaceAll('"', '""')}"` : cell);

export function toCsv(providers: Provider[], columns: Criterion[]) {
  const header = ['Provider', ...columns.map((column) => column.label)];
  const rows = providers.map((provider) => [
    provider.name,
    ...columns.map((column) => showEntry(column, provider.criteria[column.id]))
  ]);
  return [header, ...rows].map((row) => row.map(quote).join(',')).join('\n');
}

export function download(name: string, type: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  Object.assign(document.createElement('a'), { href: url, download: name }).click();
  URL.revokeObjectURL(url);
}
