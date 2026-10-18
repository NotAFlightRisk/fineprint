import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { entryOf, isLong } from './build.ts';
import { grade } from './grade.ts';
import type { Source } from './load.ts';
import { evidences, grades, type Category, type Criterion } from './types.ts';
import { slips } from './values.ts';

export interface Problem {
  file: string;
  line: number;
  path: string;
  message: string;
  warning?: boolean;
}

export const maxCitations = 8;

const slug = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const entryKeys = ['value', 'grade', 'evidence', 'note', 'sources'];
const topKeys = ['name', 'icon', 'checked', 'criteria', 'refs'];

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const unknownKey = (key: string, known: string[]) =>
  `"${key}" isn't something we track here - use one of ${known.join(', ')}`;

export function check(
  categories: Category[],
  sources: Source[],
  { icons, today }: { icons: string; today: Date }
): Problem[] {
  const problems: Problem[] = [];
  const names = new Map<string, string>();

  for (const source of sources) {
    const flag = (path: (string | number)[], message: string, warning = false) =>
      problems.push({
        file: source.file,
        line: source.lineOf(path),
        path: path
          .join('.')
          .replace(/^criteria\./, '')
          .replace(/\.(\d+)/g, '[$1]'),
        message,
        warning
      });

    for (const { line, message } of source.errors)
      problems.push({ file: source.file, line, path: '', message: `isn't valid YAML: ${message}` });
    if (source.errors.length) continue;

    const raw = source.raw;
    if (!isObject(raw)) {
      flag([], 'should be a YAML map, starting with name:');
      continue;
    }
    if (!slug.test(source.id))
      flag([], `the file name should be lowercase-with-dashes, like proton-vpn.yml`);

    for (const key of Object.keys(raw).filter((key) => !topKeys.includes(key)))
      flag([key], unknownKey(key, topKeys));

    if (typeof raw.name !== 'string' || !raw.name.trim()) flag(['name'], 'needs a name');
    else if (names.has(raw.name.toLowerCase()))
      flag(['name'], `is already used by ${names.get(raw.name.toLowerCase())}`);
    else names.set(raw.name.toLowerCase(), source.id);

    if (typeof raw.icon !== 'string' || !existsSync(join(icons, raw.icon)))
      flag(['icon'], `should name a file in static/icons, like ${source.id}.svg`);

    const checked = slips(raw.checked, { type: 'date' })[0];
    if (checked) flag(['checked'], checked.message);
    else if (String(raw.checked) > today.toISOString().slice(0, 10))
      flag(['checked'], "is in the future - it's the date you last checked everything");

    const refs = isObject(raw.refs) ? raw.refs : {};
    if (raw.refs != null && !isObject(raw.refs)) flag(['refs'], 'should be a map of sources');
    const citations = new Map(Object.keys(refs).map((id) => [id, 0]));
    const cite = (path: (string | number)[], id: unknown) => {
      if (citations.has(id as string))
        citations.set(id as string, citations.get(id as string)! + 1);
      else flag(path, `cites ${JSON.stringify(id)}, which isn't in refs at the bottom`);
    };

    for (const [id, ref] of Object.entries(refs)) {
      if (!slug.test(id)) flag(['refs', id], 'ref ids should be lowercase-with-dashes');
      const { url, title, ...extra } = isObject(ref) ? ref : {};
      if (Object.keys(extra).length) flag(['refs', id], 'refs only take url and title');
      const bad = slips(url, { type: 'url' })[0] ?? slips(title, { type: 'text' })[0];
      if (!isObject(ref) || bad) flag(['refs', id], 'should have a url (https://...) and a title');
    }

    if (!isObject(raw.criteria)) {
      flag(['criteria'], 'needs a criteria map, grouped by category');
      continue;
    }
    const given = raw.criteria;
    for (const id of Object.keys(given).filter((id) => !categories.some((c) => c.id === id)))
      flag(
        ['criteria', id],
        unknownKey(
          id,
          categories.map((category) => category.id)
        )
      );

    for (const category of categories) {
      const group = given[category.id] ?? {};
      if (!isObject(group)) {
        flag(['criteria', category.id], 'should be a map of criteria');
        continue;
      }
      const keys = category.criteria.map((criterion) => criterion.key);
      for (const key of Object.keys(group).filter((key) => !keys.includes(key)))
        flag(['criteria', category.id, key], unknownKey(key, keys));

      for (const criterion of category.criteria) {
        const path = ['criteria', category.id, criterion.key];
        if (!(criterion.key in group)) {
          if (criterion.required)
            flag(path.slice(0, 2), `needs ${criterion.key} - every provider has one`);
          continue;
        }
        if (criterion.derived) {
          flag(path, 'is worked out for you, so leave it out');
          continue;
        }
        checkEntry(group[criterion.key], criterion, path, flag, cite, today);
      }
    }

    for (const [id, count] of citations) {
      if (count === 0) flag(['refs', id], "isn't cited anywhere, so it can go", true);
      if (count > maxCitations)
        flag(
          ['refs', id],
          `is cited ${count} times - point at the specific page where you can`,
          true
        );
    }
  }
  return problems.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
}

function checkEntry(
  raw: unknown,
  criterion: Criterion,
  path: (string | number)[],
  flag: (path: (string | number)[], message: string, warning?: boolean) => void,
  cite: (path: (string | number)[], id: unknown) => void,
  today: Date
) {
  const long = isLong(raw);
  const entry = entryOf(raw) as Record<string, unknown>;
  const at = long ? [...path, 'value'] : path;

  if (long) {
    for (const key of Object.keys(entry).filter((key) => !entryKeys.includes(key)))
      flag([...path, key], unknownKey(key, entryKeys));
    if ('evidence' in entry && !evidences.includes(entry.evidence as never))
      flag([...path, 'evidence'], `should be one of ${evidences.join(', ')}`);
    if ('note' in entry && slips(entry.note, { type: 'text' }).length)
      flag([...path, 'note'], 'should be some text');
    if ('sources' in entry) {
      if (!Array.isArray(entry.sources))
        flag([...path, 'sources'], 'should be a list, like [policy]');
      else entry.sources.forEach((id, index) => cite([...path, 'sources', index], id));
    }
  }

  const found = slips(entry.value, criterion);
  for (const { at: inner, message } of found) flag([...at, ...inner], message);
  const future = (date: unknown) => typeof date === 'string' && date > today.toISOString();
  if (criterion.type === 'date' && future(entry.value)) flag(at, 'is in the future');
  if (criterion.type === 'records' && Array.isArray(entry.value))
    entry.value.forEach((item, index) => {
      if (!isObject(item)) return;
      if ('source' in item) cite([...at, index, 'source'], item.source);
      if (future(item.date)) flag([...at, index, 'date'], "is in the future - it hasn't happened yet");
    });
  if (found.length) return;

  const calculated = grade(criterion, entry.value as never, today);
  if (calculated === undefined)
    flag(at, `doesn't match any of the grading rules for ${criterion.id} - fix criteria.yml`);
  if (!('grade' in entry)) return;
  if (entry.grade !== null && !grades.includes(entry.grade as never))
    flag([...path, 'grade'], `should be one of ${grades.join(', ')} or null`);
  else if (entry.grade === calculated)
    flag([...path, 'grade'], 'matches what the rules give anyway, so it can go', true);
  else if (!entry.note)
    flag([...path, 'grade'], `overrides the rules (${calculated}), so it needs a note saying why`);
}
