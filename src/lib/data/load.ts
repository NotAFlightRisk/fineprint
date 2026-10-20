import { readdirSync, readFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { isMap, isSeq, LineCounter, parse, parseDocument, type Node } from 'yaml';
import type { Category } from '#lib/data/types.ts';

export const dataDir = resolve('data');

export interface Source {
  id: string;
  file: string;
  raw: unknown;
  errors: { line: number; message: string }[];
  lineOf: (path: (string | number)[]) => number;
}

export function loadCriteria(dir = dataDir): Category[] {
  const { categories } = parse(readFileSync(join(dir, 'criteria.yml'), 'utf8'));
  return categories.map(({ criteria, ...category }: Category) => ({
    ...category,
    criteria: criteria.map((criterion) => ({
      ...criterion,
      category: category.id,
      id: `${category.id}.${criterion.key}`
    }))
  }));
}

export function readProvider(file: string): Source {
  const lines = new LineCounter();
  const doc = parseDocument(readFileSync(file, 'utf8'), { lineCounter: lines });

  const lineOf = (path: (string | number)[]) => {
    let node: unknown = doc.contents;
    let offset = 0;
    for (const step of path) {
      const next = isMap(node)
        ? node.items.find(({ key }) => (key as { value?: unknown })?.value === step)
        : isSeq(node) && typeof step === 'number'
          ? { key: node.items[step], value: node.items[step] }
          : undefined;
      if (!next) break;
      offset = (next.key as Node | undefined)?.range?.[0] ?? offset;
      node = next.value;
    }
    return lines.linePos(offset).line;
  };

  return {
    id: basename(file, '.yml'),
    file,
    raw: doc.errors.length ? undefined : doc.toJS(),
    errors: doc.errors.map(({ linePos, message }) => ({
      line: linePos?.[0].line ?? 1,
      message: message.split('\n')[0]
    })),
    lineOf
  };
}

export const loadProviders = (dir = dataDir) =>
  readdirSync(join(dir, 'providers'))
    .filter((name) => name.endsWith('.yml'))
    .sort()
    .map((name) => readProvider(join(dir, 'providers', name)));
