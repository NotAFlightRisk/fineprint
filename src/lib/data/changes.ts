import type { Category, Change, Criterion, Entry, LogEntry, Provider } from '#lib/data/types.ts';
import { formatValue, showEntry } from '#lib/format.ts';

const lists = new Set(['set', 'list', 'countries']);
const graded = new Set(['good', 'ok', 'bad']);

const shown = (criterion: Criterion, entry?: Entry) => {
  const text = showEntry(criterion, entry);
  return entry?.evidence ? `${text} (${entry.evidence})` : text;
};

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function change(criterion: Criterion, before?: Entry, after?: Entry): Change | undefined {
  const key = criterion.id;
  const grade = after?.grade && graded.has(after.grade) ? { grade: after.grade } : {};
  const [was, now] = [before?.value, after?.value];
  const list = lists.has(criterion.type) && Array.isArray(was) && Array.isArray(now);

  if (list) {
    const [old, current] = [was, now] as string[][];
    const missing = (from: string[], to: string[]) =>
      from.filter((item) => !to.includes(item)).map((item) => formatValue(criterion, [item]));
    const [added, removed] = [missing(current, old), missing(old, current)];
    if (added.length || removed.length)
      return { key, ...(added.length && { added }), ...(removed.length && { removed }), ...grade };
  } else {
    const [from, to] = [shown(criterion, before), shown(criterion, after)];
    if (from !== to) return { key, from, to, ...grade };
  }

  // a reworded note, a new source, or a record edited without changing the count
  const details = (entry?: Entry) =>
    [entry?.note, entry?.sources, entry?.evidence, list ? 0 : entry?.value];
  if (!same(details(before), details(after))) return { key };
}

/** What changed in one provider's file, or nothing if none of it shows on the site */
export function diff(
  criteria: Map<string, Criterion>,
  before?: Provider,
  after?: Provider
): Omit<LogEntry, 'date'> | undefined {
  const { id, name } = (after ?? before)!;
  if (!before || !after) return { id, name, ...(after ? { added: true } : { removed: true }) };

  const changes = [...criteria.values()]
    .filter((criterion) => !criterion.derived)
    .map((criterion) =>
      change(criterion, before.criteria[criterion.id], after.criteria[criterion.id])
    )
    .filter((change) => change !== undefined);
  if (before.name !== after.name)
    changes.unshift({ key: 'name', from: before.name, to: after.name });

  const checked = before.checked !== after.checked;
  if (!changes.length && !checked) return;
  return { id, name, ...(checked && { checked: true }), ...(changes.length && { changes }) };
}

export const labelsOf = (categories: Category[]): Record<string, string> =>
  Object.fromEntries([
    ['name', 'Name'],
    ...categories.flatMap(({ criteria }) => criteria.map(({ id, label }) => [id, label]))
  ]);

// for a change that isn't a plain before and after
export function changeText({ added, removed }: Change) {
  const parts = [added && `added ${added.join(', ')}`, removed && `dropped ${removed.join(', ')}`];
  return parts.filter(Boolean).join(', ') || 'details updated';
}

export const changeKey = (entry: LogEntry) => `${entry.pr ?? entry.commit}-${entry.id}`;
